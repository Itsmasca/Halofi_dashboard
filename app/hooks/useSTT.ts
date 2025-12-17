'use client';

import { useCallback, useRef, useState } from 'react';
import { useVoiceAgent } from '../contexts/VoiceAgentContext';
import { config } from '../config';
import type { STTConfig, STTMessage } from '../types';

interface UseSTTOptions {
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  silenceDelay?: number;
}

export function useSTT(options: UseSTTOptions = {}) {
  const {
    onPartialTranscript,
    onFinalTranscript,
    onError,
    silenceDelay = 1500,
  } = options;

  const { jwtToken, setCurrentTranscript, setInterimTranscript } = useVoiceAgent();

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sttWebsocketRef = useRef<WebSocket | null>(null);
  const sttTokenRef = useRef<string | null>(null);
  const sttConfigRef = useRef<STTConfig | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch STT token from backend
  const fetchSTTToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(config.sttTokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get STT token: ${response.status}`);
      }

      const data = await response.json();
      sttTokenRef.current = data.token;
      sttConfigRef.current = data.config;
      console.log('STT token obtained successfully');
      return true;
    } catch (err) {
      console.error('Error fetching STT token:', err);
      setError('Could not obtain STT token');
      return false;
    }
  }, [jwtToken]);

  // Initialize ElevenLabs STT WebSocket
  const initSTTWebSocket = useCallback(async (): Promise<boolean> => {
    try {
      // Get fresh token if needed
      if (!sttTokenRef.current) {
        const success = await fetchSTTToken();
        if (!success) return false;
      }

      // Close existing connection if any
      if (sttWebsocketRef.current?.readyState === WebSocket.OPEN) {
        sttWebsocketRef.current.close();
      }

      // Connect to ElevenLabs STT WebSocket - config via query params
      const languageCode = sttConfigRef.current?.language_code || 'en';
      const wsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&token=${sttTokenRef.current}&sample_rate=16000&language_code=${languageCode}`;
      sttWebsocketRef.current = new WebSocket(wsUrl);

      return new Promise((resolve) => {
        const ws = sttWebsocketRef.current!;

        ws.onopen = () => {
          console.log('ElevenLabs STT WebSocket connected');
          // No config message needed - configuration is in URL query params
          resolve(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as STTMessage;
            console.log('STT message:', JSON.stringify(data).substring(0, 200));

            if ('type' in data && data.type === 'error') {
              console.error('STT Error:', data);
              setError(data.error || data.message || 'Unknown STT error');
              onError?.(data.error || data.message || 'Unknown STT error');
              return;
            }

            if ('message_type' in data) {
              if (data.message_type === 'partial_transcript') {
                setInterimTranscript(data.text || '');
                onPartialTranscript?.(data.text || '');
              } else if (data.message_type === 'committed_transcript') {
                currentTranscriptRef.current += (data.text || '') + ' ';
                setCurrentTranscript(currentTranscriptRef.current);
                setInterimTranscript('');
                onFinalTranscript?.(data.text || '');

                // Reset and start silence timer
                if (silenceTimerRef.current) {
                  clearTimeout(silenceTimerRef.current);
                }

                if (currentTranscriptRef.current.trim()) {
                  silenceTimerRef.current = setTimeout(() => {
                    console.log('Silence detected');
                  }, silenceDelay);
                }
              } else if (data.message_type === 'error') {
                console.error('STT error:', data);
                setError('STT error');
                onError?.('STT error');
              }
            }
          } catch (parseError) {
            console.error('Error parsing STT message:', parseError);
          }
        };

        ws.onerror = (err) => {
          console.error('STT WebSocket error:', err);
          setError('STT connection error');
          resolve(false);
        };

        ws.onclose = (event) => {
          console.log('STT WebSocket closed:', event.code, event.reason);
          if (isListening) {
            sttTokenRef.current = null; // Token may have expired
          }
        };

        // Timeout for connection
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            resolve(false);
          }
        }, 5000);
      });
    } catch (err) {
      console.error('Error initializing STT WebSocket:', err);
      return false;
    }
  }, [
    fetchSTTToken,
    isListening,
    silenceDelay,
    setCurrentTranscript,
    setInterimTranscript,
    onPartialTranscript,
    onFinalTranscript,
    onError,
  ]);

  // Send audio chunk to STT
  const sendAudioChunk = useCallback((base64Audio: string, commit: boolean = false) => {
    if (!sttWebsocketRef.current || sttWebsocketRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      if (commit) {
        // Send end of stream signal
        sttWebsocketRef.current.send(JSON.stringify({ eof: true }));
      } else {
        // Send audio chunk - ElevenLabs expects just { audio: base64 }
        sttWebsocketRef.current.send(
          JSON.stringify({
            audio: base64Audio,
          })
        );
      }
      return true;
    } catch (err) {
      console.error('Error sending audio chunk:', err);
      return false;
    }
  }, []);

  // Start listening
  const startListening = useCallback(async (): Promise<boolean> => {
    const success = await initSTTWebSocket();
    if (!success) return false;

    currentTranscriptRef.current = '';
    setCurrentTranscript('');
    setInterimTranscript('');
    setIsListening(true);
    setError(null);

    return true;
  }, [initSTTWebSocket, setCurrentTranscript, setInterimTranscript]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Send commit signal
    if (sttWebsocketRef.current?.readyState === WebSocket.OPEN) {
      sendAudioChunk('', true);
      sttWebsocketRef.current.close();
    }

    sttWebsocketRef.current = null;
    setIsListening(false);

    return currentTranscriptRef.current.trim();
  }, [sendAudioChunk]);

  // Get current transcript
  const getCurrentTranscript = useCallback(() => {
    return currentTranscriptRef.current.trim();
  }, []);

  return {
    isListening,
    error,
    startListening,
    stopListening,
    sendAudioChunk,
    getCurrentTranscript,
  };
}
