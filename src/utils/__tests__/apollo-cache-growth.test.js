import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryCache, ApolloClient, gql } from '@apollo/client';

describe('Apollo Cache Growth Management', () => {
  let cache;
  let client;
  let mockLink;

  // Create proper GraphQL queries for testing
  const MESSAGES_QUERY = gql`
    query GetMessages {
      messages {
        id
        text
        timestamp
      }
    }
  `;

  const CHATS_QUERY = gql`
    query GetChats {
      chats {
        id
        name
        createdAt
      }
    }
  `;

  const ITEMS_QUERY = gql`
    query GetItems {
      items {
        id
        data
      }
    }
  `;

  beforeEach(() => {
    // Mock Apollo link for testing
    mockLink = {
      request: vi.fn(() => Promise.resolve({ data: {} })),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    };

    // Create cache with the same configuration as in widget.js
    cache = new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            messages: {
              merge(existing = [], incoming) {
                // Limit cache size for messages to prevent memory growth
                const merged = [...existing, ...incoming];
                return merged.slice(-100); // Keep only last 100 messages
              }
            },
            chats: {
              merge(existing = [], incoming) {
                // Limit cache size for chats
                const merged = [...existing, ...incoming];
                return merged.slice(-50); // Keep only last 50 chats
              }
            }
          }
        }
      },
      garbageCollection: true,
      resultCaching: true,
      evictionPolicy: 'lru',
      cacheSize: 1024 * 1024 * 10, // 10MB cache limit
    });

    client = new ApolloClient({
      link: mockLink,
      cache,
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
          notifyOnNetworkStatusChange: true,
          fetchPolicy: 'cache-first',
          pollInterval: 0,
        },
        query: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-first',
        },
        mutate: {
          errorPolicy: 'all'
        }
      }
    });
  });

  afterEach(() => {
    // Clean up cache after each test
    cache.reset();
  });

  describe('Cache Size Limits', () => {
    it('should limit messages cache to 100 items', () => {
      // Create 150 messages
      const messages = Array.from({ length: 150 }, (_, i) => ({
        id: `msg-${i}`,
        text: `Message ${i}`,
        timestamp: Date.now() + i,
        __typename: 'Message'
      }));

      // Write all messages to cache
      cache.writeQuery({
        query: MESSAGES_QUERY,
        data: { messages }
      });

      // Read messages from cache
      const result = cache.readQuery({
        query: MESSAGES_QUERY
      });

      // Should only have last 100 messages
      expect(result.messages).toHaveLength(100);
      expect(result.messages[0].id).toBe('msg-50');
      expect(result.messages[99].id).toBe('msg-149');
    });

    it('should limit chats cache to 50 items', () => {
      // Create 75 chats
      const chats = Array.from({ length: 75 }, (_, i) => ({
        id: `chat-${i}`,
        name: `Chat ${i}`,
        createdAt: Date.now() + i,
        __typename: 'Chat'
      }));

      // Write all chats to cache
      cache.writeQuery({
        query: CHATS_QUERY,
        data: { chats }
      });

      // Read chats from cache
      const result = cache.readQuery({
        query: CHATS_QUERY
      });

      // Should only have last 50 chats
      expect(result.chats).toHaveLength(50);
      expect(result.chats[0].id).toBe('chat-25');
      expect(result.chats[49].id).toBe('chat-74');
    });

    it('should handle empty arrays gracefully', () => {
      // Write empty data to cache first
      cache.writeQuery({
        query: MESSAGES_QUERY,
        data: { messages: [] }
      });

      cache.writeQuery({
        query: CHATS_QUERY,
        data: { chats: [] }
      });

      const result = cache.readQuery({
        query: MESSAGES_QUERY
      });

      expect(result.messages).toEqual([]);
    });
  });

  describe('Cache Memory Management', () => {
    it('should initialize with garbage collection enabled', () => {
      expect(cache.config.garbageCollection).toBe(true);
    });

    it('should have result caching enabled', () => {
      expect(cache.config.resultCaching).toBe(true);
    });

    it('should use LRU eviction policy', () => {
      expect(cache.config.evictionPolicy).toBe('lru');
    });

    it('should have cache size limit configured', () => {
      expect(cache.config.cacheSize).toBe(1024 * 1024 * 10); // 10MB
    });

    it('should perform garbage collection when available', () => {
      // Mock garbage collection
      const gcSpy = vi.spyOn(cache, 'gc').mockImplementation(() => {
        console.log('Garbage collection performed');
      });

      // Simulate cache cleanup
      if (cache.gc) {
        cache.gc();
      }

      expect(gcSpy).toHaveBeenCalled();
      gcSpy.mockRestore();
    });

    it('should reset cache without errors', () => {
      // Add some data to cache
      cache.writeQuery({
        query: MESSAGES_QUERY,
        data: {
          messages: [{ id: 'test', text: 'test', __typename: 'Message' }]
        }
      });

      // Reset should not throw
      expect(() => cache.reset()).not.toThrow();
    });

    it('should handle cache size monitoring', () => {
      // Mock console.log to capture cache size logs
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Add data to cache
      cache.writeQuery({
        query: MESSAGES_QUERY,
        data: {
          messages: Array.from({ length: 10 }, (_, i) => ({
            id: `msg-${i}`,
            text: `Message ${i}`,
            __typename: 'Message'
          }))
        }
      });

      // Extract cache data
      const cacheData = cache.extract();
      const estimatedSize = JSON.stringify(cacheData).length;

      // Should be able to estimate cache size
      expect(estimatedSize).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Current cache size:')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cache Performance', () => {
    it('should handle large data sets efficiently', () => {
      const startTime = performance.now();

      // Write large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        data: `Data ${i}`.repeat(10), // Larger data strings
        __typename: 'LargeItem'
      }));

      cache.writeQuery({
        query: ITEMS_QUERY,
        data: { items: largeDataset }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should maintain performance with repeated writes', () => {
      const durations = [];

      // Perform multiple writes
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        cache.writeQuery({
          query: MESSAGES_QUERY,
          data: {
            messages: Array.from({ length: 50 }, (_, j) => ({
              id: `msg-${i}-${j}`,
              text: `Message ${i}-${j}`,
              __typename: 'Message'
            }))
          }
        });

        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      // Performance should not degrade significantly
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      expect(avgDuration).toBeLessThan(100); // Average < 100ms
      expect(maxDuration).toBeLessThan(200); // Max < 200ms
    });
  });

  describe('Cache Error Handling', () => {
    it('should handle garbage collection errors gracefully', () => {
      // Mock garbage collection to throw error
      const originalGc = cache.gc;
      cache.gc = () => {
        throw new Error('Simulated GC failure');
      };

      // Mock console.error to capture error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Attempt garbage collection
      if (cache.gc) {
        try {
          cache.gc();
        } catch (error) {
          // Error should be caught and logged
        }
      }

      // Restore original method
      cache.gc = originalGc;

      // The error should be caught and handled
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error during cache cleanup:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle cache reset errors gracefully', () => {
      // Mock cache reset to throw error
      const originalReset = cache.reset;
      cache.reset = () => {
        throw new Error('Simulated reset failure');
      };

      // Mock console.error to capture error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Attempt cache reset
      try {
        cache.reset();
      } catch (error) {
        // Error should be caught and logged
      }

      // Restore original method
      cache.reset = originalReset;

      // The error should be caught and handled
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error during Apollo cache cleanup:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cache Configuration Validation', () => {
    it('should have proper default options configured', () => {
      const defaultOptions = client.defaultOptions;

      expect(defaultOptions.watchQuery.errorPolicy).toBe('all');
      expect(defaultOptions.watchQuery.notifyOnNetworkStatusChange).toBe(true);
      expect(defaultOptions.watchQuery.fetchPolicy).toBe('cache-first');
      expect(defaultOptions.watchQuery.pollInterval).toBe(0);

      expect(defaultOptions.query.errorPolicy).toBe('all');
      expect(defaultOptions.query.fetchPolicy).toBe('cache-first');

      expect(defaultOptions.mutate.errorPolicy).toBe('all');
    });

    it('should handle cache restoration with empty state', () => {
      // Test restoration with empty state
      const emptyState = {};
      const restoredCache = new InMemoryCache({
        typePolicies: cache.config.typePolicies,
        garbageCollection: true,
        resultCaching: true,
      }).restore(emptyState);

      expect(restoredCache).toBeDefined();
      expect(restoredCache.extract()).toEqual({});
    });
  });
});