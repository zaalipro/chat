/**
 * Apollo Cache Monitoring Utility
 * Advanced monitoring and optimization for Apollo Client cache
 */

class ApolloCacheMonitor {
  constructor(cache, options = {}) {
    this.cache = cache;
    this.options = {
      monitoringInterval: 60000, // 1 minute
      maxCacheSize: 10 * 1024 * 1024, // 10MB
      warningThreshold: 5 * 1024 * 1024, // 5MB
      criticalThreshold: 8 * 1024 * 1024, // 8MB
      enablePerformanceMetrics: true,
      enableMemoryLeakDetection: true,
      ...options
    };
    
    this.metrics = {
      totalOperations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryWarnings: 0,
      cleanupsPerformed: 0,
      lastCleanupTime: null,
      averageCacheSize: 0,
      peakCacheSize: 0
    };
    
    this.monitoringInterval = null;
    this.performanceHistory = [];
    this.memoryLeakDetector = new MemoryLeakDetector();
  }

  startMonitoring() {
    console.log('🔍 Apollo Cache Monitor: Starting advanced cache monitoring');
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.options.monitoringInterval);
    
    // Perform initial health check
    this.performHealthCheck();
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🔍 Apollo Cache Monitor: Stopped cache monitoring');
    }
  }

  performHealthCheck() {
    const cacheSize = this.getCacheSize();
    const timestamp = Date.now();
    
    // Update metrics
    this.metrics.totalOperations++;
    this.metrics.averageCacheSize = 
      (this.metrics.averageCacheSize * (this.metrics.totalOperations - 1) + cacheSize) / 
      this.metrics.totalOperations;
    
    if (cacheSize > this.metrics.peakCacheSize) {
      this.metrics.peakCacheSize = cacheSize;
    }

    // Log current status
    console.log(`🔍 Cache Health: Size=${(cacheSize / 1024).toFixed(2)}KB, Peak=${(this.metrics.peakCacheSize / 1024).toFixed(2)}KB, Operations=${this.metrics.totalOperations}`);

    // Check thresholds and take action
    if (cacheSize > this.options.criticalThreshold) {
      this.handleCriticalSize(cacheSize);
    } else if (cacheSize > this.options.warningThreshold) {
      this.handleWarningSize(cacheSize);
    }

    // Detect potential memory leaks
    if (this.options.enableMemoryLeakDetection) {
      this.memoryLeakDetector.checkMemoryLeak(cacheSize, timestamp);
    }

    // Record performance metrics
    if (this.options.enablePerformanceMetrics) {
      this.recordPerformanceMetrics(cacheSize, timestamp);
    }
  }

  getCacheSize() {
    try {
      const cacheData = this.cache.extract();
      return JSON.stringify(cacheData).length;
    } catch (error) {
      console.error('🔍 Cache Monitor: Error measuring cache size:', error);
      return 0;
    }
  }

  handleWarningSize(cacheSize) {
    this.metrics.memoryWarnings++;
    console.warn(`⚠️ Cache size warning: ${(cacheSize / 1024).toFixed(2)}KB (threshold: ${(this.options.warningThreshold / 1024).toFixed(2)}KB)`);
    
    // Perform gentle cleanup
    this.performGentleCleanup();
  }

  handleCriticalSize(cacheSize) {
    console.error(`🚨 Cache size critical: ${(cacheSize / 1024).toFixed(2)}KB (threshold: ${(this.options.criticalThreshold / 1024).toFixed(2)}KB)`);
    
    // Perform aggressive cleanup
    this.performAggressiveCleanup();
  }

  performGentleCleanup() {
    try {
      // Perform garbage collection if available
      if (this.cache.gc) {
        this.cache.gc();
        console.log('🧹 Gentle cleanup: Garbage collection performed');
      }
      
      // Clear old cache entries that might be stale
      this.cleanupStaleEntries();
      
      this.metrics.cleanupsPerformed++;
      this.metrics.lastCleanupTime = Date.now();
      
    } catch (error) {
      console.error('🔍 Cache Monitor: Error during gentle cleanup:', error);
    }
  }

  performAggressiveCleanup() {
    try {
      console.log('🧹 Aggressive cleanup: Starting comprehensive cache cleanup');
      
      // Perform garbage collection
      if (this.cache.gc) {
        this.cache.gc();
      }
      
      // Clear potentially problematic cache entries
      this.clearLargeCacheEntries();
      
      // Reset cache if still too large
      const newSize = this.getCacheSize();
      if (newSize > this.options.criticalThreshold) {
        console.warn('🧹 Aggressive cleanup: Cache still too large, performing partial reset');
        this.performPartialReset();
      }
      
      this.metrics.cleanupsPerformed++;
      this.metrics.lastCleanupTime = Date.now();
      
      console.log('✅ Aggressive cleanup completed');
      
    } catch (error) {
      console.error('🔍 Cache Monitor: Error during aggressive cleanup:', error);
    }
  }

  cleanupStaleEntries() {
    try {
      const cacheData = this.cache.extract();
      let entriesRemoved = 0;
      
      // Look for and remove old entries (older than 1 hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      Object.keys(cacheData).forEach(key => {
        if (cacheData[key] && typeof cacheData[key] === 'object') {
          Object.keys(cacheData[key]).forEach(subKey => {
            const entry = cacheData[key][subKey];
            if (entry && entry.timestamp && entry.timestamp < oneHourAgo) {
              delete cacheData[key][subKey];
              entriesRemoved++;
            }
          });
        }
      });
      
      if (entriesRemoved > 0) {
        console.log(`🧹 Cleanup: Removed ${entriesRemoved} stale cache entries`);
      }
      
    } catch (error) {
      console.error('🔍 Cache Monitor: Error cleaning stale entries:', error);
    }
  }

  clearLargeCacheEntries() {
    try {
      const cacheData = this.cache.extract();
      let entriesCleared = 0;
      
      // Clear entries that are unusually large
      Object.keys(cacheData).forEach(key => {
        if (cacheData[key] && typeof cacheData[key] === 'object') {
          Object.keys(cacheData[key]).forEach(subKey => {
            const entry = cacheData[key][subKey];
            const entrySize = JSON.stringify(entry).length;
            
            // Clear entries larger than 50KB
            if (entrySize > 50 * 1024) {
              delete cacheData[key][subKey];
              entriesCleared++;
            }
          });
        }
      });
      
      if (entriesCleared > 0) {
        console.log(`🧹 Cleanup: Cleared ${entriesCleared} large cache entries`);
      }
      
    } catch (error) {
      console.error('🔍 Cache Monitor: Error clearing large entries:', error);
    }
  }

  performPartialReset() {
    try {
      // Preserve essential data while clearing the rest
      const cacheData = this.cache.extract();
      const essentialData = {
        __META: cacheData.__META || {}
      };
      
      // Keep only recent queries and mutations
      Object.keys(cacheData).forEach(key => {
        if (key.startsWith('Query:') || key.startsWith('Mutation:')) {
          essentialData[key] = cacheData[key];
        }
      });
      
      this.cache.reset();
      this.cache.restore(essentialData);
      
      console.log('🧹 Partial reset: Preserved essential data, cleared cache');
      
    } catch (error) {
      console.error('🔍 Cache Monitor: Error during partial reset:', error);
    }
  }

  recordPerformanceMetrics(cacheSize, timestamp) {
    const performanceEntry = {
      timestamp,
      cacheSize,
      operationsCount: this.metrics.totalOperations,
      memoryUsage: this.getMemoryUsage()
    };
    
    this.performanceHistory.push(performanceEntry);
    
    // Keep only last 100 entries
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }
  }

  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  getMetrics() {
    return {
      ...this.metrics,
      currentCacheSize: this.getCacheSize(),
      monitoringActive: !!this.monitoringInterval,
      memoryLeakDetection: this.memoryLeakDetector.getMetrics(),
      performanceHistory: this.performanceHistory.slice(-10) // Last 10 entries
    };
  }

  generateReport() {
    const metrics = this.getMetrics();
    const cacheSize = metrics.currentCacheSize;
    
    return {
      summary: {
        cacheSizeMB: (cacheSize / (1024 * 1024)).toFixed(2),
        totalOperations: metrics.totalOperations,
        cleanupsPerformed: metrics.cleanupsPerformed,
        memoryWarnings: metrics.memoryWarnings,
        peakCacheSizeMB: (metrics.peakCacheSize / (1024 * 1024)).toFixed(2),
        averageCacheSizeMB: (metrics.averageCacheSize / (1024 * 1024)).toFixed(2)
      },
      health: {
        status: cacheSize > this.options.criticalThreshold ? 'critical' : 
                cacheSize > this.options.warningThreshold ? 'warning' : 'healthy',
        utilizationPercent: ((cacheSize / this.options.maxCacheSize) * 100).toFixed(1)
      },
      recommendations: this.generateRecommendations(metrics),
      timestamp: new Date().toISOString()
    };
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    const cacheSize = metrics.currentCacheSize;
    
    if (cacheSize > this.options.criticalThreshold) {
      recommendations.push('🚨 Cache size is critical. Consider reducing cache retention periods.');
    } else if (cacheSize > this.options.warningThreshold) {
      recommendations.push('⚠️ Cache size is elevated. Monitor for memory leaks.');
    }
    
    if (metrics.memoryWarnings > 5) {
      recommendations.push('📊 Frequent memory warnings detected. Review cache configuration.');
    }
    
    if (metrics.cleanupsPerformed > 10) {
      recommendations.push('🧹 High cleanup frequency. Consider optimizing cache policies.');
    }
    
    if (this.memoryLeakDetector.hasPotentialLeak()) {
      recommendations.push('🔍 Potential memory leak detected. Investigate subscription cleanup.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Cache performance is optimal.');
    }
    
    return recommendations;
  }

  destroy() {
    this.stopMonitoring();
    this.memoryLeakDetector.destroy();
    console.log('🔍 Apollo Cache Monitor: Destroyed');
  }
}

