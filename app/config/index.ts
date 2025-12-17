// API Configuration - reads from environment variables
export const config = {
  // Base URLs from environment
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://halofiapp-production.up.railway.app',
  wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL || 'wss://halofiapp-production.up.railway.app',

  // Endpoints
  endpoints: {
    agentWs: '/agent/ws',
    sttToken: '/agent/stt/token',
  },

  // Full URLs
  get wsUrl() {
    return `${this.wsBaseUrl}${this.endpoints.agentWs}`;
  },

  get sttTokenUrl() {
    return `${this.apiBaseUrl}${this.endpoints.sttToken}`;
  },
};
