import React, { useState } from 'react';

const BACKEND_URL = 'http://127.0.0.1:5001';

export default function TallyResults() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTally = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await fetch(`${BACKEND_URL}/tally`);
      const data = await res.json();
      if (data.status === 'no_votes') {
        setError('No votes cast yet.');
      } else {
        setResults(data);
      }
    } catch (e) {
      setError('Cannot connect to backend. Ensure it is running on port 5001.');
    }
    setLoading(false);
  };

  const total = results?.total_votes || 0;
  const alpha = results?.results?.['Party Alpha (Progress & Tech)'] || 0;
  const beta = results?.results?.['Party Beta (Sustainability)'] || 0;
  const alphaPercent = total > 0 ? ((alpha / total) * 100).toFixed(1) : 0;
  const betaPercent = total > 0 ? ((beta / total) * 100).toFixed(1) : 0;

  return (
    <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 mt-8 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-purple-400">🔐 FHE Vote Tally</h2>
          <p className="text-gray-400 text-sm mt-1">Decrypted from homomorphic sum — individual votes never revealed</p>
        </div>
        <button
          onClick={fetchTally}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-5 py-2 rounded-lg font-bold text-white transition-all"
        >
          {loading ? '🔄 Decrypting...' : '📊 Reveal Tally'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-500/40 text-red-400 p-4 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {/* Total votes */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-4xl font-bold text-white">{total}</div>
            <div className="text-gray-400 text-sm mt-1">Total Votes Cast</div>
          </div>

          {/* Alpha */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold">Party Alpha (Progress & Tech)</span>
              <span className="text-cyan-400 font-bold text-xl">{alpha} votes</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-cyan-500 h-4 rounded-full transition-all duration-700"
                style={{ width: `${alphaPercent}%` }}
              ></div>
            </div>
            <div className="text-right text-gray-400 text-sm mt-1">{alphaPercent}%</div>
          </div>

          {/* Beta */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold">Party Beta (Sustainability)</span>
              <span className="text-green-400 font-bold text-xl">{beta} votes</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-700"
                style={{ width: `${betaPercent}%` }}
              ></div>
            </div>
            <div className="text-right text-gray-400 text-sm mt-1">{betaPercent}%</div>
          </div>

          {/* FHE note */}
          <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-300 text-center">
            🔒 {results.fhe_note}
          </div>
        </div>
      )}
    </div>
  );
}
