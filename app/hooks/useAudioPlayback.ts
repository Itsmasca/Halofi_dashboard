'use client';

import { useCallback, useRef, useState } from 'react';

interface UseAudioPlaybackOptions {
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
}

export function useAudioPlayback(options: UseAudioPlaybackOptions = {}) {
  const { onPlayStart, onPlayEnd, onError } = options;

  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    return audioContextRef.current;
  }, []);

  // Convert base64 to ArrayBuffer
  const base64ToArrayBuffer = useCallback((base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }, []);

  // Add audio chunk to queue
  const addAudioChunk = useCallback((base64Audio: string) => {
    const audioData = base64ToArrayBuffer(base64Audio);
    audioQueueRef.current.push(audioData);
  }, [base64ToArrayBuffer]);

  // Play all audio in queue
  const playQueue = useCallback(async () => {
    if (isPlaying || audioQueueRef.current.length === 0) return;

    setIsPlaying(true);
    onPlayStart?.();

    try {
      const audioContext = initAudioContext();

      // Resume if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Concatenate all audio chunks
      const totalLength = audioQueueRef.current.reduce((acc, arr) => acc + arr.byteLength, 0);
      const concatenated = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of audioQueueRef.current) {
        concatenated.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      // Decode and play
      const audioBuffer = await audioContext.decodeAudioData(concatenated.buffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      source.onended = () => {
        setIsPlaying(false);
        audioQueueRef.current = [];
        onPlayEnd?.();
      };

      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      audioQueueRef.current = [];
      onError?.('Error playing audio');
      onPlayEnd?.();
    }
  }, [isPlaying, initAudioContext, onPlayStart, onPlayEnd, onError]);

  // Clear audio queue
  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
  }, []);

  // Get queue length
  const getQueueLength = useCallback(() => {
    return audioQueueRef.current.length;
  }, []);

  return {
    isPlaying,
    addAudioChunk,
    playQueue,
    clearQueue,
    getQueueLength,
    initAudioContext,
  };
}
