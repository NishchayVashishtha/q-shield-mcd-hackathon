"""
Q-Shield Testnet V2 Deployment — TEAL se seedha deploy
No-box-check version: multiple votes allowed (backend handles dedup)
"""
import os, sys, json, base64
from pathlib import Path
from algokit_utils import AlgorandClient, SigningAccount
from algokit_utils.models.amount import AlgoAmount
from algokit_utils.transactions.transaction_composer import PaymentParams
from algosdk import mnemonic, account as algo_account, transaction as algo_txn, encoding
from algosdk.atomic_transaction_composer import (
    AtomicTransactionComposer, AccountTransactionSigner, TransactionWithSigner
)

# .env load
env_path = Path(__file__).parent / "mart-contracts/projects/mart-contracts/.env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

DEPLOYER_MNEMONIC = os.environ.get("DEPLOYER_MNEMONIC")
if not DEPLOYER_MNEMONIC:
    print("❌ DEPLOYER_MNEMONIC not set"); sys.exit(1)

pk      = mnemonic.to_private_key(DEPLOYER_MNEMONIC)
addr    = algo_account.address_from_private_key(pk)
signer  = AccountTransactionSigner(pk)
algorand = AlgorandClient.testnet()
algod   = algorand.client.algod

print(f"🔑 Deployer : {addr}")
bal = algod.account_info(addr)["amount"] / 1e6
print(f"💰 Balance  : {bal} ALGO")

# ── APPROVAL TEAL (no box storage, no has_voted check) ──────────────────────
APPROVAL_TEAL = """\
#pragma version 11
#pragma typetrack false

// QShieldVoting approval — v2 (no box, counter only)
main:
    intcblock 0 1
    bytecblock "is_voting_active" "votes_alpha" "votes_beta" "admin"
    txn ApplicationID
    bnz main_after_if_else@2
    bytec_3 // "admin"
    global CreatorAddress
    app_global_put
    bytec_0 // "is_voting_active"
    intc_0 // 0
    app_global_put
    bytec_1 // "votes_alpha"
    intc_0 // 0
    app_global_put
    bytec_2 // "votes_beta"
    intc_0 // 0
    app_global_put

main_after_if_else@2:
    txn NumAppArgs
    bz main___algopy_default_create@8
    txn OnCompletion
    !
    assert
    txn ApplicationID
    assert
    pushbytess 0xe1babd62 0xe61f3551 0x6085524f // start_election()void, stop_election()void, cast_vote(string,uint64)void
    txna ApplicationArgs 0
    match start_election stop_election cast_vote
    err

main___algopy_default_create@8:
    txn OnCompletion
    !
    txn ApplicationID
    !
    &&
    return

// start_election
start_election:
    txn Sender
    intc_0 // 0
    bytec_3 // "admin"
    app_global_get_ex
    assert // check self.admin exists
    ==
    assert // Unauthorized: Only Admin can start the election.
    bytec_0 // "is_voting_active"
    intc_1 // 1
    app_global_put
    intc_1 // 1
    return

// stop_election
stop_election:
    txn Sender
    intc_0 // 0
    bytec_3 // "admin"
    app_global_get_ex
    assert // check self.admin exists
    ==
    assert // Unauthorized: Only Admin can stop the election.
    bytec_0 // "is_voting_active"
    intc_0 // 0
    app_global_put
    intc_1 // 1
    return

// cast_vote(string,uint64)void
cast_vote:
    // Validate string arg
    txna ApplicationArgs 1
    dup
    intc_0 // 0
    extract_uint16
    pushint 2
    +
    dig 1
    len
    ==
    assert // invalid string length
    extract 2 0
    // Validate uint64 arg
    txna ApplicationArgs 2
    dup
    len
    pushint 8
    ==
    assert // invalid uint64 length
    btoi
    // Check election active
    intc_0 // 0
    bytec_0 // "is_voting_active"
    app_global_get_ex
    assert // check is_voting_active exists
    intc_1 // 1
    ==
    assert // Election is currently closed.
    // candidate_id == 1 ? votes_alpha++ : votes_beta++
    intc_1 // 1
    ==
    bz cast_vote_beta@2
    intc_0 // 0
    bytec_1 // "votes_alpha"
    app_global_get_ex
    assert // check votes_alpha exists
    intc_1 // 1
    +
    bytec_1 // "votes_alpha"
    swap
    app_global_put
    intc_1 // 1
    return

cast_vote_beta@2:
    intc_0 // 0
    bytec_2 // "votes_beta"
    app_global_get_ex
    assert // check votes_beta exists
    intc_1 // 1
    +
    bytec_2 // "votes_beta"
    swap
    app_global_put
    intc_1 // 1
    return
"""

CLEAR_TEAL = """\
#pragma version 11
#pragma typetrack false
pushint 1
return
"""

# Compile TEAL
print("🔨 Compiling TEAL...")
approval_result = algod.compile(APPROVAL_TEAL)
clear_result    = algod.compile(CLEAR_TEAL)
approval_bytes  = base64.b64decode(approval_result["result"])
clear_bytes     = base64.b64decode(clear_result["result"])
print("✅ TEAL compiled!")

# Deploy
sp = algod.suggested_params()
txn = algo_txn.ApplicationCreateTxn(
    sender=addr,
    sp=sp,
    on_complete=algo_txn.OnComplete.NoOpOC,
    approval_program=approval_bytes,
    clear_program=clear_bytes,
    global_schema=algo_txn.StateSchema(num_uints=3, num_byte_slices=1),
    local_schema=algo_txn.StateSchema(num_uints=0, num_byte_slices=0),
)

atc = AtomicTransactionComposer()
atc.add_transaction(TransactionWithSigner(txn=txn, signer=signer))
print("🚀 Deploying to Testnet...")
result = atc.execute(algod, wait_rounds=4)
txid = result.tx_ids[0]

# Get App ID from transaction
txn_info = algod.pending_transaction_info(txid)
app_id = txn_info.get("application-index")
if not app_id:
    # Try confirmed transaction
    import time; time.sleep(3)
    confirmed = algod.pending_transaction_info(txid)
    app_id = confirmed.get("application-index", "UNKNOWN")

print("\n" + "🔥"*30)
print(f"  ✅ NEW TESTNET APP ID : {app_id}")
print(f"  🔗 Explorer : https://testnet.explorer.perawallet.app/application/{app_id}/")
print("🔥"*30 + "\n")

# Update frontend .env
fe = Path(__file__).parent / "frontend/.env"
fe.write_text(f"# Algorand Testnet App ID\nVITE_APP_ID={app_id}\n")
print(f"✅ frontend/.env updated: VITE_APP_ID={app_id}")
print(f"\n⚠️  Update APP_ID in backend/fhe_engine.py and backend/app.py to: {app_id}")
