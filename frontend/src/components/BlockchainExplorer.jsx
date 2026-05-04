import { useState } from 'react';

// ─── TESTNET CONFIG ───────────────────────────────────────────────
const APP_ID = 761621541;
const ALGOD_URL = 'https://testnet-api.algonode.cloud';
// ─────────────────────────────────────────────────────────────────

function b64ToString(b64) {
  try { return atob(b64); } catch { return b64; }
}

export default function BlockchainExplorer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchChainData = async () => {
    setLoading(true);
    setError('');
    setData(null);

    try {
      const appRes = await fetch(`${ALGOD_URL}/v2/applications/${APP_ID}`);
      if (!appRes.ok) throw new Error(`App ${APP_ID} not found on Testnet.`);
      const appData = await appRes.json();

      // Parse global state into a readable object
      const globalState = {};
      for (const kv of appData.params['global-state'] || []) {
        const key = b64ToString(kv.key);
        globalState[key] = kv.value.type === 1
          ? kv.value.bytes   // bytes (base64)
          : kv.value.uint;   // uint
      }

      setData({
        appId: APP_ID,
        isActive: globalState['is_voting_active'] === 1,
        votesAlpha: globalState['votes_alpha'] || 0,
        votesBeta: globalState['votes_beta'] || 0,
        totalVotes: (globalState['votes_alpha'] || 0) + (globalState['votes_beta'] || 0),
      });

    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const total = data?.totalVotes || 0;
  const alphaPercent = total > 0 ? ((data.votesAlpha / total) * 100).toFixed(1) : 0;
  const betaPercent  = total > 0 ? ((data.votesBeta  / total) * 100).toFixed(1) : 0;

  return (
    <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-6 mt-8 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400">⛓️ Blockchain Explorer</h2>
          <p className="text-gray-400 text-sm mt-1">
            Live data from Algorand Testnet —{' '}
            <a
              href={`https://explorer.perawallet.app/testnet/application/${APP_ID}/`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline"
            >
              App ID {APP_ID}
            </a>
          </p>
        </div>
        <button
          onClick={fetchChainData}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-5 py-2 rounded-lg font-bold text-white transition-all"
        >
          {loading ? '🔄 Fetching...' : '🔍 Fetch Chain Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-500/40 text-red-400 p-4 rounded-lg mb-4 text-sm">
          ❌ {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{data.appId}</div>
              <div className="text-gray-400 text-sm mt-1">App ID (Testnet)</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${data.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {data.isActive ? '🟢 LIVE' : '🔴 CLOSED'}
              </div>
              <div className="text-gray-400 text-sm mt-1">Election Status</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{data.totalVotes}</div>
              <div className="text-gray-400 text-sm mt-1">Total Votes on Chain</div>
            </div>
          </div>

          {/* Live Vote Counts */}
          <div className="bg-gray-800 rounded-lg p-5 space-y-4">
            <h3 className="text-white font-bold text-lg mb-2">� Live On-Chain Vote Count</h3>

            {/* Alpha */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white font-semibold">Party Alpha (Progress & Tech)</span>
                <span className="text-cyan-400 font-bold">{data.votesAlpha} votes</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-cyan-500 h-4 rounded-full transition-all duration-700"
                  style={{ width: `${alphaPercent}%` }}
                />
              </div>
              <div className="text-right text-gray-400 text-xs mt-1">{alphaPercent}%</div>
            </div>

            {/* Beta */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-white font-semibold">Party Beta (Sustainability)</span>
                <span className="text-green-400 font-bold">{data.votesBeta} votes</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-700"
                  style={{ width: `${betaPercent}%` }}
                />
              </div>
              <div className="text-right text-gray-400 text-xs mt-1">{betaPercent}%</div>
            </div>
          </div>

          <p className="text-gray-600 text-xs text-center">
            Data fetched live from Algorand Testnet via Algonode public API
          </p>
        </div>
      )}
    </div>
  );
}
