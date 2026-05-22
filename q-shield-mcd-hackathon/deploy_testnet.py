"""
Q-Shield Testnet Deployment Script
Run from project root: python q-shield-mcd-hackathon/deploy_testnet.py
"""
import os
import sys
from pathlib import Path

# .env manually load karo
env_path = Path(__file__).parent / "mart-contracts/projects/mart-contracts/.env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip())

from algokit_utils import AlgorandClient, SigningAccount
from algosdk import mnemonic, account as algo_account

def deploy():
    deployer_mnemonic = os.environ.get("DEPLOYER_MNEMONIC")
    if not deployer_mnemonic:
        print("❌ DEPLOYER_MNEMONIC not found in .env")
        sys.exit(1)

    # Account setup
    private_key = mnemonic.to_private_key(deployer_mnemonic)
    deployer_address = algo_account.address_from_private_key(private_key)
    deployer = SigningAccount(private_key=private_key, address=deployer_address)

    print(f"🔑 Deployer: {deployer.address}")
    print(f"🌐 Network : Algorand Testnet")

    # Testnet connect
    algorand = AlgorandClient.testnet()

    # Balance check
    info = algorand.client.algod.account_info(deployer.address)
    balance = info["amount"] / 1_000_000
    print(f"💰 Balance : {balance} ALGO")

    if balance < 1:
        print("❌ Balance too low! Get free ALGO from https://bank.testnet.algorand.network/")
        sys.exit(1)

    # ARC56 JSON — compiled output se seedha lo (nested path)
    # algokit compile ne nested path mein output diya tha
    nested_artifact = (
        Path(__file__).parent
        / "mart-contracts/projects/mart-contracts/smart_contracts/q_shield_voting"
        / "q-shield-mcd-hackathon/mart-contracts/projects/mart-contracts/smart_contracts/artifacts/q_shield_voting"
        / "QShieldVoting.arc56.json"
    )
    standard_artifact = (
        Path(__file__).parent
        / "mart-contracts/projects/mart-contracts/smart_contracts/artifacts/q_shield_voting"
        / "QShieldVoting.arc56.json"
    )

    if nested_artifact.exists():
        arc56_file = nested_artifact
    elif standard_artifact.exists():
        arc56_file = standard_artifact
    else:
        print("❌ No .arc56.json found!")
        sys.exit(1)

    print(f"📄 Using spec: {arc56_file.name} from {arc56_file.parent.name}")

    # source field hata do — algokit byteCode se seedha deploy karega
    import json
    spec_data = json.loads(arc56_file.read_text())
    spec_data.pop("source", None)          # TEAL source remove — byteCode use hoga
    spec_data.pop("sourceInfo", None)      # source map bhi hata do
    clean_spec = json.dumps(spec_data)

    # Deploy
    factory = algorand.client.get_app_factory(
        app_spec=clean_spec,
        default_sender=deployer.address,
        default_signer=deployer.signer,
    )

    print("🚀 Deploying to Testnet...")
    app_client, result = factory.deploy(
        on_schema_break="append",
        on_update="append",
    )

    app_id = app_client.app_id
    print("\n" + "🔥" * 30)
    print(f"  ✅ TESTNET APP ID : {app_id}")
    print(f"  🔗 Explorer       : https://testnet.explorer.perawallet.app/application/{app_id}/")
    print("🔥" * 30 + "\n")

    # Auto-update frontend .env
    frontend_env = Path(__file__).parent / "frontend/.env"
    frontend_env.write_text(f"# Algorand Testnet App ID\nVITE_APP_ID={app_id}\n")
    print(f"✅ frontend/.env updated with VITE_APP_ID={app_id}")

    return app_id

if __name__ == "__main__":
    deploy()
