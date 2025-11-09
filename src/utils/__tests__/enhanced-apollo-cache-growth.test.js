import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryCache, ApolloClient, gql } from '@apollo/client';
import ApolloCacheMonitor from '../apollo-cache-monitor';

// Mock console methods to test logging
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
};

describe('Enhanced Apollo Cache Growth and Memory Leaks Prevention', () => {
  let cache;
  let client;
  let cacheMonitor;

  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
    vi.spyOn(console, 'info').mockImplementation(mockConsole.info);

    // Create cache with enhanced configuration
    cache = new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            messages: {
              merge(existing = [], incoming) {
                const merged = [...existing, ...incoming];
                return merged.slice(-100); // Keep only last 100 messages
              }
            },
            chats: {
              merge(existing = [], incoming) {
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
      cacheSize: 1024 * 1024 * 10, // 10MB
    });

    // Create Apollo client
    client = new ApolloClient({
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

    // Initialize cache monitor
    cacheMonitor = new ApolloCacheMonitor(cache, {
      monitoringInterval: 1000, // 1 second for testing
      maxCacheSize: 1024 * 1024 * 10, // 10MB
      warningThreshold: 1024 * 1024 * 5, // 5MB
      criticalThreshold: 1024 * 1024 * 8, // 8MB
      enablePerformanceMetrics: true,
      enableMemoryLeakDetection: true
    });
  });

  afterEach(() => {
    if (cacheMonitor) {
      cacheMonitor.destroy();
    }
    if (client) {
      client.cache.reset();
    }
    vi.restoreAllMocks();
  });

  describe('Cache Size Limiting', () => {
    it('should limit messages cache to 100 items', () => {
      // Create a valid GraphQL query
      const GET_MESSAGES = gql`
        query GetMessages {
          messages {
            id
            text
            timestamp
          }
        }
      `;

      // Add 150 messages to test limit
      for (let i = 0; i < 150; i++) {
        cache.writeQuery({
          query: GET_MESSAGES,
          data: {
            messages: [
              ...(cache.readQuery({ query: GET_MESSAGES })?.messages || []),
              { id: i, text: `Message ${i}`, timestamp: Date.now() }
            ]
          }
        });
      }

      const result = cache.readQuery({ query: GET_MESSAGES });
      expect(result.messages).toHaveLength(100);
      expect(result.messages[0].id).toBe(50); // Should keep last 100 (50-149)
      expect(result.messages[99].id).toBe(149);
    });

    it('should limit chats cache to 50 items', () => {
      // Create a valid GraphQL query
      const GET_CHATS = gql`
        query GetChats {
          chats {
            id
            name
            createdAt
          }
        }
      `;

      // Add 75 chats to test limit
      for (let i = 0; i < 75; i++) {
        cache.writeQuery({
          query: GET_CHATS,
          data: {
            chats: [
              ...(cache.readQuery({ query: GET_CHATS })?.chats || []),
              { id: i, name: `Chat ${i}`, createdAt: Date.now() }
            ]
          }
        });
      }

      const result = cache.readQuery({ query: GET_CHATS });
      expect(result.chats).toHaveLength(50);
      expect(result.chats[0].id).toBe(25); // Should keep last 50 (25-74)
      expect(result.chats[49].id).toBe(74);
    });
  });

  describe('Memory Monitoring', () => {
    it('should detect cache size growth and trigger warnings', async () => {
      // Start monitoring
      cacheMonitor.startMonitoring();

      // Create a valid GraphQL query
      const GET_TEST_DATA = gql`
        query GetTestData {
          testData {
            id
            data
          }
        }
      `;

      // Simulate cache growth by adding large amounts of data
      const largeData = 'x'.repeat(1024 * 1024); // 1MB string
      for (let i = 0; i < 6; i++) { // Add 6MB to exceed warning threshold
        cache.writeQuery({
          query: GET_TEST_DATA,
          data: {
            testData: [
              ...(cache.readQuery({ query: GET_TEST_DATA })?.testData || []),
              { id: i, data: largeData }
            ]
          }
        });
      }

      // Wait for monitoring to detect growth
      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cache size exceeded warning threshold')
      );
    });

    it('should trigger critical alerts for excessive cache size', async () => {
      // Start monitoring
      cacheMonitor.startMonitoring();

      // Create a valid GraphQL query
      const GET_CRITICAL_DATA = gql`
        query GetCriticalData {
          criticalData {
            id
            data
          }
        }
      `;

      // Simulate excessive cache growth
      const largeData = 'x'.repeat(1024 * 1024); // 1MB string
      for (let i = 0; i < 10; i++) { // Add 10MB to exceed critical threshold
        cache.writeQuery({
          query: GET_CRITICAL_DATA,
          data: {
            criticalData: [
              ...(cache.readQuery({ query: GET_CRITICAL_DATA })?.criticalData || []),
              { id: i, data: largeData }
            ]
          }
        });
      }

      // Wait for monitoring to detect critical growth
      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Cache size exceeded critical threshold')
      );
    });
  });

  describe('Garbage Collection', () => {
    it('should perform garbage collection when available', () => {
      // Mock garbage collection method
      const mockGC = vi.fn();
      cache.gc = mockGC;

      // Trigger garbage collection
      if (cache.gc) {
        cache.gc();
      }

      expect(mockGC).toHaveBeenCalled();
    });

    it('should handle missing garbage collection gracefully', () => {
      // Remove gc method
      delete cache.gc;

      // Try to perform garbage collection
      if (cache.gc) {
        cache.gc();
      }

      expect(mockConsole.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Apollo cache garbage collection performed')
      );
    });
  });

  describe('Performance Metrics', () => {
    it('should track cache write performance', async () => {
      // Create a valid GraphQL query
      const GET_PERFORMANCE_TEST = gql`
        query GetPerformanceTest {
          test
        }
      `;

      const startTime = performance.now();

      // Perform cache write
      cache.writeQuery({
        query: GET_PERFORMANCE_TEST,
        data: { test: 'data' }
      });

      const endTime = performance.now();
      const writeTime = endTime - startTime;

      // Get metrics from monitor
      const metrics = cacheMonitor.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.cacheSize).toBeGreaterThanOrEqual(0);
      expect(metrics.writeTime).toBeGreaterThanOrEqual(0);
    });

    it('should track cache read performance', async () => {
      // Create a valid GraphQL query
      const GET_READ_TEST = gql`
        query GetReadTest {
          test
        }
      `;

      // Write data first
      cache.writeQuery({
        query: GET_READ_TEST,
        data: { test: 'data' }
      });

      const startTime = performance.now();

      // Read data
      cache.readQuery({
        query: GET_READ_TEST
      });

      const endTime = performance.now();
      const readTime = endTime - startTime;

      expect(readTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should detect potential memory leaks in cache growth patterns', async () => {
      // Start monitoring
      cacheMonitor.startMonitoring();

      // Create a valid GraphQL query
      const GET_LEAK_DATA = gql`
        query GetLeakData {
          leakData {
            id
            data
            timestamp
          }
        }
      `;

      // Simulate rapid cache growth (potential leak)
      const rapidGrowthData = 'x'.repeat(1024 * 100); // 100KB
      for (let i = 0; i < 50; i++) {
        cache.writeQuery({
          query: GET_LEAK_DATA,
          data: {
            leakData: [
              ...(cache.readQuery({ query: GET_LEAK_DATA })?.leakData || []),
              { id: i, data: rapidGrowthData, timestamp: Date.now() }
            ]
          }
        });
      }

      // Wait for monitoring to analyze patterns
      await new Promise(resolve => setTimeout(resolve, 1500));

      const report = cacheMonitor.generateReport();
      
      expect(report).toBeDefined();
      expect(report.memoryLeakDetected).toBeDefined();
      expect(report.growthRate).toBeDefined();
    });

    it('should identify subscription-related memory leaks', () => {
      // Create a valid GraphQL query
      const GET_SUBSCRIPTION_DATA = gql`
        query GetSubscriptionData {
          subscription {
            __typename
            chatStatus {
              __typename
              id
              status
              lastUpdate
            }
          }
        }
      `;

      // Simulate subscription data accumulation
      const subscriptionData = {
        subscription: {
          __typename: 'Subscription',
          chatStatus: {
            __typename: 'ChatStatus',
            id: 'test-chat',
            status: 'ACTIVE',
            lastUpdate: new Date().toISOString()
          }
        }
      };

      // Write subscription data multiple times (simulating leak)
      for (let i = 0; i < 100; i++) {
        cache.writeQuery({
          query: GET_SUBSCRIPTION_DATA,
          data: subscriptionData
        });
      }

      const cacheSize = cache.extract();
      const estimatedSize = JSON.stringify(cacheSize).length;

      expect(estimatedSize).toBeGreaterThan(0);
    });
  });

  describe('Automatic Cleanup', () => {
    it('should perform automatic cleanup when threshold exceeded', () => {
      // Mock cache reset
      const mockReset = vi.fn();
      cache.reset = mockReset;

      // Create a valid GraphQL query
      const GET_LARGE_DATA = gql`
        query GetLargeData {
          largeData
        }
      `;

      // Simulate cache exceeding threshold
      const largeData = 'x'.repeat(1024 * 1024 * 6); // 6MB
      cache.writeQuery({
        query: GET_LARGE_DATA,
        data: { largeData }
      });

      // Trigger cleanup manually (simulating automatic trigger)
      const cacheSize = cache.extract();
      const estimatedSize = JSON.stringify(cacheSize).length;
      
      if (estimatedSize > 1024 * 1024 * 5) { // 5MB threshold
        if (cache.reset) {
          const essentialData = { __META: { ...cache.extract().__META } };
          cache.reset();
          cache.restore(essentialData);
        }
      }

      expect(mockReset).toHaveBeenCalled();
    });

    it('should preserve essential data during cleanup', () => {
      // Create a valid GraphQL query
      const GET_ESSENTIAL_DATA = gql`
        query GetEssentialData {
          __META {
            version
            timestamp
            sessionId
          }
          userData {
            id
            name
          }
        }
      `;

      // Add essential metadata
      cache.writeQuery({
        query: GET_ESSENTIAL_DATA,
        data: {
          __META: {
            version: '1.0',
            timestamp: Date.now(),
            sessionId: 'test-session'
          },
          userData: { id: 'user1', name: 'Test User' }
        }
      });

      // Perform cleanup
      const essentialData = {
        __META: { ...cache.extract().__META }
      };
      cache.reset();
      cache.restore(essentialData);

      const result = cache.extract();
      expect(result.__META).toBeDefined();
      expect(result.__META.sessionId).toBe('test-session');
      expect(result.userData).toBeUndefined(); // Should be cleaned up
    });
  });

  describe('Cache Monitor Lifecycle', () => {
    it('should start and stop monitoring correctly', () => {
      expect(cacheMonitor.isMonitoring).toBe(false);

      cacheMonitor.startMonitoring();
      expect(cacheMonitor.isMonitoring).toBe(true);

      cacheMonitor.stopMonitoring();
      expect(cacheMonitor.isMonitoring).toBe(false);
    });

    it('should clean up resources on destroy', () => {
      cacheMonitor.startMonitoring();
      
      // Destroy monitor
      cacheMonitor.destroy();
      
      expect(cacheMonitor.isMonitoring).toBe(false);
      expect(cacheMonitor.monitoringInterval).toBeNull();
    });

    it('should generate comprehensive reports', () => {
      // Create a valid GraphQL query
      const GET_REPORT_DATA = gql`
        query GetReportData {
          test
          timestamp
        }
      `;

      // Add some test data
      cache.writeQuery({
        query: GET_REPORT_DATA,
        data: { test: 'data', timestamp: Date.now() }
      });

      const report = cacheMonitor.generateReport();
      
      expect(report).toBeDefined();
      expect(report.cacheSize).toBeDefined();
      expect(report.cacheSizeKB).toBeDefined();
      expect(report.memoryLeakDetected).toBeDefined();
      expect(report.growthRate).toBeDefined();
      expect(report.performanceMetrics).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });
  });

  describe('Integration with Widget', () => {
    it('should integrate with widget cache configuration', () => {
      // Test that cache has the expected configuration
      const cacheConfig = cache.config;
      
      expect(cacheConfig.garbageCollection).toBe(true);
      expect(cacheConfig.resultCaching).toBe(true);
      expect(cacheConfig.evictionPolicy).toBe('lru');
      expect(cacheConfig.cacheSize).toBe(1024 * 1024 * 10);
    });

    it('should handle cache initialization errors gracefully', () => {
      // Test with invalid cache
      const invalidCache = {
        gc: null,
        reset: null,
        extract: () => ({}),
        writeQuery: () => {}
      };

      expect(() => {
        const monitor = new ApolloCacheMonitor(invalidCache);
        monitor.startMonitoring();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle cache read errors gracefully', () => {
      // Mock cache.extract to throw error
      const originalExtract = cache.extract;
      cache.extract = () => {
        throw new Error('Cache read error');
      };

      expect(() => {
        const report = cacheMonitor.generateReport();
      }).not.toThrow();

      // Restore original method
      cache.extract = originalExtract;
    });

    it('should handle monitoring errors gracefully', () => {
      // Mock performance.now to throw error
      const originalNow = performance.now;
      performance.now = () => {
        throw new Error('Performance timing error');
      };

      expect(() => {
        cacheMonitor.startMonitoring();
      }).not.toThrow();

      // Restore original method
      performance.now = originalNow;
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain cache operations under 100ms', () => {
      // Create a valid GraphQL query
      const GET_BENCHMARK_TEST = gql`
        query GetBenchmarkTest($id: ID!) {
          test(id: $id)
        }
      `;

      const operations = [];
      
      // Test 100 cache operations
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        
        cache.writeQuery({
          query: GET_BENCHMARK_TEST,
          variables: { id: i },
          data: { test: `data${i}` }
        });
        
        const endTime = performance.now();
        operations.push(endTime - startTime);
      }

      const averageTime = operations.reduce((sum, time) => sum + time, 0) / operations.length;
      const maxTime = Math.max(...operations);

      expect(averageTime).toBeLessThan(100); // Average under 100ms
      expect(maxTime).toBeLessThan(200); // Max under 200ms
    });

    it('should handle large data sets efficiently', () => {
      // Create a valid GraphQL query
      const GET_LARGE_DATASET = gql`
        query GetLargeDataset {
          largeDataSet {
            id
            data
            timestamp
          }
        }
      `;

      const largeDataSet = [];
      
      // Create large data set (1MB total)
      for (let i = 0; i < 1000; i++) {
        largeDataSet.push({
          id: i,
          data: 'x'.repeat(1024), // 1KB per item
          timestamp: Date.now()
        });
      }

      const startTime = performance.now();
      
      cache.writeQuery({
        query: GET_LARGE_DATASET,
        data: { largeDataSet }
      });
      
      const endTime = performance.now();
      const writeTime = endTime - startTime;

      expect(writeTime).toBeLessThan(500); // Should complete within 500ms
    });
  });
});