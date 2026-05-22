from algokit_utils import AlgorandClient
from smart_contracts.artifacts.q_shield_voting.q_shield_voting_client import QShieldVotingFactory

def run_qshield_demo():
    print("🚀 Initializing Q-Shield Local Environment...")
    
    # 1. Connect to LocalNet
    algorand = AlgorandClient.default_localnet()
    
    # Ek dummy deployer account banate hain
    deployer = algorand.account.random()
    
    # 🔴 THE FIX: 'dispenser()' ki jagah 'localnet_dispenser()' lagaya
    dispenser = algorand.account.localnet_dispenser()
    
    algorand.account.ensure_funded(
        account_to_fund=deployer.address, 
        dispenser_account=dispenser, 
        min_spending_balance=10_000_000
    )

    # 2. Deploy the Contract (Vault)
    print("📦 Deploying Smart Contract Vault...")
    factory = QShieldVotingFactory(algorand)
    client, _ = factory.deploy(
        on_schema_break="append", 
        on_update="append",
        compilation_params={"deletable": True, "updatable": True}
    )
    print(f"✅ Vault Deployed Successfully! App ID: {client.app_id}")

    # ==========================================
    # 3. Interacting with the Vault
    # ==========================================
    
    print("\n🟢 Step A: Admin Starts the Election...")
    client.start_election(transaction_parameters={"sender": deployer.address})
    print(f"Is Voting Active? -> {client.is_voting_active().return_value}")

    print("\n🔐 Step B: Casting FHE Encrypted Vote...")
    dummy_fhe_payload = "0x8fa92b...[MASSIVE_QUANTUM_RESISTANT_DATA]...3c9"
    
    # Box storage fee pay karne ke liye payment
    algorand.send.payment(
        sender=deployer.address, 
        receiver=client.app_address, 
        amount=1_000_000
    )
    
    try:
        client.cast_vote(
            fhe_encrypted_payload=dummy_fhe_payload, 
            transaction_parameters={"sender": deployer.address}
        )
        print("✅ Vote Successfully Stored in Algorand Box Storage!")
    except Exception as e:
        print(f"❌ Failed to cast vote: {e}")

    print("\n🔴 Step C: Admin Stops the Election...")
    client.stop_election(transaction_parameters={"sender": deployer.address})
    print(f"Is Voting Active? -> {client.is_voting_active().return_value}")
    
    print("\n🎉 Q-Shield Blockchain Architecture End-to-End Test Complete!")

if __name__ == "__main__":
    run_qshield_demo()