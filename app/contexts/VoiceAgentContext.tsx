'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  VoiceAgentContextType,
  VoiceAgentState,
  ConnectionStatus,
  SphereState,
  TranscriptMessage
} from '../types';

const initialState: VoiceAgentState = {
  jwtToken: null,
  isSetup: false,
  connectionStatus: 'disconnected',
  sphereState: 'idle',
  messages: [],
  currentTranscript: '',
  interimTranscript: '',
  statusText: 'Click the sphere to start',
};

const VoiceAgentContext = createContext<VoiceAgentContextType | null>(null);

export function VoiceAgentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VoiceAgentState>(initialState);

  // Clean token - remove quotes, whitespace, and any wrapping characters
  const cleanToken = (token: string): string => {
    let cleaned = token.trim();
    // Remove surrounding quotes (single or double)
    cleaned = cleaned.replace(/^["']+|["']+$/g, '');
    // Remove any remaining whitespace
    cleaned = cleaned.trim();
    // If it still starts with a non-alphanumeric character that's not part of JWT, remove it
    // JWT tokens always start with 'eyJ'
    if (cleaned && !cleaned.startsWith('eyJ')) {
      // Find where the actual token starts
      const jwtStart = cleaned.indexOf('eyJ');
      if (jwtStart > 0) {
        cleaned = cleaned.substring(jwtStart);
      }
    }
    return cleaned;
  };

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('halofi_jwt');
    if (savedToken) {
      const cleaned = cleanToken(savedToken);
      // Re-save if it was dirty
      if (cleaned !== savedToken) {
        localStorage.setItem('halofi_jwt', cleaned);
      }
      setState(prev => ({
        ...prev,
        jwtToken: cleaned,
        isSetup: true,
      }));
    }
  }, []);

  const setJwtToken = useCallback((token: string | null) => {
    if (token) {
      console.log('Original token (first 50 chars):', token.substring(0, 50));
      const cleaned = cleanToken(token);
      console.log('Cleaned token (first 50 chars):', cleaned.substring(0, 50));
      localStorage.setItem('halofi_jwt', cleaned);
      setState(prev => ({ ...prev, jwtToken: cleaned }));
    } else {
      localStorage.removeItem('halofi_jwt');
      setState(prev => ({ ...prev, jwtToken: null }));
    }
  }, []);

  const setIsSetup = useCallback((isSetup: boolean) => {
    setState(prev => ({ ...prev, isSetup }));
  }, []);

  const setConnectionStatus = useCallback((connectionStatus: ConnectionStatus) => {
    setState(prev => ({ ...prev, connectionStatus }));
  }, []);

  const setSphereState = useCallback((sphereState: SphereState) => {
    setState(prev => ({ ...prev, sphereState }));
  }, []);

  const addMessage = useCallback((message: Omit<TranscriptMessage, 'id' | 'timestamp'>) => {
    const newMessage: TranscriptMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));
  }, []);

  const setCurrentTranscript = useCallback((currentTranscript: string) => {
    setState(prev => ({ ...prev, currentTranscript }));
  }, []);

  const setInterimTranscript = useCallback((interimTranscript: string) => {
    setState(prev => ({ ...prev, interimTranscript }));
  }, []);

  const setStatusText = useCallback((statusText: string) => {
    setState(prev => ({ ...prev, statusText }));
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  const value: VoiceAgentContextType = {
    ...state,
    setJwtToken,
    setIsSetup,
    setConnectionStatus,
    setSphereState,
    addMessage,
    setCurrentTranscript,
    setInterimTranscript,
    setStatusText,
    clearMessages,
  };

  return (
    <VoiceAgentContext.Provider value={value}>
      {children}
    </VoiceAgentContext.Provider>
  );
}

export function useVoiceAgent() {
  const context = useContext(VoiceAgentContext);
  if (!context) {
    throw new Error('useVoiceAgent must be used within a VoiceAgentProvider');
  }
  return context;
}
