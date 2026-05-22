import urllib.request, json

data = json.dumps({'candidate_id': 1, 'descriptor': [0.77]*128}).encode()
req = urllib.request.Request(
    'http://127.0.0.1:5001/cast-vote',
    data=data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
r = urllib.request.urlopen(req, timeout=60)
print("Response:", json.loads(r.read()))
