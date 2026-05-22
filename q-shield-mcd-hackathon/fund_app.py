"""Fund the smart contract app account for box storage"""
import os, sys
from pathlib import Path
from algokit_utils import AlgorandClient, SigningAccount
from algokit_utils.models.amount import AlgoAmount
from algosdk import mnemonic, account as algo_account
from algosdk.v2client import algod

# Load mnemonic
env_path = Path(__file__).parent / "mart-contracts/projects/mart-contracts/.env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

mn = os.environ.get("DEPLOYER_MNEMONIC")
pk = mnemonic.to_private_key(mn)
addr = algo_account.address_from_private_key(pk)
deployer = SigningAccount(private_key=pk, address=addr)

algorand = AlgorandClient.testnet()

APP_ID   = 761621541
app_info = algorand.client.algod.application_info(APP_ID)
app_addr = app_info["params"]["creator"]  # app address

# Correct app address from algosdk
from algosdk import logic
app_addr = logic.get_application_address(APP_ID)
print(f"App address: {app_addr}")

# Check current balance
info = algorand.client.algod.account_info(app_addr)
balance = info.get("amount", 0)
print(f"Current balance: {balance / 1_000_000} ALGO")

if balance < 500_000:
    print("Funding app account with 1 ALGO for box storage...")
    from algokit_utils.transactions.transaction_composer import PaymentParams
    result = algorand.send.payment(
        PaymentParams(
            sender=deployer.address,
            signer=deployer.signer,
            receiver=app_addr,
            amount=AlgoAmount(algo=1),
        )
    )
    print(f"✅ Funded! TxID: {result.tx_id}")
    print(f"🔗 https://testnet.explorer.perawallet.app/tx/{result.tx_id}/")
else:
    print(f"✅ App already has enough balance: {balance / 1_000_000} ALGO")
