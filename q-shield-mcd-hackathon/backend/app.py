from flask import Flask, request, jsonify
from flask_cors import CORS
from fhe_engine import QShield_FHE
from algosdk.v2client import algod
import math
import threading
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# CORS configuration - allow frontend origins
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)

engine = QShield_FHE()

# Algorand Testnet config
ALGOD_URL   = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
APP_ID      = 761624445

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)

# In-memory face descriptor store (duplicate prevention)
voted_descriptors = []
MATCH_THRESHOLD = 0.5

def euclidean_distance(d1, d2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(d1, d2)))

def has_face_voted(descriptor):
    for voted in voted_descriptors:
        if euclidean_distance(descriptor, voted) < MATCH_THRESHOLD:
            return True
    return False

def get_blockchain_vote_counts():
    """Algorand Testnet se live vote counts fetch karo"""
    try:
        app_info = algod_client.application_info(APP_ID)
        global_state = app_info["params"]["global-state"]
        counts = {"votes_alpha": 0, "votes_beta": 0}
        for item in global_state:
            import base64
            key = base64.b64decode(item["key"]).decode("utf-8", errors="ignore")
            if item["value"]["type"] == 2:
                val = item["value"]["uint"]
                if key == "votes_alpha":
                    counts["votes_alpha"] = val
                elif key == "votes_beta":
                    counts["votes_beta"] = val
        return counts
    except Exception as e:
        print(f"⚠️ Could not fetch blockchain counts: {e}")
        return None

@app.route('/vote-counts', methods=['GET'])
def vote_counts():
    counts = get_blockchain_vote_counts()
    if counts is None:
        return jsonify({"status": "error", "message": "Could not read blockchain"}), 500
    return jsonify({
        "status": "ok",
        "votes_alpha": counts["votes_alpha"],
        "votes_beta":  counts["votes_beta"],
        "app_id": APP_ID
    })

@app.route('/check-face', methods=['POST', 'OPTIONS'])
def check_face():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200
    data = request.json
    descriptor = data.get('descriptor')
    if not descriptor:
        return jsonify({"status": "error", "message": "No descriptor provided"}), 400
    if has_face_voted(descriptor):
        return jsonify({"status": "already_voted", "message": "This face has already cast a vote."}), 403
    return jsonify({"status": "ok"})

@app.route('/cast-vote', methods=['POST', 'OPTIONS'])
def cast_vote():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    data = request.json
    c_id       = data.get('candidate_id')
    descriptor = data.get('descriptor')

    if not descriptor:
        return jsonify({"status": "error", "message": "Face descriptor missing"}), 400

    if has_face_voted(descriptor):
        return jsonify({"status": "already_voted", "message": "This face has already cast a vote."}), 403

    # Face descriptor turant register karo (duplicate prevention)
    voted_descriptors.append(descriptor)

    # Blockchain push background thread mein karo
    # Isse frontend ko turant response milega — no timeout/connection reset
    def push_to_blockchain():
        try:
            payload = engine.encrypt_and_push(c_id)
            print(f"✅ Background blockchain push done for candidate {c_id}")
        except Exception as e:
            print(f"⚠️ Background blockchain push failed: {e}")

    thread = threading.Thread(target=push_to_blockchain, daemon=True)
    thread.start()

    return jsonify({
        "status": "success",
        "message": "Vote accepted and being pushed to blockchain",
        "app_id": APP_ID
    })

if __name__ == '__main__':
    # use_reloader=False — Flask reloader se thread conflict avoid karo
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)
