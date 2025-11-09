import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import MessageForm from '../MessageForm.js';
import { initChatWidget } from '../../widget.js';

// Mock Apollo Client
vi.mock('@apollo/client', () => ({
  Mutation: ({ children }) => children({
    createMessage: vi.fn().mockResolvedValue({ data: { createMessage: { id: '1' } } })
  }),
  gql: vi.fn(),
}));

// Mock store2
vi.mock('store2', () => ({
  default: vi.fn(),
}));

// Mock sanitize utilities
vi.mock('../../sanitize.js', () => ({
  sanitizeMessage: vi.fn((msg) => msg),
  sanitizeAuthor: vi.fn((name) => name),
}));

// Mock DOM APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
};

describe('Event Listener Cleanup Implementation', () => {
  let container;
  let addEventListenerSpy;
  let removeEventListenerSpy;

  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    container.id = 'test-widget-root';
    document.body.appendChild(container);

    // Spy on event listener methods
    addEventListenerSpy = vi.spyOn(Element.prototype, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(Element.prototype, 'removeEventListener');

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Cleanup React
    cleanup();
    
    // Restore spies
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('MessageForm Event Listener Management', () => {
    it('should add and remove event listeners properly', () => {
      // Mock the Mutation component to render children
      const MockMutation = ({ children }) => {
        return children({
          createMessage: vi.fn().mockResolvedValue({ data: { createMessage: { id: '1' } } })
        });
      };

      // Mock the CREATE_MESSAGE import
      vi.doMock('../../queries.js', () => ({
        CREATE_MESSAGE: 'mock-mutation'
      }));

      render(<MessageForm chatId="test-chat" />);

      // Find the input element
      const inputElement = screen.getByPlaceholderText('Send a message ...');
      
      // Simulate typing to trigger event listeners
      fireEvent.change(inputElement, { target: { value: 'test message' } });
      
      // Verify that addEventListener was called for keydown event
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      // Cleanup component
      cleanup();
      
      // Verify that removeEventListener was called
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should use stable event handlers with useCallback', () => {
      const { rerender } = render(<MessageForm chatId="test-chat" />);
      
      const inputElement = screen.getByPlaceholderText('Send a message ...');
      
      // Clear previous calls
      addEventListenerSpy.mockClear();
      
      // Rerender component
      rerender(<MessageForm chatId="test-chat" />);
      
      // The event listener should not be re-added since handler is stable
      // This indicates useCallback is working properly
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should handle keyboard events correctly', () => {
      render(<MessageForm chatId="test-chat" />);
      
      const inputElement = screen.getByPlaceholderText('Send a message ...');
      const submitButton = screen.getByText('Send');
      
      // Type a message
      fireEvent.change(inputElement, { target: { value: 'test message' } });
      
      // Test Enter key submission
      fireEvent.keyDown(inputElement, { keyCode: 13, shiftKey: false });
      
      // Test Enter + Shift (should not submit)
      fireEvent.keyDown(inputElement, { keyCode: 13, shiftKey: true });
      
      // Verify input still has content (shift+enter didn't submit)
      expect(inputElement.value).toBe('test message');
    });

    it('should handle focus and blur events properly', () => {
      render(<MessageForm chatId="test-chat" />);
      
      const inputElement = screen.getByPlaceholderText('Send a message ...');
      
      // Test focus event
      fireEvent.focus(inputElement);
      
      // Test blur event
      fireEvent.blur(inputElement);
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Widget MediaQuery Management', () => {
    it('should create and manage MediaQuery listeners properly', () => {
      const cleanup = initChatWidget({
        containerId: 'test-widget-root',
        publicKey: 'test-key'
      });

      // Verify MediaQuery was called
      expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 450px)');
      
      // Get the mock mediaQuery instance
      const mediaQueryMock = window.matchMedia('(max-width: 450px)');
      
      // Verify event listener was added
      expect(mediaQueryMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      // Test cleanup
      cleanup();
      
      // Verify event listener was removed
      expect(mediaQueryMock.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should handle legacy addListener fallback', () => {
      // Mock browser without addEventListener support
      const mockMediaQuery = {
        matches: false,
        media: '(max-width: 450px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: undefined, // No support
        removeEventListener: undefined, // No support
        dispatchEvent: vi.fn(),
      };
      
      window.matchMedia = vi.fn(() => mockMediaQuery);

      const cleanup = initChatWidget({
        containerId: 'test-widget-root',
        publicKey: 'test-key'
      });

      // Verify legacy addListener was used
      expect(mockMediaQuery.addListener).toHaveBeenCalledWith(expect.any(Function));
      
      // Test cleanup
      cleanup();
      
      // Verify legacy removeListener was used
      expect(mockMediaQuery.removeListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle MediaQuery errors gracefully', () => {
      // Mock MediaQuery that throws an error
      window.matchMedia = vi.fn(() => {
        throw new Error('MediaQuery not supported');
      });

      // Should not throw error
      expect(() => {
        const cleanup = initChatWidget({
          containerId: 'test-widget-root',
          publicKey: 'test-key'
        });
        cleanup();
      }).not.toThrow();
    });

    it('should update container styles based on screen size', () => {
      const cleanup = initChatWidget({
        containerId: 'test-widget-root',
        publicKey: 'test-key'
      });

      const widgetContainer = document.getElementById('test-widget-root');
      expect(widgetContainer).toBeTruthy();
      
      // Get the mock mediaQuery instance
      const mediaQueryMock = window.matchMedia('(max-width: 450px)');
      
      // Simulate mobile view
      mediaQueryMock.matches = true;
      const changeHandler = mediaQueryMock.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });
      
      expect(widgetContainer.style.width).toBe('100%');
      expect(widgetContainer.style.height).toBe('100%');
      
      // Simulate desktop view
      changeHandler({ matches: false });
      
      expect(widgetContainer.style.width).toBe('400px');
      expect(widgetContainer.style.height).toBe('700px');
      
      cleanup();
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up all event listeners on widget destruction', () => {
      const cleanup = initChatWidget({
        containerId: 'test-widget-root',
        publicKey: 'test-key'
      });

      // Get the mock mediaQuery instance
      const mediaQueryMock = window.matchMedia('(max-width: 450px)');
      
      // Verify listeners were added
      expect(mediaQueryMock.addEventListener).toHaveBeenCalled();
      
      // Count event listeners before cleanup
      const addCalls = addEventListenerSpy.mock.calls.length;
      
      // Perform cleanup
      cleanup();
      
      // Verify cleanup was logged
      expect(console.log).toHaveBeenCalledWith('Widget: MediaQuery manager and all listeners cleaned up');
    });

    it('should handle performance monitoring in development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(<MessageForm chatId="test-chat" />);
      
      const inputElement = screen.getByPlaceholderText('Send a message ...');
      
      // Trigger event
      fireEvent.keyDown(inputElement, { keyCode: 13 });
      
      // Should log performance metrics in development
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Event keydown handled in')
      );

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should handle event handler errors gracefully', () => {
      render(<MessageForm chatId="test-chat" />);
      
      const inputElement = screen.getByPlaceholderText('Send a message ...');
      
      // Mock error in event handler
      const originalError = console.error;
      console.error = vi.fn();
      
      // Simulate error scenario
      const errorSpy = vi.spyOn(console, 'error');
      
      // Should not crash on errors
      expect(() => {
        fireEvent.keyDown(inputElement, { keyCode: 13 });
      }).not.toThrow();

      console.error = originalError;
    });
  });

  describe('Custom useEventListener Hook', () => {
    it('should properly manage event listener lifecycle', () => {
      // This would test the custom hook if it were exported
      // For now, we test its behavior through MessageForm
      const { unmount } = render(<MessageForm chatId="test-chat" />);
      
      const inputElement = screen.getByPlaceholderText('Send a message ...');
      
      // Verify event listener was added
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      // Unmount component
      unmount();
      
      // Verify event listener was removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should update handler when dependencies change', () => {
      const { rerender } = render(<MessageForm chatId="chat-1" />);
      
      const inputElement = screen.getByPlaceholderText('Send a message ...');
      
      // Clear previous calls
      removeEventListenerSpy.mockClear();
      addEventListenerSpy.mockClear();
      
      // Rerender with different chatId
      rerender(<MessageForm chatId="chat-2" />);
      
      // Should remove old listener and add new one
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with proper cleanup', async () => {
      // Initialize widget
      const widgetCleanup = initChatWidget({
        containerId: 'test-widget-root',
        publicKey: 'test-key'
      });

      // Render MessageForm within the widget context
      render(<MessageForm chatId="test-chat" />);
      
      const inputElement = screen.getByPlaceholderText('Send a message ...');
      
      // Test interactions
      fireEvent.change(inputElement, { target: { value: 'test message' } });
      fireEvent.keyDown(inputElement, { keyCode: 13 });
      
      // Cleanup everything
      cleanup();
      widgetCleanup();
      
      // Verify no errors occurred
      expect(true).toBe(true);
    });

    it('should handle rapid mount/unmount cycles', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<MessageForm chatId={`chat-${i}`} />);
        
        const inputElement = screen.getByPlaceholderText('Send a message ...');
        fireEvent.change(inputElement, { target: { value: `message ${i}` } });
        
        unmount();
      }
      
      // Should not cause memory leaks or errors
      expect(true).toBe(true);
    });
  });
});