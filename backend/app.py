from flask import Flask, request, jsonify
from flask_cors import CORS
from fhe_engine import QShield_FHE
import math
import os
import base64
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

engine = QShield_FHE()

# --- Algorand Testnet Setup ---
ALGO_APP_ID = int(os.environ.get("ALGO_APP_ID", 761621541))
ALGO_MNEMONIC = os.environ.get("ALGO_MNEMONIC", "")

def cast_vote_on_chain(candidate_id, ciphertext):
    """Calls the smart contract cast_vote method on Algorand Testnet."""
    try:
        from algosdk import mnemonic as algo_mnemonic
        from algosdk.v2client import algod
        from algosdk.atomic_transaction_composer import AtomicTransactionComposer, AccountTransactionSigner, TransactionWithSigner
        from algosdk.abi import Method
        from algosdk import encoding, transaction

        # Connect to testnet
        algod_client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")

        # Load main account from mnemonic (funds fresh voter accounts)
        main_private_key = algo_mnemonic.to_private_key(ALGO_MNEMONIC)
        from algosdk.account import address_from_private_key, generate_account
        main_address = address_from_private_key(main_private_key)

        # Generate a fresh keypair for this voter — each vote from unique address
        fresh_private_key, fresh_address = generate_account()
        fresh_signer = AccountTransactionSigner(fresh_private_key)

        sp = algod_client.suggested_params()

        # Fund the fresh account with enough ALGO for fees + box storage MBR
        fund_txn = transaction.PaymentTxn(
            sender=main_address,
            sp=sp,
            receiver=fresh_address,
            amt=500_000  # 0.5 ALGO
        )
        fund_signed = fund_txn.sign(main_private_key)
        algod_client.send_transaction(fund_signed)
        transaction.wait_for_confirmation(algod_client, fund_signed.get_txid(), 4)
        print(f"✅ Fresh voter account funded: {fresh_address}")

        sender = fresh_address
        signer = fresh_signer

        cast_vote_method = Method.from_signature("cast_vote(string,uint64)void")
        payload = ciphertext[:500]
        sp = algod_client.suggested_params()

        # Box references for has_voted and encrypted_votes
        sender_bytes = encoding.decode_address(sender)
        boxes = [
            (ALGO_APP_ID, b"has_voted" + sender_bytes),
            (ALGO_APP_ID, b"encrypted_votes" + sender_bytes),
        ]

        # Box storage MBR payment from fresh account to app
        sp_pay = algod_client.suggested_params()
        app_info = algod_client.application_info(ALGO_APP_ID)
        app_address = encoding.encode_address(
            encoding.checksum(b"appID" + ALGO_APP_ID.to_bytes(8, "big"))
        )
        pay_txn = transaction.PaymentTxn(
            sender=fresh_address,
            sp=sp_pay,
            receiver=app_address,
            amt=25000
        )

        atc = AtomicTransactionComposer()
        atc.add_transaction(
            TransactionWithSigner(txn=pay_txn, signer=signer)
        )
        atc.add_method_call(
            app_id=ALGO_APP_ID,
            method=cast_vote_method,
            sender=sender,
            sp=sp,
            signer=signer,
            method_args=[payload, int(candidate_id)],
            boxes=boxes
        )

        result = atc.execute(algod_client, 4)
        tx_id = result.tx_ids[-1]
        print(f"✅ Vote cast on-chain! TxID: {tx_id}")
        return tx_id

    except Exception as e:
        print(f"⚠️ On-chain cast failed: {e}")
        return None

# --- Face duplicate store ---
voted_descriptors = []
MATCH_THRESHOLD = 0.5

def euclidean_distance(d1, d2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(d1, d2)))

def has_face_voted(descriptor):
    for voted in voted_descriptors:
        if euclidean_distance(descriptor, voted) < MATCH_THRESHOLD:
            return True
    return False

# --- Fingerprint duplicate store ---
voted_credential_ids = set()

def generate_challenge():
    return base64.urlsafe_b64encode(os.urandom(32)).rstrip(b'=').decode()

# ─────────────────────────────────────────
@app.route('/check-face', methods=['POST', 'OPTIONS'])
def check_face():
    if request.method == 'OPTIONS': return jsonify({"status": "ok"}), 200
    data = request.json
    descriptor = data.get('descriptor')
    if not descriptor:
        return jsonify({"status": "error", "message": "No descriptor provided"}), 400
    if has_face_voted(descriptor):
        return jsonify({"status": "already_voted", "message": "This face has already cast a vote."}), 403
    return jsonify({"status": "ok"})

@app.route('/fingerprint-challenge', methods=['POST', 'OPTIONS'])
def fingerprint_challenge():
    if request.method == 'OPTIONS': return jsonify({"status": "ok"}), 200
    challenge = generate_challenge()
    return jsonify({"challenge": challenge, "credential_ids": list(voted_credential_ids)})

@app.route('/verify-fingerprint', methods=['POST', 'OPTIONS'])
def verify_fingerprint():
    if request.method == 'OPTIONS': return jsonify({"status": "ok"}), 200
    data = request.json
    credential_id = data.get('credential_id')
    if not credential_id:
        return jsonify({"status": "error", "message": "No credential_id provided"}), 400
    if credential_id in voted_credential_ids:
        return jsonify({"status": "already_voted", "message": "This fingerprint has already cast a vote."}), 403
    return jsonify({"status": "ok"})

@app.route('/cast-vote', methods=['POST', 'OPTIONS'])
def cast_vote():
    if request.method == 'OPTIONS': return jsonify({"status": "ok"}), 200
    data = request.json
    c_id = data.get('candidate_id')
    descriptor = data.get('descriptor')
    credential_id = data.get('credential_id')

    if not descriptor:
        return jsonify({"status": "error", "message": "Face descriptor missing"}), 400
    if not credential_id:
        return jsonify({"status": "error", "message": "Fingerprint credential missing"}), 400

    # Duplicate checks
    if has_face_voted(descriptor):
        return jsonify({"status": "already_voted", "message": "This face has already cast a vote."}), 403
    if credential_id in voted_credential_ids:
        return jsonify({"status": "already_voted", "message": "This fingerprint has already cast a vote."}), 403

    # Paillier FHE encrypt + add to homomorphic tally
    ciphertext = engine.encrypt_and_push(c_id)

    # Register face and fingerprint
    voted_descriptors.append(descriptor)
    voted_credential_ids.add(credential_id)

    # Push to Algorand Testnet blockchain
    tx_id = cast_vote_on_chain(c_id, ciphertext)

    return jsonify({
        "status": "success",
        "payload_preview": ciphertext[:30] + "...",
        "fhe_scheme": "Paillier Additive Homomorphic Encryption",
        "total_votes": engine.total_votes,
        "app_id": ALGO_APP_ID,
        "tx_id": tx_id or "offline"
    })

@app.route('/tally', methods=['GET', 'OPTIONS'])
def tally():
    if request.method == 'OPTIONS': return jsonify({"status": "ok"}), 200
    if engine.total_votes == 0:
        return jsonify({"status": "no_votes", "message": "No votes cast yet."})
    results = engine.decrypt_tally()
    return jsonify({
        "status": "success",
        "results": {
            "Party Alpha (Progress & Tech)": results["alpha"],
            "Party Beta (Sustainability)": results["beta"]
        },
        "total_votes": results["total"],
        "fhe_note": "Tally computed via homomorphic addition. Individual votes were never decrypted."
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
