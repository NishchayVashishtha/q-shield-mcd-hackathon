import { useState } from 'react';
import BlockchainExplorer from './components/BlockchainExplorer';
import TallyResults from './components/TallyResults';

const ADMIN_PASSWORD = 'qshield2026'; // change this to your own password

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('❌ Incorrect password.');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-10 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">Election Commission</h1>
          <p className="text-gray-400 text-sm mb-8">Admin access only. Authorized personnel only.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all"
            >
              LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center p-6 font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          Q-Shield Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Election Commission — Authorized Access Only</p>
      </header>

      <div className="w-full max-w-4xl space-y-6">
        {/* Live blockchain vote counts */}
        <BlockchainExplorer />

        {/* FHE decrypted tally */}
        <TallyResults />
      </div>
    </div>
  );
}
