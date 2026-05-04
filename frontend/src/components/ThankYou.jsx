import { useEffect, useState } from 'react';

export default function ThankYou({ onReset }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onReset]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-8xl mb-6">🗳️</div>

      <h1 className="text-5xl font-extrabold text-green-400 mb-4">
        Thank You!
      </h1>

      <p className="text-gray-300 text-xl mb-2">
        Your vote has been securely recorded.
      </p>
      <p className="text-gray-500 text-sm mb-10">
        Encrypted with Paillier FHE · Stored on Algorand Blockchain
      </p>

      {/* Checkmark animation */}
      <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-10">
        <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <p className="text-gray-400 text-sm">
        Redirecting to start in{' '}
        <span className="text-cyan-400 font-bold text-lg">{countdown}</span>
        {' '}seconds...
      </p>

      <button
        onClick={onReset}
        className="mt-6 text-gray-600 hover:text-gray-400 text-sm underline transition-colors"
      >
        Go now
      </button>
    </div>
  );
}
