 import React, { useState, useEffect, useRef } from 'react';
// Priyanshu ka watchdog AI import kar rahe hain
import { calculateTrustScore } from 'ai-engine';
import axios from 'axios';
export default function VoteForm({ onVoteSuccess , onBotDetected, faceHash, credentialId }) {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [status, setStatus] = useState('');
  const [txId, setTxId] = useState('');
  const [isCasting, setIsCasting] = useState(false);

  // Background trackers (Ref use kar rahe hain taaki re-renders par reset na ho)
  const startTime = useRef(Date.now());
  const mouseEvents = useRef([]);
  const pasteAttempts = useRef(0);

  // Mouse aur Paste movements track karne ka effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Har movement ko array mein push karo
      mouseEvents.current.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    };

    const handlePaste = () => {
      pasteAttempts.current += 1;
    };

    // Listeners lagao
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('paste', handlePaste);

    return () => {
      // Component unmount hone par listeners hata do (Memory leak roko)
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleVoteSubmit = async () => {
    if (!selectedCandidate) {
      setStatus("⚠️ Please select a candidate first!");
      return;
    }

    setIsCasting(true);
    setStatus("Analyzing behavior... 🔍");

    const sessionData = {
      startTime: startTime.current,
      endTime: Date.now(),
      mouseEvents: mouseEvents.current,
      pasteAttempts: pasteAttempts.current
    };

    const trustResult = calculateTrustScore(sessionData);

    setTimeout(async () => {
      if (trustResult.isHuman) {
        // --- TERA ASLI KAAM YAHAN SE START HOTA HAI ---
        setStatus("🔐 AI Verified! Encrypting Vote with FHE...");
        
        try {
          const BACKEND_URL = "http://127.0.0.1:5001";

          // First: check if this face has already voted
          const checkRes = await axios.post(`${BACKEND_URL}/check-face`, { descriptor: faceHash });
          if (checkRes.data.status === 'already_voted') {
            setStatus("🚫 You have already cast your vote. Duplicate vote rejected.");
            setIsCasting(false);
            return;
          }

          // Then: submit the vote with the descriptor
          const response = await axios.post(`${BACKEND_URL}/cast-vote`, {
            candidate_id: selectedCandidate === 'Alpha' ? 1 : 2,
            descriptor: faceHash,
            credential_id: credentialId
          });

          if (response.data.status === "success") {
            setStatus(`✅ Your vote has been securely submitted!`);
            setTimeout(() => onVoteSuccess(selectedCandidate, trustResult.score), 3000);
          }
        } catch (err) {
          console.error(err);
          if (err.response?.data?.status === 'already_voted') {
            setStatus("🚫 You have already cast your vote. Duplicate vote rejected.");
          } else {
            setStatus("❌ Encryption Bridge Failed!");
          }
          setIsCasting(false);
        }
        // --- TERA KAAM KHATAM ---
      } else {
        setStatus(`🚨 BOT DETECTED! Reason: ${trustResult.reason}`);
        setIsCasting(false);
        setTimeout(() => { if (onBotDetected) onBotDetected(); }, 3000);
      }
    }, 1500);
  };

  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl mt-8 w-full border border-gray-700">
      <h3 className="text-2xl font-bold text-center mb-6 text-white">Select Your Candidate</h3>
      
      <div className="space-y-4 mb-8">
        {/* Candidate 1 */}
        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedCandidate === 'Alpha' ? 'border-cyan-400 bg-gray-700' : 'border-gray-600 hover:border-gray-400'}`}>
          <input type="radio" name="candidate" value="Alpha" className="hidden" onChange={(e) => setSelectedCandidate(e.target.value)} />
          <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${selectedCandidate === 'Alpha' ? 'border-cyan-400' : 'border-gray-500'}`}>
            {selectedCandidate === 'Alpha' && <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>}
          </div>
          <span className="text-xl font-semibold text-white">Party Alpha (Progress & Tech)</span>
        </label>

        {/* Candidate 2 */}
        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedCandidate === 'Beta' ? 'border-cyan-400 bg-gray-700' : 'border-gray-600 hover:border-gray-400'}`}>
          <input type="radio" name="candidate" value="Beta" className="hidden" onChange={(e) => setSelectedCandidate(e.target.value)} />
          <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${selectedCandidate === 'Beta' ? 'border-cyan-400' : 'border-gray-500'}`}>
            {selectedCandidate === 'Beta' && <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>}
          </div>
          <span className="text-xl font-semibold text-white">Party Beta (Sustainability)</span>
        </label>
      </div>

      {status && (
        <div className={`mb-4 text-center font-bold p-3 rounded ${status.includes('BOT') ? 'bg-red-900/50 text-red-400' : 'bg-gray-900 text-cyan-300'}`}>
          {status}
        </div>
      )}

      <button 
        onClick={handleVoteSubmit} 
        disabled={isCasting}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-lg shadow-lg text-lg disabled:opacity-50 transition-all"
      >
        {isCasting ? "Encrypting & Submitting..." : "SUBMIT SECURE VOTE"}
      </button>
    </div>
  );
}