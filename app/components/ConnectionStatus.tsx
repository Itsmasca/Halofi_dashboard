'use client';

import React from 'react';
import { useVoiceAgent } from '../contexts/VoiceAgentContext';

export function ConnectionStatus() {
  const { connectionStatus } = useVoiceAgent();

  const isConnected = connectionStatus === 'connected';
  const statusText = isConnected ? 'Connected' : 'Disconnected';
  const statusColor = isConnected ? 'text-[#38ef7d]' : 'text-[#f5576c]';

  return (
    <div
      className={`
        fixed top-5 left-5
        bg-white/95
        px-5 py-2.5
        rounded-full
        shadow-[0_5px_15px_rgba(0,0,0,0.2)]
        text-sm font-semibold
        ${statusColor}
      `}
    >
      <span className="mr-1">●</span> {statusText}
    </div>
  );
}
