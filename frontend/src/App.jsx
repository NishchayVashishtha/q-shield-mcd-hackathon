import React, { useState } from 'react';
import FaceScanner from './components/FaceScanner';
import VoteForm from './components/VoteForm';
import { loadAIModels, extractIDDescriptor, verifyLivenessAndMatch } from "./gatekeeper.js";
// --- NAYA CODE: Algorand Imports ---
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import appSpec from "./QShieldVoting.arc56.json";
// -----------------------------------

function App() {
  // Ye state track karegi ki user verify hua ya nahi
  const [isVerified, setIsVerified] = useState(false);

  // --- NAYA CODE: Vault Connection State & Function ---
  const [vaultStatus, setVaultStatus] = useState("");

  const testVaultConnection = async () => {
    try {
      setVaultStatus("🟡 Connecting...");

      const algorand = AlgorandClient.defaultLocalNet();
      const appClient = algorand.client.getAppClient({
        appSpec: JSON.stringify(appSpec),
        appId: 1008n, // Teri live App ID!
      });

      const globalState = await appClient.getGlobalState();
      console.log("Tijori ke andar ka data:", globalState);

      setVaultStatus("🟢 Connected to Vault 1008!");
    } catch (error) {
      console.error(error);
      setVaultStatus("🔴 Connection Failed");
    }
  };
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans">

      {/* Header Section */}
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-tight">
          Q-Shield
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Quantum-Resistant & Privacy-First E-Voting</p>

        {/* --- NAYA CODE: Test Connection Button --- */}
        <div className="mt-4">
          <button
            onClick={testVaultConnection}
            className="bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
          >
            {vaultStatus || "🔌 Test Vault 1008 Connection"}
          </button>
        </div>
        {/* --------------------------------------- */}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl">
        {!isVerified ? (
          // Jab tak verify nahi hota, scanner dikhao
          <FaceScanner onVerificationSuccess={() => setIsVerified(true)} />
        ) : (
          // Verify hone ke baad ye screen aayegi (Jahan hum baad mein VoteForm lagayenge)
          <div className="bg-gray-900 p-10 rounded-xl shadow-2xl text-center border border-green-500/30 w-full max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-green-400 mb-4 flex items-center justify-center gap-3">
              <span>🟢</span> Identity Verified!
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              AI Gatekeeper has confirmed your liveness and identity.
              You are now entering the secure voting arena.
            </p>
            <div className="animate-pulse flex space-x-4 justify-center mb-8">
              <div className="h-3 w-3 bg-cyan-400 rounded-full"></div>
              <div className="h-3 w-3 bg-cyan-400 rounded-full"></div>
              <div className="h-3 w-3 bg-cyan-400 rounded-full"></div>
            </div>

            {/* Existing VoteForm - Unchanged */}
            <VoteForm
              onVoteSuccess={(candidate, score) => console.log(`Vote registered for ${candidate} with score ${score}`)}
              onBotDetected={() => setIsVerified(false)}
            />

          </div>
        )}
      </main>

    </div>
  );
}

export default App;