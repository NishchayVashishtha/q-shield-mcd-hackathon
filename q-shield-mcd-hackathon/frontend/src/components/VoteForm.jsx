import React, { useState, useEffect, useRef } from 'react';
import { calculateTrustScore } from 'ai-engine';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5001";
const APP_ID = import.meta.env.VITE_APP_ID || "761621541";

export default function VoteForm({ onVoteSuccess, onBotDetected, faceHash }) {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [status, setStatus] = useState('');
  const [isCasting, setIsCasting] = useState(false);

  // Live vote counts from blockchain
  const [voteCounts, setVoteCounts] = useState({ alpha: null, beta: null });
  const [loadingCounts, setLoadingCounts] = useState(false);

  const startTime = useRef(Date.now());
  const mouseEvents = useRef([]);
  const pasteAttempts = useRef(0);

  // Blockchain se live vote counts fetch karo
  const fetchVoteCounts = async () => {
    setLoadingCounts(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/vote-counts`);
      if (res.data.status === "ok") {
        setVoteCounts({ alpha: res.data.votes_alpha, beta: res.data.votes_beta });
      }
    } catch (err) {
      console.error("Could not fetch vote counts:", err);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Component mount hone par aur har 10 seconds mein counts refresh karo
  useEffect(() => {
    fetchVoteCounts();
    const interval = setInterval(fetchVoteCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseEvents.current.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    };
    const handlePaste = () => { pasteAttempts.current += 1; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('paste', handlePaste);
    return () => {
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
        setStatus("🔐 AI Verified! Encrypting Vote with FHE...");

        try {
          // Step 1: Face duplicate check
          const checkRes = await axios.post(`${BACKEND_URL}/check-face`, { descriptor: faceHash });
          if (checkRes.data.status === 'already_voted') {
            setStatus("🚫 You have already cast your vote. Duplicate vote rejected.");
            setIsCasting(false);
            return;
          }

          // Step 2: Vote submit
          const response = await axios.post(`${BACKEND_URL}/cast-vote`, {
            candidate_id: selectedCandidate === 'Alpha' ? 1 : 2,
            descriptor: faceHash
          });

          if (response.data.status === "success") {
            setStatus(`✅ Vote recorded on Blockchain! (App: ${response.data.app_id})`);
            // Vote ke baad counts refresh karo
            await fetchVoteCounts();
            setTimeout(() => onVoteSuccess(selectedCandidate, trustResult.score), 2000);
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
      } else {
        setStatus(`🚨 BOT DETECTED! Reason: ${trustResult.reason}`);
        setIsCasting(false);
        setTimeout(() => { if (onBotDetected) onBotDetected(); }, 3000);
      }
    }, 1500);
  };

  // Progress bar width calculate karo
  const totalVotes = (voteCounts.alpha || 0) + (voteCounts.beta || 0);
  const alphaPercent = totalVotes > 0 ? Math.round((voteCounts.alpha / totalVotes) * 100) : 50;
  const betaPercent = totalVotes > 0 ? Math.round((voteCounts.beta / totalVotes) * 100) : 50;

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

      {/* ⛓️ LIVE BLOCKCHAIN VOTE COUNT */}
      <div className="mb-6 bg-gray-900 rounded-xl p-4 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">⛓️ Live Blockchain Count</h4>
          <button
            onClick={fetchVoteCounts}
            disabled={loadingCounts}
            className="text-xs text-gray-400 hover:text-cyan-400 transition-colors"
          >
            {loadingCounts ? "⟳ Syncing..." : "↻ Refresh"}
          </button>
        </div>

        {voteCounts.alpha === null ? (
          <p className="text-gray-500 text-sm text-center">Loading from blockchain...</p>
        ) : (
          <>
            {/* Alpha Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-cyan-300 font-semibold">Party Alpha</span>
                <span className="text-white font-bold">{voteCounts.alpha} votes ({alphaPercent}%)</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${alphaPercent}%` }}
                />
              </div>
            </div>

            {/* Beta Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-300 font-semibold">Party Beta</span>
                <span className="text-white font-bold">{voteCounts.beta} votes ({betaPercent}%)</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${betaPercent}%` }}
                />
              </div>
            </div>

            <p className="text-gray-500 text-xs text-center mt-2">
              Total: {totalVotes} vote{totalVotes !== 1 ? 's' : ''} • App ID: {APP_ID}
            </p>
          </>
        )}
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
