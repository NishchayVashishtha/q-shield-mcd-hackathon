from flask import Flask, request, jsonify
from flask_cors import CORS
from fhe_engine import QShield_FHE
import math

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

engine = QShield_FHE()

# Stores raw face descriptors of people who have voted
voted_descriptors = []
MATCH_THRESHOLD = 0.5  # Same threshold logic as face-api.js (lower = stricter)

def euclidean_distance(d1, d2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(d1, d2)))

def has_face_voted(descriptor):
    for voted in voted_descriptors:
        if euclidean_distance(descriptor, voted) < MATCH_THRESHOLD:
            return True
    return False

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

@app.route('/cast-vote', methods=['POST', 'OPTIONS'])
def cast_vote():
    if request.method == 'OPTIONS': return jsonify({"status": "ok"}), 200
    data = request.json
    c_id = data.get('candidate_id')
    descriptor = data.get('descriptor')

    if not descriptor:
        return jsonify({"status": "error", "message": "Face descriptor missing"}), 400

    # Final duplicate check at submission time
    if has_face_voted(descriptor):
        return jsonify({"status": "already_voted", "message": "This face has already cast a vote."}), 403

    payload = engine.encrypt_and_push(c_id)

    # Register this face as having voted
    voted_descriptors.append(descriptor)

    return jsonify({
        "status": "success",
        "payload_preview": payload[:15],
        "app_id": 1008
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)