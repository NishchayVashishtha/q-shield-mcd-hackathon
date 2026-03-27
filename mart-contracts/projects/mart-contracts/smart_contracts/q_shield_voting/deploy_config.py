from pathlib import Path
from algokit_utils import AlgorandClient, AlgoAmount

def deploy(*args, **kwargs) -> None:
    # 1. Connect and Fund
    algorand = AlgorandClient.default_localnet()
    deployer = algorand.account.random()
    
    algorand.account.ensure_funded(
        account_to_fund=deployer.address,
        dispenser_account=algorand.account.localnet_dispenser(),
        min_spending_balance=AlgoAmount(algo=10)
    )

    # 2. Seedha JSON uthao (Bypass the broken python client)
    artifact_dir = Path(__file__).parent.parent / "artifacts" / "q_shield_voting"
    arc56_file = next(artifact_dir.glob("*.arc56.json"))
    
    # 3. Raw Engine ko JSON do
    factory = algorand.client.get_app_factory(
        app_spec=arc56_file.read_text(),
        default_sender=deployer.address
    )

    # 4. Deploy!
    app_client, _ = factory.deploy(
        on_schema_break="append",
        on_update="append"
    )

    print("\n" + "🔥"*25)
    print(f"👉 VAULT APP ID: {app_client.app_id} 👈")
    print("🔥"*25 + "\n")