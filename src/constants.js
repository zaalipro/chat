/**
 * Application-wide constants
 * This file centralizes all magic strings and numbers used throughout the application
 */

// Chat status constants
export const CHAT_STATUS = {
  ACTIVE: 'active',
  FINISHED: 'finished',
  ENDED: 'ended'
};

// Working session constants
export const WORKING_SESSION = {
  NIGHT: 1,  // 00:00 - 08:00
  DAY: 2,    // 08:00 - 16:00
  EVENING: 3 // 16:00 - 24:00
};

// Working hours ranges
export const WORKING_HOURS = {
  [WORKING_SESSION.NIGHT]: { start: 0, end: 8 },
  [WORKING_SESSION.DAY]: { start: 8, end: 16 },
  [WORKING_SESSION.EVENING]: { start: 16, end: 24 }
};

// Local storage keys
export const STORAGE_KEYS = {
  ACTIVE_CHAT: 'activeChat',
  CONTRACT_ID: 'contractId',
  CUSTOMER_NAME: 'customerName',
  WEBSITE_ID: 'websiteId',
  TOKEN: 'token'
};

// API endpoints
export const API = {
  GRAPHQL: 'http://localhost:5001/graphql',
  WEBSOCKET: 'ws://localhost:5001/graphql',
  TIME: '/api/time'
};

// UI constants
export const UI = {
  COLORS: {
    PRIMARY: 'rgba(39,175,96,1)',
    SECONDARY: '#007bff',
    ERROR: '#b71c1c',
    ERROR_LIGHT: '#ffebee',
    ERROR_BORDER: '#ffcdd2'
  },
  SIZES: {
    CONTAINER_WIDTH: '400px',
    CONTAINER_HEIGHT: '700px',
    HEADER_HEIGHT: '80px',
    BUTTON_HEIGHT: '60px'
  },
  ANIMATION: {
    DURATION: '0.4s'
  }
};

// Message constants
export const MESSAGE = {
  MIN_LENGTH: 1,
  DEFAULT_AUTHOR: 'Anonymous',
  ENTER_KEY_CODE: 13
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CHAT: 'Error: Cannot send messages (invalid chat)',
  LOADING_CONTRACT: 'Loading contract...',
  LOADING_CHAT: 'Loading chat...',
  CONTRACT_NOT_FOUND: 'Contract ID not found. Please check your configuration.',
  CHAT_ERROR: 'Unable to load chat information. Please try again.',
  SEND_ERROR: 'Error sending message:'
};

// Button labels
export const BUTTON_LABELS = {
  START_NEW_CHAT: 'Start New Chat',
  RELOAD: 'Reload',
  TRY_AGAIN: 'Try Again'
};

// Form validation
export const VALIDATION = {
  CUSTOMER_NAME: {
    MIN_LENGTH: 1,
    REQUIRED_MESSAGE: 'Required',
    LENGTH_MESSAGE: 'Customer name should be more than 1 character'
  },
  HEADLINE: {
    MIN_LENGTH: 10,
    REQUIRED_MESSAGE: 'Required',
    LENGTH_MESSAGE: 'headline length should be more than 10 characters'
  }
};