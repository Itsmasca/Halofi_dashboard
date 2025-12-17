'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { useVoiceAgent } from '../contexts/VoiceAgentContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSTT } from '../hooks/useSTT';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { AudioVisualizer } from './AudioVisualizer';

const SILENCE_DELAY = 1500; // 1.5 seconds

export function VoiceSphere() {
  const {
    sphereState,
    setSphereState,
    connectionStatus,
    addMessage,
    setStatusText,
    currentTranscript,
  } = useVoiceAgent();

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);

  // Audio playback hook
  const { addAudioChunk, playQueue, isPlaying } = useAudioPlayback({
    onPlayStart: () => {
      setSphereState('speaking');
      setStatusText('Agent speaking...');
    },
    onPlayEnd: () => {
      setSphereState('idle');
      setStatusText('Ready to chat!');
    },
  });

  // WebSocket hook
  const { connect, sendMessage, isConnected } = useWebSocket({
    onAudioChunk: (audio) => {
      addAudioChunk(audio);
    },
    onAudioComplete: async () => {
      await playQueue();
    },
  });

  // STT hook
  const { startListening, stopListening, sendAudioChunk, getCurrentTranscript } = useSTT({
    onFinalTranscript: () => {
      // Reset silence timer on final transcript
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      if (isListeningRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          console.log('Silence detected, auto-sending...');
          handleStopListeningAndSend();
        }, SILENCE_DELAY);
      }
    },
  });

  // Audio capture hook
  const { startCapture, stopCapture, requestMicrophoneAccess, error: micError } = useAudioCapture({
    sampleRate: 16000,
    onAudioData: (base64Audio) => {
      sendAudioChunk(base64Audio);
    },
  });

  // Connect WebSocket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Handle stop listening and send
  const handleStopListeningAndSend = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    stopCapture();
    const transcript = stopListening();
    isListeningRef.current = false;

    if (transcript) {
      addMessage({ sender: 'user', message: transcript });
      setSphereState('thinking');
      setStatusText('Thinking...');
      sendMessage(transcript);
    } else {
      setStatusText('No speech detected');
      setSphereState('idle');
    }
  }, [stopCapture, stopListening, addMessage, setSphereState, setStatusText, sendMessage]);

  // Handle start listening
  const handleStartListening = useCallback(async () => {
    // Request mic access first
    const hasAccess = await requestMicrophoneAccess();
    if (!hasAccess) {
      setStatusText('Could not access microphone');
      return;
    }

    // Start STT
    const sttReady = await startListening();
    if (!sttReady) {
      setStatusText('Could not connect to STT service');
      return;
    }

    // Start audio capture
    const captureReady = await startCapture();
    if (!captureReady) {
      setStatusText('Could not start audio capture');
      return;
    }

    isListeningRef.current = true;
    setSphereState('listening');
    setStatusText('Listening... (will auto-send after silence)');
  }, [requestMicrophoneAccess, startListening, startCapture, setSphereState, setStatusText]);

  // Handle sphere click
  const handleClick = useCallback(() => {
    if (!isConnected()) {
      setStatusText('Please wait, connecting...');
      return;
    }

    if (isPlaying) {
      return; // Don't interrupt while speaking
    }

    if (isListeningRef.current) {
      // Manual stop - send immediately
      handleStopListeningAndSend();
    } else {
      handleStartListening();
    }
  }, [isConnected, isPlaying, handleStopListeningAndSend, handleStartListening, setStatusText]);

  // Sphere state classes
  const sphereStateClasses: Record<string, string> = {
    idle: 'bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-sphere-idle hover:scale-105',
    listening: 'bg-gradient-to-br from-[#11998e] to-[#38ef7d] animate-pulse-listening',
    speaking: 'bg-gradient-to-br from-[#f093fb] to-[#f5576c] animate-pulse-speaking',
    thinking: 'bg-gradient-to-br from-[#4facfe] to-[#00f2fe] animate-rotate-thinking',
  };

  return (
    <div
      className="relative w-[300px] h-[300px] mx-auto mb-8 cursor-pointer select-none"
      onClick={handleClick}
    >
      <div
        className={`
          w-[300px] h-[300px] rounded-full
          transition-transform duration-300
          ${sphereStateClasses[sphereState]}
        `}
      >
        <AudioVisualizer />
      </div>

      {micError && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-red-500 text-sm whitespace-nowrap">
          {micError}
        </div>
      )}
    </div>
  );
}
