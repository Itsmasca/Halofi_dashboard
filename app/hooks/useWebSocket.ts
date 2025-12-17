'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useVoiceAgent } from '../contexts/VoiceAgentContext';
import { config } from '../config';
import type { WSMessage } from '../types';

interface UseWebSocketOptions {
  onAudioChunk?: (audio: string) => void;
  onAudioComplete?: (message?: string) => void;
  onAgentResponse?: (message: string) => void;
  onError?: (error: string, code?: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    jwtToken,
    setConnectionStatus,
    setSphereState,
    addMessage,
    setStatusText,
    setIsSetup,
  } = useVoiceAgent();

  const websocketRef = useRef<WebSocket | null>(null);

  // Use refs for callbacks to avoid reconnections
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  // WebSocket URL from config (uses environment variables)
  const WS_URL = config.wsUrl;

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (websocketRef.current?.readyState === WebSocket.OPEN ||
        websocketRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    if (!jwtToken) {
      console.error('No JWT token available');
      setStatusText('No token available');
      return;
    }

    const url = `${WS_URL}?token=${jwtToken}`;
    console.log('Connecting to WebSocket:', url);
    setStatusText('Connecting...');
    setConnectionStatus('connecting');

    const ws = new WebSocket(url);
    websocketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      setStatusText('Ready to chat!');
      console.log('WebSocket connected');
    };

    ws.onmessage = async (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        console.log('Received:', data);

        switch (data.type) {
          case 'connection_ack':
            console.log('Connected:', data.connection_id);
            break;

          case 'audio_chunk':
            callbacksRef.current.onAudioChunk?.(data.audio);
            break;

          case 'audio_complete':
            if (data.message) {
              addMessage({ sender: 'agent', message: data.message });
            }
            callbacksRef.current.onAudioComplete?.(data.message);
            break;

          case 'agent_response':
            addMessage({ sender: 'agent', message: data.message });
            setStatusText('Ready to chat!');
            setSphereState('idle');
            callbacksRef.current.onAgentResponse?.(data.message);
            break;

          case 'error':
            console.error('WebSocket error:', data.error);
            setStatusText(`Error: ${data.error}`);
            if (data.code === 'INVALID_TOKEN') {
              alert('Invalid token. Please enter a new one.');
              setIsSetup(false);
            }
            callbacksRef.current.onError?.(data.error, data.code);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatusText('Connection error');
      setConnectionStatus('disconnected');
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      setStatusText('Disconnected');
      console.log('WebSocket disconnected');
    };
  }, [jwtToken, WS_URL, setConnectionStatus, setSphereState, addMessage, setStatusText, setIsSetup]);

  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    const payload = {
      message,
      context: {},
      session_id: null,
      stream_audio: true,
    };

    websocketRef.current.send(JSON.stringify(payload));
    return true;
  }, []);

  const isConnected = useCallback(() => {
    return websocketRef.current?.readyState === WebSocket.OPEN;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected,
  };
}
