from flask import Flask, request, jsonify
from flask_cors import CORS
from fhe_engine import QShield_FHE

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True) # CORS Fix

engine = QShield_FHE()

@app.route('/cast-vote', methods=['POST', 'OPTIONS'])
def cast_vote():
    if request.method == 'OPTIONS': return jsonify({"status": "ok"}), 200
    
    data = request.json
    c_id = data.get('candidate_id')
    payload = engine.encrypt_and_push(c_id)
    
    return jsonify({
        "status": "success", 
        "payload_preview": payload[:15],
        "app_id": 1008
    })

if __name__ == '__main__':
    # host='0.0.0.0' is important for 2-laptop setup!
    app.run(host='0.0.0.0', port=5001, debug=True)