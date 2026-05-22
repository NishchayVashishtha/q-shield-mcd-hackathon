import React, { useState, useEffect, useRef } from 'react';
import { loadAIModels, extractIDDescriptor, verifyLivenessAndMatch } from 'ai-engine';
import { createWorker } from 'tesseract.js';

// ─── Steps ────────────────────────────────────────────────────────────────────
// STEP 1 → Upload Aadhar Card
// STEP 2 → OCR: Extract & validate 12-digit Aadhar number
// STEP 3 → Face extract from Aadhar image
// STEP 4 → Live camera liveness + face match
// ──────────────────────────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5001";

export default function FaceScanner({ onVerificationSuccess }) {
  const [step, setStep]           = useState(1); // 1=upload, 2=ocr, 3=camera, 4=done
  const [status, setStatus]       = useState('');
  const [isLoaded, setIsLoaded]   = useState(false);

  // Aadhar data
  const [aadharImage, setAadharImage]   = useState(null);   // object URL
  const [aadharNumber, setAadharNumber] = useState('');      // extracted number
  const [aadharValid, setAadharValid]   = useState(false);
  const [ocrRunning, setOcrRunning]     = useState(false);
  const [idDescriptor, setIdDescriptor] = useState(null);   // face-api descriptor

  const videoRef  = useRef(null);
  const imageRef  = useRef(null);

  // ── Load AI models on mount ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setStatus('Loading AI models...');
      const ok = await loadAIModels();
      if (ok) {
        setIsLoaded(true);
        setStatus('AI Ready ✅  —  Please upload your Aadhar Card.');
      } else {
        setStatus('❌ AI models failed to load. Check /models folder.');
      }
    })();
  }, []);

  // ── STEP 1: Aadhar image upload ──────────────────────────────────────────
  const handleAadharUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAadharImage(url);
    setAadharNumber('');
    setAadharValid(false);
    setIdDescriptor(null);
    setStep(1);
    setStatus('Aadhar uploaded ✅  —  Click "Scan Aadhar" to verify.');
  };

  // ── STEP 2: OCR → extract Aadhar number ─────────────────────────────────
  const handleScanAadhar = async () => {
    if (!aadharImage) return;
    setOcrRunning(true);
    setStatus('🔍 Scanning Aadhar card with OCR...');

    try {
      // Run Tesseract OCR
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(aadharImage);
      await worker.terminate();

      console.log('OCR raw text:', text);

      // Extract 12-digit Aadhar number (groups of 4 or continuous 12)
      // Aadhar format: XXXX XXXX XXXX  or  XXXXXXXXXXXX
      const cleaned = text.replace(/\s+/g, ' ');
      const match =
        cleaned.match(/\b\d{4}\s\d{4}\s\d{4}\b/) ||   // spaced format
        cleaned.match(/\b\d{12}\b/);                    // continuous format

      if (match) {
        const num = match[0].replace(/\s/g, '');
        setAadharNumber(num);
        setAadharValid(true);
        setStatus(`✅ Aadhar Number Detected: ${formatAadhar(num)}  —  Now extracting face...`);

        // STEP 3: Extract face from Aadhar image
        await extractFaceFromAadhar();
      } else {
        setAadharValid(false);
        setStatus('❌ Could not detect Aadhar number. Please upload a clearer image.');
      }
    } catch (err) {
      console.error('OCR error:', err);
      setStatus('❌ OCR failed: ' + err.message);
    } finally {
      setOcrRunning(false);
    }
  };

  // ── STEP 3: Extract face descriptor from Aadhar image ───────────────────
  const extractFaceFromAadhar = async () => {
    setStatus('🧠 Extracting face from Aadhar card...');
    try {
      // Wait for imageRef to be populated
      await new Promise(r => setTimeout(r, 300));
      const descriptor = await extractIDDescriptor(imageRef.current);
      setIdDescriptor(descriptor);
      setStep(3);
      setStatus('✅ Face extracted from Aadhar!  —  Now start camera for live verification.');
    } catch (err) {
      console.error('Face extract error:', err);
      setStatus('❌ No face found on Aadhar card. Please upload a photo-bearing Aadhar.');
    }
  };

  // ── STEP 4: Start webcam ─────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('📷 Camera started  —  Look at camera and SMILE 😊 to verify liveness.');
    } catch (err) {
      setStatus('❌ Camera access denied!');
    }
  };

  // ── STEP 5: Liveness + face match ───────────────────────────────────────
  const handleVerify = async () => {
    if (!idDescriptor) { setStatus('❌ Scan Aadhar first!'); return; }
    if (!videoRef.current?.srcObject) { setStatus('❌ Start camera first!'); return; }

    setStatus('🔐 Verifying liveness and matching face with Aadhar...');
    try {
      const result = await verifyLivenessAndMatch(videoRef.current, idDescriptor);

      if (result.success) {
        // Stop camera
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        setStep(4);
        setStatus(`✅ Identity Verified! Match score: ${result.distance.toFixed(3)}`);

        const descriptor = Array.from(result.descriptor);

        // Backend duplicate check
        try {
          const res = await fetch(`${BACKEND_URL}/check-face`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descriptor })
          });
          const data = await res.json();
          if (data.status === 'already_voted') {
            setStatus('🚫 This Aadhar has already been used to vote. Duplicate rejected.');
            setStep(1);
            return;
          }
          setTimeout(() => onVerificationSuccess(descriptor), 1500);
        } catch {
          setStatus('❌ Backend unreachable. Please ensure server is running on port 5001.');
        }
      } else {
        setStatus(`❌ Face mismatch! Live face does not match Aadhar. (distance: ${result.distance.toFixed(3)})`);
      }
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatAadhar = (num) =>
    `${num.slice(0,4)} ${num.slice(4,8)} ${num.slice(8,12)}`;

  const maskAadhar = (num) =>
    `XXXX XXXX ${num.slice(8,12)}`;

  // ── Step indicator ───────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: 'Upload Aadhar' },
    { n: 2, label: 'OCR Scan'      },
    { n: 3, label: 'Live Camera'   },
    { n: 4, label: 'Verified'      },
  ];

  const currentStep = aadharValid && idDescriptor ? (step >= 3 ? step : 3) : (aadharImage ? 2 : 1);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-900 text-white rounded-2xl shadow-2xl max-w-3xl mx-auto mt-6 border border-cyan-500/20">

      {/* Header */}
      <h2 className="text-3xl font-extrabold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
        🛡️ Q-Shield Identity Gate
      </h2>
      <p className="text-gray-400 text-sm mb-5">Aadhar-based Biometric Verification</p>

      {/* Step Progress Bar */}
      <div className="flex items-center w-full mb-6 px-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${currentStep >= s.n
                  ? 'bg-cyan-500 border-cyan-400 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-500'}`}>
                {currentStep > s.n ? '✓' : s.n}
              </div>
              <span className={`text-xs mt-1 ${currentStep >= s.n ? 'text-cyan-400' : 'text-gray-600'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${currentStep > s.n ? 'bg-cyan-500' : 'bg-gray-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Status Bar */}
      <div className={`w-full text-center text-sm font-semibold py-2 px-4 rounded-lg mb-5 transition-all
        ${status.includes('❌') ? 'bg-red-900/40 text-red-400 border border-red-500/30' :
          status.includes('✅') ? 'bg-green-900/40 text-green-400 border border-green-500/30' :
          'bg-gray-800 text-yellow-300 border border-yellow-500/20'}`}>
        {status || 'Initializing...'}
      </div>

      {/* Main Content */}
      <div className="flex gap-4 w-full mb-5">

        {/* LEFT: Aadhar Upload */}
        <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🪪</span>
            <h3 className="font-bold text-cyan-300">Aadhar Card</h3>
          </div>

          <label className={`cursor-pointer w-full text-center py-2 px-3 rounded-lg text-sm font-medium border transition-all mb-3
            ${!isLoaded ? 'opacity-40 cursor-not-allowed bg-gray-700 border-gray-600 text-gray-400' :
              'bg-gray-700 hover:bg-gray-600 border-cyan-500/40 text-cyan-300'}`}>
            📁 Choose Aadhar Image
            <input
              type="file"
              accept="image/*"
              onChange={handleAadharUpload}
              disabled={!isLoaded}
              className="hidden"
            />
          </label>

          {/* Aadhar preview */}
          {aadharImage && (
            <div className="relative w-full">
              <img
                ref={imageRef}
                src={aadharImage}
                alt="Aadhar"
                className="w-full h-36 object-cover rounded-lg border-2 border-cyan-500/50 mb-2"
              />
              {aadharValid && (
                <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  ✓ Valid
                </div>
              )}
            </div>
          )}

          {/* Aadhar number display */}
          {aadharValid && aadharNumber && (
            <div className="w-full bg-gray-900 rounded-lg p-2 text-center border border-green-500/30 mt-1">
              <p className="text-xs text-gray-400 mb-0.5">Aadhar Number</p>
              <p className="text-green-400 font-mono font-bold tracking-widest text-sm">
                {maskAadhar(aadharNumber)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Last 4 digits visible for privacy</p>
            </div>
          )}

          {/* Scan button */}
          {aadharImage && !aadharValid && (
            <button
              onClick={handleScanAadhar}
              disabled={ocrRunning || !isLoaded}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm transition-all"
            >
              {ocrRunning ? '⟳ Scanning...' : '🔍 Scan Aadhar'}
            </button>
          )}
        </div>

        {/* RIGHT: Live Camera */}
        <div className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📷</span>
            <h3 className="font-bold text-cyan-300">Live Verification</h3>
          </div>

          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-36 bg-black rounded-lg border-2 border-cyan-500/50 mb-3 object-cover"
          />

          <button
            onClick={startCamera}
            disabled={!aadharValid || !idDescriptor}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg text-sm transition-all"
          >
            📷 Start Camera
          </button>

          {(!aadharValid || !idDescriptor) && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Scan Aadhar first to enable camera
            </p>
          )}
        </div>
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={!aadharValid || !idDescriptor || !isLoaded}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400
          disabled:opacity-40 disabled:cursor-not-allowed
          text-white font-extrabold py-4 rounded-xl shadow-lg text-lg transition-all"
      >
        🔐 VERIFY IDENTITY WITH AADHAR
      </button>

      {/* Info note */}
      <p className="text-xs text-gray-600 mt-3 text-center">
        Your Aadhar number is never stored. Only a biometric hash is used for verification.
      </p>
    </div>
  );
}
