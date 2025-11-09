/**
 * Test suite for timeout management functionality
 * Tests the comprehensive timeout cleanup implementation
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createChatTimeouts, clearChatTimeouts, clearChatTimeout } from '../../utils.js'

describe('Timeout Management', () => {
  let mockOnChatMissed
  let mockChats

  beforeEach(() => {
    // Mock the callback function
    mockOnChatMissed = vi.fn()
    
    // Mock chat data with contracts
    mockChats = [
      {
        id: 'chat1',
        contract: {
          id: 'contract1',
          chatMissTime: 2 // 2 seconds for quick testing
        }
      },
      {
        id: 'chat2',
        contract: {
          id: 'contract2',
          chatMissTime: 3 // 3 seconds for quick testing
        }
      },
      {
        id: 'chat3', // No contract - should not create timeout
        contract: null
      },
      {
        id: 'chat4', // Contract with no miss time - should not create timeout
        contract: {
          id: 'contract4',
          chatMissTime: 0
        }
      }
    ]

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore console mocks
    console.log.mockRestore()
    console.warn.mockRestore()
    console.error.mockRestore()
    
    // Clear all timers
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('createChatTimeouts', () => {
    it('should create timeouts for valid chats with contracts', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      // Should have 2 timeouts (chat1 and chat2)
      expect(Object.keys(timeoutManager.timeouts)).toHaveLength(2)
      expect(timeoutManager.timeouts.chat1).toBeDefined()
      expect(timeoutManager.timeouts.chat2).toBeDefined()
      expect(timeoutManager.timeouts.chat3).toBeUndefined()
      expect(timeoutManager.timeouts.chat4).toBeUndefined()
      
      // Verify timeout structure
      expect(timeoutManager.timeouts.chat1).toHaveProperty('timeoutId')
      expect(timeoutManager.timeouts.chat1).toHaveProperty('contractId', 'contract1')
      expect(timeoutManager.timeouts.chat1).toHaveProperty('missTime', 2)
      expect(timeoutManager.timeouts.chat1).toHaveProperty('clear')
      expect(timeoutManager.timeouts.chat1).toHaveProperty('isActive')
    })

    it('should return timeout management functions', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      expect(typeof timeoutManager.clearAll).toBe('function')
      expect(typeof timeoutManager.clear).toBe('function')
      expect(typeof timeoutManager.getActiveCount).toBe('function')
      expect(typeof timeoutManager.getTimeoutInfo).toBe('function')
      expect(typeof timeoutManager.getAllTimeouts).toBe('function')
    })

    it('should execute callback and clean up timeout when timer fires', async () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      // Fast-forward time to trigger first timeout
      vi.advanceTimersByTime(2000)
      
      // Check that callback was called for chat1
      expect(mockOnChatMissed).toHaveBeenCalledWith('chat1', 'contract1')
      
      // Check that timeout1 was cleaned up
      expect(timeoutManager.timeouts.chat1).toBeUndefined()
      expect(timeoutManager.timeouts.chat2).toBeDefined() // Still active
      
      // Fast-forward for second timeout
      vi.advanceTimersByTime(1000)
      
      // Check that callback was called for chat2
      expect(mockOnChatMissed).toHaveBeenCalledWith('chat2', 'contract2')
      
      // Check that timeout2 was also cleaned up
      expect(timeoutManager.timeouts.chat2).toBeUndefined()
    })

    it('should handle callback errors gracefully', () => {
      vi.useFakeTimers()
      
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      
      const timeoutManager = createChatTimeouts(mockChats, errorCallback)
      
      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(2000)
      
      // Callback should have been called despite error
      expect(errorCallback).toHaveBeenCalled()
      
      // Timeout should still be cleaned up despite error
      expect(timeoutManager.timeouts.chat1).toBeUndefined()
      
      // Error should be logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error executing onChatMissed for chat chat1:'),
        expect.any(Error)
      )
    })
  })

  describe('timeoutManager.clear', () => {
    it('should clear specific timeout', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      // Verify timeout exists
      expect(timeoutManager.timeouts.chat1).toBeDefined()
      expect(timeoutManager.getActiveCount()).toBe(2)
      
      // Clear specific timeout
      const result = timeoutManager.clear('chat1')
      
      expect(result).toBe(true)
      expect(timeoutManager.timeouts.chat1).toBeUndefined()
      expect(timeoutManager.getActiveCount()).toBe(1)
    })

    it('should return false for non-existent timeout', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      const result = timeoutManager.clear('nonexistent')
      
      expect(result).toBe(false)
    })
  })

  describe('timeoutManager.clearAll', () => {
    it('should clear all timeouts', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      // Verify timeouts exist
      expect(timeoutManager.getActiveCount()).toBe(2)
      
      // Clear all timeouts
      timeoutManager.clearAll()
      
      // Verify all timeouts are cleared
      expect(timeoutManager.getActiveCount()).toBe(0)
      expect(Object.keys(timeoutManager.timeouts)).toHaveLength(0)
    })

    it('should not execute callbacks after clearing all', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      // Clear all timeouts
      timeoutManager.clearAll()
      
      // Fast-forward time
      vi.advanceTimersByTime(5000)
      
      // Callback should not be called
      expect(mockOnChatMissed).not.toHaveBeenCalled()
    })
  })

  describe('timeoutManager.getActiveCount', () => {
    it('should return correct active timeout count', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      expect(timeoutManager.getActiveCount()).toBe(2)
      
      // Clear one timeout
      timeoutManager.clear('chat1')
      
      expect(timeoutManager.getActiveCount()).toBe(1)
      
      // Clear all
      timeoutManager.clearAll()
      
      expect(timeoutManager.getActiveCount()).toBe(0)
    })
  })

  describe('timeoutManager.getTimeoutInfo', () => {
    it('should return timeout info for existing chat', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      const info = timeoutManager.getTimeoutInfo('chat1')
      
      expect(info).toBeDefined()
      expect(info.contractId).toBe('contract1')
      expect(info.missTime).toBe(2)
      expect(typeof info.clear).toBe('function')
      expect(typeof info.isActive).toBe('function')
    })

    it('should return null for non-existent chat', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      const info = timeoutManager.getTimeoutInfo('nonexistent')
      
      expect(info).toBeNull()
    })
  })

  describe('timeoutManager.getAllTimeouts', () => {
    it('should return copy of all timeouts', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      const allTimeouts = timeoutManager.getAllTimeouts()
      
      expect(Object.keys(allTimeouts)).toHaveLength(2)
      expect(allTimeouts.chat1).toBeDefined()
      expect(allTimeouts.chat2).toBeDefined()
      
      // Verify it's a copy (modifying shouldn't affect original)
      delete allTimeouts.chat1
      expect(timeoutManager.timeouts.chat1).toBeDefined()
    })
  })

  describe('timeoutManager.timeouts[].clear', () => {
    it('should clear individual timeout using its clear method', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      // Use individual clear method
      timeoutManager.timeouts.chat1.clear()
      
      expect(timeoutManager.timeouts.chat1).toBeUndefined()
      expect(timeoutManager.getActiveCount()).toBe(1)
    })
  })

  describe('timeoutManager.timeouts[].isActive', () => {
    it('should return true for active timeout', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      expect(timeoutManager.timeouts.chat1.isActive()).toBe(true)
    })

    it('should return false for cleared timeout', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      timeoutManager.clear('chat1')
      
      expect(timeoutManager.timeouts.chat1?.isActive()).toBeUndefined()
    })
  })

  describe('Legacy Functions', () => {
    it('clearChatTimeouts should work with legacy timeout objects', () => {
      vi.useFakeTimers()
      
      // Create legacy-style timeout object
      const legacyTimeouts = {
        chat1: { timeoutId: setTimeout(() => {}, 1000) },
        chat2: { timeoutId: setTimeout(() => {}, 2000) }
      }
      
      clearChatTimeouts(legacyTimeouts)
      
      expect(Object.keys(legacyTimeouts)).toHaveLength(0)
    })

    it('clearChatTimeout should work with legacy timeout objects', () => {
      vi.useFakeTimers()
      
      // Create legacy-style timeout object
      const legacyTimeouts = {
        chat1: { timeoutId: setTimeout(() => {}, 1000) },
        chat2: { timeoutId: setTimeout(() => {}, 2000) }
      }
      
      clearChatTimeout(legacyTimeouts, 'chat1')
      
      expect(legacyTimeouts.chat1).toBeUndefined()
      expect(legacyTimeouts.chat2).toBeDefined()
    })

    it('legacy functions should handle invalid inputs gracefully', () => {
      // Test with null/undefined inputs
      expect(() => clearChatTimeouts(null)).not.toThrow()
      expect(() => clearChatTimeouts(undefined)).not.toThrow()
      expect(() => clearChatTimeouts({})).not.toThrow()
      expect(() => clearChatTimeout(null, 'chat1')).not.toThrow()
      expect(() => clearChatTimeout({}, null)).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty chats array', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts([], mockOnChatMissed)
      
      expect(Object.keys(timeoutManager.timeouts)).toHaveLength(0)
      expect(timeoutManager.getActiveCount()).toBe(0)
    })

    it('should handle null/undefined chats array', () => {
      vi.useFakeTimers()
      
      const timeoutManager1 = createChatTimeouts(null, mockOnChatMissed)
      const timeoutManager2 = createChatTimeouts(undefined, mockOnChatMissed)
      
      expect(Object.keys(timeoutManager1.timeouts)).toHaveLength(0)
      expect(Object.keys(timeoutManager2.timeouts)).toHaveLength(0)
    })

    it('should handle chats with invalid contract data', () => {
      vi.useFakeTimers()
      
      const invalidChats = [
        { id: 'chat1', contract: null },
        { id: 'chat2', contract: { chatMissTime: -1 } },
        { id: 'chat3', contract: { chatMissTime: 'invalid' } },
        { id: 'chat4' } // no contract property
      ]
      
      const timeoutManager = createChatTimeouts(invalidChats, mockOnChatMissed)
      
      expect(Object.keys(timeoutManager.timeouts)).toHaveLength(0)
      expect(timeoutManager.getActiveCount()).toBe(0)
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should clean up timeouts after execution to prevent memory leaks', () => {
      vi.useFakeTimers()
      
      const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
      
      // Verify initial state
      expect(timeoutManager.getActiveCount()).toBe(2)
      
      // Fast-forward to trigger all timeouts
      vi.advanceTimersByTime(5000)
      
      // Verify all timeouts are cleaned up
      expect(timeoutManager.getActiveCount()).toBe(0)
      expect(Object.keys(timeoutManager.timeouts)).toHaveLength(0)
      
      // Verify cleanup was logged
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('cleaned up after execution'))
    })

    it('should not create memory leaks with multiple create/clear cycles', () => {
      vi.useFakeTimers()
      
      for (let i = 0; i < 5; i++) {
        const timeoutManager = createChatTimeouts(mockChats, mockOnChatMissed)
        expect(timeoutManager.getActiveCount()).toBe(2)
        
        timeoutManager.clearAll()
        expect(timeoutManager.getActiveCount()).toBe(0)
      }
      
      // Should not throw errors or accumulate memory
      expect(true).toBe(true)
    })
  })
})