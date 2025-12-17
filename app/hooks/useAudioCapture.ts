'use client';

import { useCallback, useRef, useState } from 'react';

interface AudioCaptureOptions {
  sampleRate?: number;
  onAudioData?: (base64Audio: string) => void;
}

export function useAudioCapture(options: AudioCaptureOptions = {}) {
  const { sampleRate = 16000, onAudioData } = options;

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isCapturingRef = useRef(false);
  const onAudioDataRef = useRef(onAudioData);

  // Keep refs updated
  onAudioDataRef.current = onAudioData;

  // Convert ArrayBuffer to Base64
  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  // Request microphone access
  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      // Check if HTTPS (required for mic access except on localhost)
      if (typeof window !== 'undefined') {
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          setError('Microphone access requires HTTPS');
          return false;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate,
        },
      });

      mediaStreamRef.current = stream;
      console.log('Microphone access granted');
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and refresh the page.');
      } else {
        setError('Could not access microphone');
      }
      return false;
    }
  }, [sampleRate]);

  // Start audio capture
  const startCapture = useCallback(async (): Promise<boolean> => {
    if (!mediaStreamRef.current) {
      const hasAccess = await requestMicrophoneAccess();
      if (!hasAccess) return false;
    }

    try {
      // Create AudioContext
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate });

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      console.log('AudioContext sample rate:', audioContextRef.current.sampleRate);

      // Create source from media stream
      sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current!);

      // Create script processor for audio processing
      const bufferSize = 4096;
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

      scriptProcessorRef.current.onaudioprocess = (event) => {
        // Use ref to get current capturing state (avoids closure issues)
        if (!isCapturingRef.current) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Check if we're getting actual audio data
        let maxAmplitude = 0;
        for (let i = 0; i < inputData.length; i++) {
          maxAmplitude = Math.max(maxAmplitude, Math.abs(inputData[i]));
        }

        // Skip silent chunks (amplitude too low)
        if (maxAmplitude < 0.001) return;

        // Convert float32 to int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to base64 and send
        const base64Audio = arrayBufferToBase64(pcmData.buffer);
        onAudioDataRef.current?.(base64Audio);
      };

      // Connect nodes
      sourceRef.current.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);

      isCapturingRef.current = true;
      setIsCapturing(true);
      setError(null);
      console.log('Audio capture started');
      return true;
    } catch (err) {
      console.error('Error starting audio capture:', err);
      setError('Error starting audio capture');
      return false;
    }
  }, [sampleRate, arrayBufferToBase64, requestMicrophoneAccess]);

  // Stop audio capture
  const stopCapture = useCallback(() => {
    try {
      isCapturingRef.current = false;

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setIsCapturing(false);
      console.log('Audio capture stopped');
    } catch (err) {
      console.error('Error stopping audio capture:', err);
    }
  }, []);

  // Release microphone
  const releaseMicrophone = useCallback(() => {
    stopCapture();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, [stopCapture]);

  return {
    isCapturing,
    error,
    requestMicrophoneAccess,
    startCapture,
    stopCapture,
    releaseMicrophone,
  };
}
