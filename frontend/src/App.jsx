import React, { useState } from 'react';
import FaceScanner from './components/FaceScanner';
import FingerprintAuth from './components/FingerprintAuth';
import VoteForm from './components/VoteForm';
import BlockchainExplorer from './components/BlockchainExplorer';
import TallyResults from './components/TallyResults';
import ThankYou from './components/ThankYou';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import appSpec from "./QShieldVoting.arc56.json";

function App() {
  // step: 'face' | 'fingerprint' | 'vote' | 'thankyou'
  const [step, setStep] = useState('face');
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [credentialId, setCredentialId] = useState(null);

  const resetToStart = () => {
    setStep('face');
    setFaceDescriptor(null);
    setCredentialId(null);
  };
  const [vaultStatus, setVaultStatus] = useState("");

  // ─── TESTNET CONFIG ───────────────────────────────────────────
  const TESTNET_APP_ID = 761621541;  
  // ──────────────────────────────────────────────────────────────

  const testVaultConnection = async () => {
    try {
      setVaultStatus("🟡 Connecting...");
      const algorand = AlgorandClient.testNet();
      const appClient = algorand.client.getAppClient({
        appSpec: JSON.stringify(appSpec),
        appId: BigInt(TESTNET_APP_ID),
      });
      const globalState = await appClient.getGlobalState();
      console.log("Testnet vault data:", globalState);
      setVaultStatus(`🟢 Connected to Testnet App ${TESTNET_APP_ID}!`);
    } catch (error) {
      console.error(error);
      setVaultStatus("🔴 Connection Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans">

      <header className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-tight">
          Q-Shield
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Quantum-Resistant & Privacy-First E-Voting</p>
        <div className="mt-4">
          <button
            onClick={testVaultConnection}
            className="bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
          >
            {vaultStatus || "🔌 Test Testnet Vault Connection"}
          </button>
        </div>
      </header>

      <main className="w-full max-w-4xl">
        {step === 'face' && (
          <FaceScanner onVerificationSuccess={(desc) => {
            setFaceDescriptor(desc);
            setStep('fingerprint');
          }} />
        )}

        {step === 'fingerprint' && (
          <FingerprintAuth onFingerprintSuccess={(credId) => {
            setCredentialId(credId);
            setStep('vote');
          }} />
        )}

        {step === 'vote' && (
          <div className="bg-gray-900 p-10 rounded-xl shadow-2xl text-center border border-green-500/30 w-full max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-green-400 mb-4 flex items-center justify-center gap-3">
              <span>🟢</span> Identity Verified!
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              Face & Fingerprint confirmed. You are now entering the secure voting arena.
            </p>
            <div className="animate-pulse flex space-x-4 justify-center mb-8">
              <div className="h-3 w-3 bg-cyan-400 rounded-full"></div>
              <div className="h-3 w-3 bg-cyan-400 rounded-full"></div>
              <div className="h-3 w-3 bg-cyan-400 rounded-full"></div>
            </div>
            <VoteForm
              faceHash={faceDescriptor}
              credentialId={credentialId}
              onVoteSuccess={() => setStep('thankyou')}
              onBotDetected={() => setStep('face')}
            />
          </div>
        )}

        {step === 'thankyou' && (
          <ThankYou onReset={resetToStart} />
        )}
      </main>

      {/* FHE Tally and Blockchain Explorer moved to Admin Dashboard (/admin) */}

    </div>
  );
}

export default App;