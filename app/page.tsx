'use client';

import { VoiceAgentProvider, useVoiceAgent } from './contexts/VoiceAgentContext';
import { SetupScreen } from './components/SetupScreen';
import { ConnectionStatus } from './components/ConnectionStatus';
import { VoiceSphere } from './components/VoiceSphere';
import { Transcript } from './components/Transcript';

function VoiceAgentApp() {
  const { isSetup, setIsSetup, statusText } = useVoiceAgent();

  const handleChangeToken = () => {
    setIsSetup(false);
  };

  if (!isSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-hidden">
        <SetupScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-hidden">
      <ConnectionStatus />

      {/* Settings button */}
      <button
        onClick={handleChangeToken}
        className="
          fixed top-5 right-5
          bg-white/95
          px-5 py-2.5
          rounded-full
          shadow-[0_5px_15px_rgba(0,0,0,0.2)]
          text-sm font-semibold
          cursor-pointer
          text-[#667eea]
          transition-all duration-300
          hover:translate-y-[-2px] hover:shadow-[0_7px_20px_rgba(0,0,0,0.3)]
        "
      >
        Change Token
      </button>

      {/* Main content */}
      <div className="text-center z-10 w-full max-w-[800px] px-4">
        {/* Status text */}
        <div className="text-white text-lg font-medium mb-2.5 min-h-[25px]">
          {statusText}
        </div>

        {/* Voice sphere */}
        <VoiceSphere />

        {/* Hint text */}
        <div className="text-white/80 text-sm mt-2.5">
          Click sphere to talk • Auto-sends after 1.5s silence • Click again to send now
        </div>

        {/* Transcript */}
        <Transcript />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <VoiceAgentProvider>
      <VoiceAgentApp />
    </VoiceAgentProvider>
  );
}
