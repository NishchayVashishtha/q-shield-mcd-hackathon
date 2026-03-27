import algopy
from algopy import ARC4Contract, String, Account, Global, Txn, arc4, BoxMap

class QShieldVoting(ARC4Contract):
    def __init__(self) -> None:
        # Contract deploy karne wala admin hoga (Nishchay)
        self.admin = Global.creator_address
        # 0 = Inactive, 1 = Active
        self.is_voting_active = algopy.UInt64(0) 
        
        # BOX STORAGE: Ye Algorand ka special feature hai bade data (FHE) ke liye
        self.encrypted_votes = BoxMap(Account, String)
        self.has_voted = BoxMap(Account, algopy.UInt64)

    @arc4.abimethod
    def start_election(self) -> None:
        """Admin election start karega"""
        assert Txn.sender == self.admin, "Unauthorized: Only Admin can start the election."
        self.is_voting_active = algopy.UInt64(1)

    @arc4.abimethod
    def stop_election(self) -> None:
        """Admin election stop karega"""
        assert Txn.sender == self.admin, "Unauthorized: Only Admin can stop the election."
        self.is_voting_active = algopy.UInt64(0)

    @arc4.abimethod
    def cast_vote(self, fhe_encrypted_payload: String) -> None:
        """User apna FHE encrypted vote daalega"""
        # Rule 1: Election on hona chahiye
        assert self.is_voting_active == algopy.UInt64(1), "Election is currently closed."
        
        voter = Txn.sender
        
        # Rule 2: Double voting check (Box Storage se check kar rahe hain)
        already_voted = self.has_voted.get(voter, default=algopy.UInt64(0))
        assert already_voted == algopy.UInt64(0), "Fraud Alert: You have already cast your vote!"
        
        # Rule 3: Store the FHE payload safely in Box Storage
        self.encrypted_votes[voter] = fhe_encrypted_payload
        self.has_voted[voter] = algopy.UInt64(1)