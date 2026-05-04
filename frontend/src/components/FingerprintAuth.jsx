import React, { useState } from 'react';

const BACKEND_URL = 'http://127.0.0.1:5001';

// Convert ArrayBuffer to base64url string
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export default function FingerprintAuth({ onFingerprintSuccess }) {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFingerprint = async () => {
    setLoading(true);
    setStatus('🔐 Requesting fingerprint / Touch ID...');

    try {
      // Use create() to trigger biometric directly — no prior registration needed.
      // We use the credential ID from the result as the unique voter fingerprint identity.
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'Q-Shield Voting', id: window.location.hostname },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: 'voter@qshield',
            displayName: 'Q-Shield Voter'
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },   // ES256
            { type: 'public-key', alg: -257 }  // RS256
          ],
          authenticatorSelection: {
            userVerification: 'required',        // forces biometric
            residentKey: 'discouraged'
          },
          timeout: 60000
        }
      });

      const credentialId = bufferToBase64url(credential.rawId);
      console.log('🔍 Fingerprint credential ID:', credentialId);

      // Check with backend if this credential has already voted
      const verifyRes = await fetch(`${BACKEND_URL}/verify-fingerprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_id: credentialId })
      });

      const verifyData = await verifyRes.json();
      console.log('🔍 Fingerprint verify response:', verifyData);

      if (verifyData.status === 'already_voted') {
        setStatus('🚫 This fingerprint has already cast a vote. Duplicate access denied.');
        setLoading(false);
        return;
      }

      setStatus('✅ Fingerprint Verified!');
      setTimeout(() => onFingerprintSuccess(credentialId), 1500);

    } catch (err) {
      console.error('Fingerprint error:', err);
      if (err.name === 'NotAllowedError') {
        setStatus('❌ Fingerprint cancelled or denied.');
      } else if (err.message?.includes('fetch')) {
        setStatus('❌ Cannot connect to backend. Ensure it is running on port 5001.');
      } else {
        setStatus(`❌ Error: ${err.message}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-900 text-white rounded-lg shadow-xl max-w-md mx-auto mt-6 border border-cyan-500/30">
      <div className="text-6xl mb-4">🫆</div>
      <h2 className="text-2xl font-bold mb-2 text-cyan-400">Fingerprint Verification</h2>
      <p className="text-gray-400 text-sm text-center mb-6">
        Use your device biometric (Touch ID / fingerprint) to confirm your identity.
        Each fingerprint can only vote once.
      </p>

      {status && (
        <div className={`mb-4 text-center font-semibold p-3 rounded w-full ${
          status.includes('🚫') || status.includes('❌') 
            ? 'bg-red-900/50 text-red-400' 
            : 'bg-gray-800 text-cyan-300'
        }`}>
          {status}
        </div>
      )}

      <button
        onClick={handleFingerprint}
        disabled={loading}
        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-8 py-3 rounded-lg font-bold w-full shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'SCAN FINGERPRINT / TOUCH ID'}
      </button>
    </div>
  );
}
