// Sphere states
export type SphereState = 'idle' | 'listening' | 'speaking' | 'thinking';

// Connection states
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

// Transcript message
export interface TranscriptMessage {
  id: string;
  sender: 'user' | 'agent';
  message: string;
  timestamp: Date;
  isInterim?: boolean;
}

// WebSocket message types
export interface WSConnectionAck {
  type: 'connection_ack';
  connection_id: string;
}

export interface WSAudioChunk {
  type: 'audio_chunk';
  audio: string; // base64
}

export interface WSAudioComplete {
  type: 'audio_complete';
  message?: string;
}

export interface WSAgentResponse {
  type: 'agent_response';
  message: string;
}

export interface WSError {
  type: 'error';
  error: string;
  code?: string;
}

export type WSMessage = WSConnectionAck | WSAudioChunk | WSAudioComplete | WSAgentResponse | WSError;

// STT message types
export interface STTConfig {
  audio_format: string;
  sample_rate: number;
  language_code: string;
}

export interface STTPartialTranscript {
  message_type: 'partial_transcript';
  text: string;
}

export interface STTCommittedTranscript {
  message_type: 'committed_transcript';
  text: string;
}

export interface STTError {
  type?: 'error';
  message_type?: 'error';
  error?: string;
  message?: string;
}

export type STTMessage = STTPartialTranscript | STTCommittedTranscript | STTError;

// Voice Agent Context
export interface VoiceAgentState {
  jwtToken: string | null;
  isSetup: boolean;
  connectionStatus: ConnectionStatus;
  sphereState: SphereState;
  messages: TranscriptMessage[];
  currentTranscript: string;
  interimTranscript: string;
  statusText: string;
}

export interface VoiceAgentContextType extends VoiceAgentState {
  setJwtToken: (token: string | null) => void;
  setIsSetup: (isSetup: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSphereState: (state: SphereState) => void;
  addMessage: (message: Omit<TranscriptMessage, 'id' | 'timestamp'>) => void;
  setCurrentTranscript: (transcript: string) => void;
  setInterimTranscript: (transcript: string) => void;
  setStatusText: (text: string) => void;
  clearMessages: () => void;
}
