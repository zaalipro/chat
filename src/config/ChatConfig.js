// Chat configuration constants
export const CHAT_STATES = {
  FORM: 'form',
  CREATING: 'creating',
  WAITING: 'waiting',
  CONNECTED: 'connected'
};

export const TIMEOUTS = {
  WAITING: 5 * 60 * 1000, // 5 minutes
  RETRY_DELAY: 3000,
  CONNECTION_RETRY: 5000
};

export const RETRY_LIMITS = {
  CONTRACT_FETCH: 3,
  CHAT_CREATION: 2,
  MESSAGE_CREATION: 2
};

export const FALLBACK_STRATEGIES = {
  USE_ALL_CONTRACTS: true,
  SINGLE_CONTRACT_MODE: true
};

export const ERROR_MESSAGES = {
  NO_AGENTS: 'No agents are currently available. Please try again later.',
  FAILED_TO_START: 'Failed to start conversation. Please try again.',
  CONNECTION_ERROR: 'Connection error. Please check your internet connection.',
  AUTH_ERROR: 'Authentication error. Please refresh the page and try again.',
  TIMEOUT: 'No agents responded within the expected time. Please try again.',
  UNEXPECTED: 'An unexpected error occurred. Please try again.',
  CONTRACT_LOAD_FAILED: 'Failed to load contract information',
  AGENT_LOAD_FAILED: 'Failed to load available agents'
};