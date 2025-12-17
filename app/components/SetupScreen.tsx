'use client';

import React, { useState, FormEvent } from 'react';
import { useVoiceAgent } from '../contexts/VoiceAgentContext';
import { config } from '../config';
import { Button } from './ui/Button';

export function SetupScreen() {
  const { setJwtToken, setIsSetup } = useVoiceAgent();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedPhone || !trimmedPassword) {
      setError('Please enter phone and password');
      return;
    }

    setIsLoading(true);
    setSuccess('Logging in...');

    try {
      const response = await fetch(config.loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: trimmedPhone,
          password: trimmedPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Login failed');
      }

      // Extract token from response (nested in session object)
      const token = data.session?.access_token || data.access_token || data.token;
      console.log('Login response data:', data);
      console.log('Extracted token (first 50 chars):', token?.substring(0, 50));
      if (!token) {
        throw new Error('No token received from server');
      }

      setSuccess('Login successful! Connecting...');

      setTimeout(() => {
        setJwtToken(token);
        setIsSetup(true);
        setIsLoading(false);
      }, 500);

    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setSuccess(null);
      setIsLoading(false);
    }
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
        Sign in to connect to your voice assistant
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
        <div className="mb-4 text-left">
          <label
            htmlFor="phone"
            className="block text-gray-800 font-semibold mb-2"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="525580318747"
            required
            className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#667eea]"
          />
        </div>

        <div className="mb-6 text-left">
          <label
            htmlFor="password"
            className="block text-gray-800 font-semibold mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#667eea]"
          />
        </div>

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
