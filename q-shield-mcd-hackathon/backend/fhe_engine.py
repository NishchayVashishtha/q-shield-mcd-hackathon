import os
import json
import base64
import struct
import hashlib
from pathlib import Path
from cryptography.fernet import Fernet
from algokit_utils import AlgorandClient, SigningAccount
from algosdk import mnemonic, account as algo_account
from algosdk.v2client import algod as algod_module
from algosdk import transaction as algo_txn
from algosdk.atomic_transaction_composer import (
    AtomicTransactionComposer,
    AccountTransactionSigner,
    TransactionWithSigner,
)

APP_ID    = 761624445
ALGOD_URL = "https://testnet-api.algonode.cloud"

# ── ABI method selectors ──────────────────────────────────────────────────────
def method_selector(sig: str) -> bytes:
    return hashlib.new("sha512_256", sig.encode()).digest()[:4]

CAST_VOTE_SEL     = method_selector("cast_vote(string,uint64)void")
START_ELECTION_SEL = method_selector("start_election()void")

# ── ABI encoding helpers ──────────────────────────────────────────────────────
def abi_encode_string(s: str) -> bytes:
    """ARC4 string: 2-byte big-endian length + utf-8 bytes"""
    b = s.encode("utf-8")
    return struct.pack(">H", len(b)) + b

def abi_encode_uint64(n: int) -> bytes:
    """ARC4 uint64: 8 bytes big-endian"""
    return struct.pack(">Q", n)


class QShield_FHE:
    def __init__(self):
        self.key    = Fernet.generate_key()
        self.cipher = Fernet(self.key)
        self.algorand    = None
        self.deployer_pk = None
        self.deployer_address = None
        self.algod = algod_module.AlgodClient("", ALGOD_URL)

        # Load .env
        env_path = Path(__file__).parent.parent / \
            "mart-contracts/projects/mart-contracts/.env"
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, _, v = line.partition("=")
                        os.environ.setdefault(k.strip(), v.strip())

        mn = os.environ.get("DEPLOYER_MNEMONIC")
        if not mn:
            print("⚠️  DEPLOYER_MNEMONIC not set")
            return

        self.deployer_pk      = mnemonic.to_private_key(mn)
        self.deployer_address = algo_account.address_from_private_key(self.deployer_pk)

        try:
            self.algorand = AlgorandClient.testnet()
            print(f"✅ Connected to Algorand Testnet | Deployer: {self.deployer_address}")
        except Exception as e:
            print(f"⚠️  Testnet connection failed: {e}")

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _get_global_uint(self, key: str) -> int:
        try:
            for item in self.algod.application_info(APP_ID)["params"]["global-state"]:
                k = base64.b64decode(item["key"]).decode("utf-8", errors="ignore")
                if k == key and item["value"]["type"] == 2:
                    return item["value"]["uint"]
        except Exception:
            pass
        return 0

    def _fresh_sp(self):
        """Always fetch fresh suggested_params — never reuse stale ones"""
        return self.algod.suggested_params()

    def _send_deployer_call(self, method_sel: bytes, args: list) -> str:
        """Send an ABI call signed by the deployer account"""
        sp = self._fresh_sp()
        app_args = [method_sel] + args
        txn = algo_txn.ApplicationCallTxn(
            sender=self.deployer_address,
            sp=sp,
            index=APP_ID,
            on_complete=algo_txn.OnComplete.NoOpOC,
            app_args=app_args,
        )
        signer = AccountTransactionSigner(self.deployer_pk)
        atc = AtomicTransactionComposer()
        atc.add_transaction(TransactionWithSigner(txn=txn, signer=signer))
        result = atc.execute(self.algod, wait_rounds=4)
        return result.tx_ids[0]

    def ensure_election_active(self):
        if self._get_global_uint("is_voting_active") == 0:
            print("🟡 Starting election on blockchain...")
            txid = self._send_deployer_call(START_ELECTION_SEL, [])
            print(f"✅ Election started! TxID: {txid}")

    # ── Core: fund + vote in ONE atomic group ─────────────────────────────────

    def encrypt_and_push(self, candidate_id: int) -> str:
        """
        Encrypt vote and push to Algorand Testnet.

        Strategy: Generate a fresh ephemeral account per vote.
        Bundle the funding payment + cast_vote call into a SINGLE
        atomic transaction group so both use the same fresh params
        and there is no timing gap between fund and spend.
        """
        encrypted = self.cipher.encrypt(str(candidate_id).encode()).decode()

        if not self.deployer_pk:
            print("⚠️  No deployer key — skipping blockchain push")
            return encrypted

        try:
            self.ensure_election_active()

            # Fresh ephemeral account for this vote
            voter_pk, voter_addr = algo_account.generate_account()
            print(f"🆕 Ephemeral voter: {voter_addr}")

            # ONE fresh suggested_params for the whole group
            sp = self._fresh_sp()

            # Txn 1: Deployer → voter_addr
            # 101_000 microAlgo = 0.1 ALGO min balance + 1_000 fee
            fund_txn = algo_txn.PaymentTxn(
                sender=self.deployer_address,
                sp=sp,
                receiver=voter_addr,
                amt=101_000,
            )

            # Txn 2: voter_addr → App  (cast_vote ABI call)
            vote_txn = algo_txn.ApplicationCallTxn(
                sender=voter_addr,
                sp=sp,
                index=APP_ID,
                on_complete=algo_txn.OnComplete.NoOpOC,
                app_args=[
                    CAST_VOTE_SEL,
                    abi_encode_string(encrypted),
                    abi_encode_uint64(candidate_id),
                ],
            )

            # Sign both — ATC handles group ID automatically
            deployer_signer = AccountTransactionSigner(self.deployer_pk)
            voter_signer    = AccountTransactionSigner(voter_pk)

            atc = AtomicTransactionComposer()
            atc.add_transaction(TransactionWithSigner(txn=fund_txn, signer=deployer_signer))
            atc.add_transaction(TransactionWithSigner(txn=vote_txn, signer=voter_signer))

            print(f"📡 Sending atomic group | candidate={candidate_id} | voter={voter_addr[:12]}...")
            result = atc.execute(self.algod, wait_rounds=4)

            txid = result.tx_ids[1]   # vote txn ID
            print(f"✅ Vote on blockchain! TxID: {txid}")
            print(f"🔗 https://testnet.explorer.perawallet.app/tx/{txid}/")

        except Exception as e:
            print(f"⚠️  Blockchain push failed: {e}")

        return encrypted
