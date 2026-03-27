from dataclasses import dataclass
from typing import Optional, Tuple
import algokit_utils


# -------------------------------
# ARGUMENTS
# -------------------------------
@dataclass
class CastVoteArgs:
    fhe_encrypted_payload: str


# -------------------------------
# MAIN CLIENT
# -------------------------------
class QShieldVotingClient:
    def __init__(self, app_client: algokit_utils.AppClient):
        self.client = app_client

    # -------------------------------
    # CORE METHODS
    # -------------------------------
    def start_election(self):
        return self.client.send.call(
            algokit_utils.AppClientMethodCallParams(
                method="start_election()void"
            )
        )

    def stop_election(self):
        return self.client.send.call(
            algokit_utils.AppClientMethodCallParams(
                method="stop_election()void"
            )
        )

    def cast_vote(self, args: Tuple[str] | CastVoteArgs):
        if isinstance(args, CastVoteArgs):
            args = (args.fhe_encrypted_payload,)

        return self.client.send.call(
            algokit_utils.AppClientMethodCallParams(
                method="cast_vote(string)void",
                args=list(args),
            )
        )

    # -------------------------------
    # STATE METHODS
    # -------------------------------
    def get_admin(self) -> str:
        return self.client.state.global_state.get_value("admin")

    def is_voting_active(self) -> int:
        return self.client.state.global_state.get_value("is_voting_active")

    def has_voted(self, address: str) -> Optional[int]:
        return self.client.state.box.get_map_value("has_voted", address)

    def get_vote(self, address: str) -> Optional[str]:
        return self.client.state.box.get_map_value("encrypted_votes", address)


# -------------------------------
# FACTORY (OPTIONAL)
# -------------------------------
class QShieldVotingFactory:
    def __init__(self, algorand_client):
        self.algorand = algorand_client

    def get_client(self, app_id: int) -> QShieldVotingClient:
        app_client = algokit_utils.AppClient(
            algokit_utils.AppClientParams(
                algorand=self.algorand,
                app_id=app_id,
            )
        )
        return QShieldVotingClient(app_client)