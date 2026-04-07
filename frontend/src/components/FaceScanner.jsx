import React, { useState, useEffect, useRef } from 'react';
// Priyanshu ke module se functions import kar rahe hain
import { loadAIModels, extractIDDescriptor, verifyLivenessAndMatch } from 'ai-engine';
import { hashFaceDescriptor } from '../gatekeeper';

export default function FaceScanner({ onVerificationSuccess }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState("Loading AI Models...");
  const [idImage, setIdImage] = useState(null);
  
  const videoRef = useRef(null);
  const imageRef = useRef(null);

  // Component load hote hi AI models memory mein daalo
  useEffect(() => {
    const initAI = async () => {
      const success = await loadAIModels();
      if (success) {
        setIsLoaded(true);
        setStatus("AI Ready. Please upload ID Card.");
      } else {
        setStatus("Error loading AI. Check models folder.");
      }
    };
    initAI();
  }, []);

  // Webcam On karne ka function
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("Camera access denied!");
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setIdImage(imageUrl);
      setStatus("ID Uploaded. Start Webcam & Verify.");
    }
  };

  // The Main Event: Calling Priyanshu's AI
  const handleVerify = async () => {
    if (!idImage || !videoRef.current || !videoRef.current.srcObject) {
      setStatus("Upload ID and Start Camera first!");
      return;
    }

    try {
      setStatus("Extracting ID face... Please wait.");
      const idDescriptor = await extractIDDescriptor(imageRef.current);

      setStatus("Look at the camera and SMILE! 😊 (Checking Liveness)");
      const result = await verifyLivenessAndMatch(videoRef.current, idDescriptor);

      if (result.success) {
        setStatus(`✅ ${result.message} (Score: ${result.distance.toFixed(2)})`);
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());

        // Convert Float32Array to plain array to send to backend
        const descriptor = Array.from(result.descriptor);
        console.log("🔍 Descriptor generated, length:", descriptor.length);

        // Check with backend if this face has already voted
        try {
          console.log("📡 Calling /check-face...");
          const checkRes = await fetch('http://127.0.0.1:5001/check-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descriptor })
          });
          const checkData = await checkRes.json();
          console.log("📡 /check-face response:", checkData);

          if (checkData.status === 'already_voted') {
            setStatus("🚫 This face has already cast a vote. Duplicate access denied.");
            return;
          }

          // Only proceed if backend confirmed ok
          setTimeout(() => onVerificationSuccess(descriptor), 2000);

        } catch (e) {
          console.error("❌ Backend unreachable:", e.message);
          setStatus("❌ Cannot connect to backend server. Please ensure it is running on port 5001.");
          // Do NOT proceed — block the user if backend is down
        }
      } else {
        setStatus(`❌ ${result.message}`);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-900 text-white rounded-lg shadow-xl max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Q-Shield Identity Verification</h2>
      
      <div className="mb-4 text-center font-semibold text-yellow-300">
        Status: {status}
      </div>

      <div className="flex gap-6 w-full mb-6">
        {/* ID Upload Section */}
        <div className="flex-1 bg-gray-800 p-4 rounded-lg flex flex-col items-center">
          <h3 className="mb-2">1. Upload Voter ID</h3>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-2 text-sm" disabled={!isLoaded} />
          {idImage && <img ref={imageRef} src={idImage} alt="ID" className="w-32 h-32 object-cover rounded border-2 border-cyan-500" />}
        </div>

        {/* Webcam Section */}
        <div className="flex-1 bg-gray-800 p-4 rounded-lg flex flex-col items-center">
          <h3 className="mb-2">2. Live Verification</h3>
          <video ref={videoRef} autoPlay muted className="w-48 h-32 bg-black rounded border-2 border-cyan-500 mb-2"></video>
          <button onClick={startCamera} className="bg-blue-600 hover:bg-blue-500 px-4 py-1 rounded text-sm" disabled={!isLoaded}>
            Start Camera
          </button>
        </div>
      </div>

      <button 
        onClick={handleVerify} 
        disabled={!isLoaded}
        className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-bold w-full shadow-lg transition-colors disabled:opacity-50"
      >
        VERIFY IDENTITY & LIVENESS
      </button>
    </div>
  );
}