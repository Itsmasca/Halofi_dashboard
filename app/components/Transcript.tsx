'use client';

import React, { useEffect, useRef } from 'react';
import { useVoiceAgent } from '../contexts/VoiceAgentContext';

export function Transcript() {
  const { messages, currentTranscript, interimTranscript, sphereState } = useVoiceAgent();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, currentTranscript, interimTranscript]);

  const hasMessages = messages.length > 0 || currentTranscript || interimTranscript;
  const isListening = sphereState === 'listening';

  return (
    <div
      ref={containerRef}
      className="bg-white/95 rounded-[15px] p-5 max-w-[600px] mx-auto my-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)] min-h-[100px] max-h-[300px] overflow-y-auto"
    >
      {!hasMessages ? (
        <div className="text-gray-400 text-center">
          Conversation will appear here...
        </div>
      ) : (
        <>
          {/* Previous messages */}
          {messages.map((msg) => (
            <div key={msg.id} className="my-2.5 text-left animate-fadeIn">
              <div
                className={
                  msg.sender === 'user'
                    ? 'text-[#667eea] font-semibold'
                    : 'text-[#764ba2] font-medium mt-1'
                }
              >
                <strong>{msg.sender === 'user' ? 'You' : 'Agent'}:</strong>{' '}
                {msg.message}
              </div>
            </div>
          ))}

          {/* Live transcript while listening */}
          {isListening && (currentTranscript || interimTranscript) && (
            <div className="my-2.5 text-left animate-fadeIn">
              <div className="text-[#667eea] font-semibold">
                <strong>You:</strong>{' '}
                <span>{currentTranscript}</span>
                <span className="opacity-60 italic">{interimTranscript}</span>
                <span className="text-[#38ef7d] ml-2 animate-pulse">●</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
