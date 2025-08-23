import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import App from './App';
import { WebsiteProvider } from './context/WebsiteContext';
import { GET_WEBSITE_CONTRACTS } from './queries';

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
    const mocks = [
      {
        request: {
          query: GET_WEBSITE_CONTRACTS,
          variables: {
            websiteId: 'test-website-id',
          },
        },
        result: {
          data: {
            website: {
              logoUrl: 'https://example.com/logo.png',
              color: '#000000',
              contracts: [
                {
                  id: 'test-contract-id',
                  session: 'test-session',
                  status: 'active',
                  color: '#000000',
                  chatMissTime: 30,
                },
              ],
            },
          },
        },
      },
    ];
    
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <WebsiteProvider>
          <App />
        </WebsiteProvider>
      </MockedProvider>
    );
    
    // Just verify the component renders without throwing
    expect(document.body).toBeTruthy();
  });
});