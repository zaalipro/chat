import '@testing-library/jest-dom';

// Mock environment variables for tests
global.process = {
  env: {
    NODE_ENV: 'test',
    REACT_APP_API_URL: 'http://localhost:5001',
    REACT_APP_GRAPHQL_HTTP_URL: 'http://localhost:5001/graphql',
    REACT_APP_GRAPHQL_WS_URL: 'ws://localhost:5001/graphql',
    REACT_APP_COMPANY_LOGO_URL: 'http://imgur.com/qPjLkW0.png',
    REACT_APP_DEFAULT_CONTRACT_ID: '4fa5a942-c64a-4ef5-8114-4aa0b32df1c1',
    REACT_APP_DEFAULT_WEBSITE_ID: 'dace1a1f-237e-4feb-9ed9-a85555a39aee',
    REACT_APP_IPIFY_URL: 'https://api.ipify.org?format=json',
    REACT_APP_PUBLIC_KEY: '4754248e-63af-43bf-b023-15777d6d1dea'
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  close: vi.fn(),
  send: vi.fn(),
}));