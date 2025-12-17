'use client';

import React, { useState, FormEvent } from 'react';
import { useVoiceAgent } from '../contexts/VoiceAgentContext';
import { Button } from './ui/Button';

export function SetupScreen() {
  const { setJwtToken, setIsSetup } = useVoiceAgent();

  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Please enter a valid JWT token');
      return;
    }

    setIsLoading(true);
    setSuccess('Token saved! Connecting...');

    setTimeout(() => {
      setJwtToken(trimmedToken);
      setIsSetup(true);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-white p-10 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[500px] w-[90%] text-center">
      {/* Logo */}
      <div className="mb-5">
        <span className="text-5xl font-bold bg-gradient-to-br from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
          Halofi
        </span>
      </div>

      <h1 className="text-[#667eea] mb-2.5 text-[28px] font-bold">Voice Agent</h1>
      <p className="text-gray-500 mb-8 leading-relaxed">
        Enter your JWT token to connect to the voice agent
      </p>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-5">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-5 text-left">
          <label
            htmlFor="jwtToken"
            className="block text-gray-800 font-semibold mb-2"
          >
            JWT Token
          </label>
          <input
            type="text"
            id="jwtToken"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            required
            className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-mono transition-colors focus:outline-none focus:border-[#667eea]"
          />
          <p className="text-[13px] text-gray-400 mt-2.5">
            Get your token from Postman:{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              POST /auth/login
            </code>
          </p>
        </div>

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect'}
        </Button>
      </form>
    </div>
  );
}
