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

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('halofi_jwt');
    if (savedToken) {
      setState(prev => ({
        ...prev,
        jwtToken: savedToken,
        isSetup: true,
      }));
    }
  }, []);

  const setJwtToken = useCallback((token: string | null) => {
    if (token) {
      localStorage.setItem('halofi_jwt', token);
    } else {
      localStorage.removeItem('halofi_jwt');
    }
    setState(prev => ({ ...prev, jwtToken: token }));
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
