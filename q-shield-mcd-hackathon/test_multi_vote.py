"""Test 3 unique voters — all should go to blockchain"""
import urllib.request, json, time

BACKEND = "http://127.0.0.1:5001"

def cast(candidate_id, descriptor_val, label):
    data = json.dumps({
        'candidate_id': candidate_id,
        'descriptor': [descriptor_val] * 128
    }).encode()
    req = urllib.request.Request(
        f"{BACKEND}/cast-vote",
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp = json.loads(urllib.request.urlopen(req, timeout=30).read())
    print(f"  {label}: {resp['status']}")

def get_counts():
    r = urllib.request.urlopen(f"{BACKEND}/vote-counts", timeout=10)
    d = json.loads(r.read())
    return d['votes_alpha'], d['votes_beta']

print("=== Before votes ===")
a, b = get_counts()
print(f"  Alpha: {a}  |  Beta: {b}")

print("\n=== Casting 3 votes ===")
cast(1, 0.111, "Voter A → Alpha")
cast(2, 0.555, "Voter B → Beta")
cast(1, 0.888, "Voter C → Alpha")

print("\n⏳ Waiting 15s for blockchain to confirm...")
time.sleep(15)

print("\n=== After votes ===")
a2, b2 = get_counts()
print(f"  Alpha: {a2}  |  Beta: {b2}")
print(f"\n  Alpha +{a2-a}  |  Beta +{b2-b}")

if (a2 - a) == 2 and (b2 - b) == 1:
    print("\n✅ ALL 3 VOTES RECORDED CORRECTLY!")
else:
    print(f"\n⚠️  Expected Alpha+2, Beta+1 — got Alpha+{a2-a}, Beta+{b2-b}")
