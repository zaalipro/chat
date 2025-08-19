import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import App from './App';

// Mock store2
vi.mock('store2', () => ({
  default: vi.fn((key) => {
    const mockData = {
      activeChat: null,
      websiteId: 'test-website-id',
      contractId: 'test-contract-id'
    };
    return mockData[key];
  })
}));

describe('App', () => {
  it('renders without crashing', () => {
    const mocks = [];
    
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <App />
      </MockedProvider>
    );
    
    // Just verify the component renders without throwing
    expect(document.body).toBeTruthy();
  });
});