class MemoryLeakDetector {
  constructor() {
    this.sizeHistory = [];
    this.maxHistoryLength = 60; // Keep 60 data points (1 hour at 1-minute intervals)
    this.leakThreshold = 1024 * 1024; // 1MB growth over time
    this.suspiciousGrowthCount = 0;
  }

  checkMemoryLeak(currentSize, timestamp) {
    this.sizeHistory.push({ size: currentSize, timestamp });
    
    // Keep only recent history
    if (this.sizeHistory.length > this.maxHistoryLength) {
      this.sizeHistory.shift();
    }
    
    // Check for suspicious growth patterns
    if (this.sizeHistory.length >= 10) {
      const recentGrowth = this.calculateGrowthRate();
      
      if (recentGrowth > this.leakThreshold) {
        this.suspiciousGrowthCount++;
        console.warn(`🔍 Memory Leak Detector: Suspicious growth detected: ${(recentGrowth / 1024).toFixed(2)}KB`);
        
        if (this.suspiciousGrowthCount >= 3) {
          console.error('🚨 Memory Leak Detector: Potential memory leak confirmed!');
          return true;
        }
      } else {
        // Reset counter if growth is normal
        this.suspiciousGrowthCount = Math.max(0, this.suspiciousGrowthCount - 1);
      }
    }
    
    return false;
  }

  calculateGrowthRate() {
    if (this.sizeHistory.length < 2) return 0;
    
    const recent = this.sizeHistory.slice(-10); // Last 10 measurements
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    
    return newest.size - oldest.size;
  }

  hasPotentialLeak() {
    return this.suspiciousGrowthCount >= 3;
  }

  getMetrics() {
    return {
      suspiciousGrowthCount: this.suspiciousGrowthCount,
      hasPotentialLeak: this.hasPotentialLeak(),
      historyLength: this.sizeHistory.length,
      currentGrowthRate: this.calculateGrowthRate()
    };
  }

  destroy() {
    this.sizeHistory = [];
    this.suspiciousGrowthCount = 0;
  }
}

export { ApolloCacheMonitor, MemoryLeakDetector };
export default ApolloCacheMonitor;