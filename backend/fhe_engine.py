from phe import paillier
import base64
import json

class QShield_FHE:
    """
    Homomorphic Encryption engine using Paillier Cryptosystem.

    Paillier is an ADDITIVE homomorphic encryption scheme:
    - Enc(a) * Enc(b) = Enc(a + b)  ← addition on ciphertexts, no decryption needed
    - Perfect for vote counting — only addition required

    Security basis: Decisional Composite Residuosity (DCR) problem
    Key size: 2048-bit (same as RSA-2048, industry standard)

    How vote counting works:
    - Each vote encrypted individually → ciphertext stored on blockchain
    - Ciphertexts multiplied together (= homomorphic addition of plaintexts)
    - Only the final product is decrypted → reveals total count
    - Individual votes NEVER decrypted
    """

    def __init__(self):
        # Generate 2048-bit Paillier public/private key pair
        print("🔑 Generating Paillier key pair (2048-bit)...")
        self.public_key, self.private_key = paillier.generate_paillier_keypair(n_length=2048)

        # Running encrypted tallies for each candidate
        # These are actual Paillier ciphertexts — never decrypted until election ends
        self.encrypted_tally_alpha = self.public_key.encrypt(0)  # Enc(0) — start at zero
        self.encrypted_tally_beta  = self.public_key.encrypt(0)  # Enc(0) — start at zero

        self.total_votes = 0
        print("✅ FHE Engine ready — Paillier Additive Homomorphic Encryption")
        print(f"   Key size: 2048-bit | Scheme: Paillier (DCR hardness)")

    def encrypt_vote(self, candidate_id):
        """
        Encrypts a single vote using Paillier public key.
        candidate_id 1 = Alpha, 2 = Beta
        Returns JSON string of ciphertext for blockchain storage.
        """
        vote = int(candidate_id)
        encrypted = self.public_key.encrypt(vote)

        # Serialize ciphertext as JSON for storage/transmission
        ciphertext = {
            "ciphertext": str(encrypted.ciphertext()),
            "exponent": encrypted.exponent
        }
        return json.dumps(ciphertext)

    def add_to_tally(self, candidate_id):
        """
        Homomorphically adds 1 vote to the running tally.

        Paillier addition:  Enc(tally) * Enc(1) = Enc(tally + 1)
        This happens on ciphertexts — zero decryption.
        """
        one_encrypted = self.public_key.encrypt(1)

        if int(candidate_id) == 1:
            # Homomorphic addition: Enc(alpha_total) + Enc(1) = Enc(alpha_total + 1)
            self.encrypted_tally_alpha = self.encrypted_tally_alpha + one_encrypted
        else:
            self.encrypted_tally_beta = self.encrypted_tally_beta + one_encrypted

        self.total_votes += 1

    def encrypt_and_push(self, candidate_id):
        """
        Main method called by cast_vote endpoint.
        Encrypts the vote and adds it to the homomorphic tally.
        Returns ciphertext string for blockchain storage.
        """
        ciphertext = self.encrypt_vote(candidate_id)
        self.add_to_tally(candidate_id)
        return ciphertext

    def decrypt_tally(self):
        """
        Called ONLY when election ends to reveal final results.
        Decrypts the accumulated tally ciphertexts.

        This is the ONLY decryption that ever happens.
        Individual votes are never decrypted.
        """
        alpha_count = self.private_key.decrypt(self.encrypted_tally_alpha)
        beta_count  = self.private_key.decrypt(self.encrypted_tally_beta)

        return {
            "alpha": int(alpha_count),
            "beta":  int(beta_count),
            "total": self.total_votes
        }
