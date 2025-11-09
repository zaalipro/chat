/**
 * Styled Components CSP Integration Tests
 * Tests for CSP integration with styled-components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useStyledComponentsCSP,
  CSPStyleSheetManager,
  styleSheetManager,
  useStyleSheetManager,
  createCSPAwareStyles,
  configureStyledComponentsForCSP,
  validateCSPCompatibility
} from '../styled-csp-integration.js';

// Mock DOM environment
const mockDocument = {
  createElement: vi.fn((tagName) => {
    const element = {
      tagName: tagName.toUpperCase(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      textContent: '',
      parentNode: null,
      appendChild: vi.fn(),
      removeChild: vi.fn()
    };
    return element;
  }),
  querySelector: vi.fn(),
  head: {
    appendChild: vi.fn()
  },
  body: {
    appendChild: vi.fn()
  },
  querySelectorAll: vi.fn(() => [])
};

const mockWindow = {
  CSP_NONCE: null,
  styledComponents: null
};

describe('Styled Components CSP Integration', () => {
  beforeEach(() => {
    global.document = mockDocument;
    global.window = mockWindow;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useStyledComponentsCSP Hook', () => {
    it('should return nonce and configuration', () => {
      // Mock nonce meta tag
      const mockMeta = {
        getAttribute: vi.fn((attr) => attr === 'content' ? 'test-nonce-123' : null)
      };
      mockDocument.querySelector.mockReturnValue(mockMeta);

      const result = useStyledComponentsCSP();
      
      expect(result.nonce).toBe('test-nonce-123');
      expect(typeof result.getStyleSheetConfig).toBe('function');
      expect(typeof result.withNonce).toBe('function');
    });

    it('should return null nonce when not found', () => {
      mockDocument.querySelector.mockReturnValue(null);
      mockWindow.CSP_NONCE = null;

      const result = useStyledComponentsCSP();
      
      expect(result.nonce).toBeNull();
    });

    it('should get nonce from global variable', () => {
      mockDocument.querySelector.mockReturnValue(null);
      mockWindow.CSP_NONCE = 'global-nonce-456';

      const result = useStyledComponentsCSP();
      
      expect(result.nonce).toBe('global-nonce-456');
    });

    it('should create style sheet config with nonce', () => {
      const mockMeta = {
        getAttribute: vi.fn((attr) => attr === 'content' ? 'test-nonce-123' : null)
      };
      mockDocument.querySelector.mockReturnValue(mockMeta);

      const result = useStyledComponentsCSP();
      const config = result.getStyleSheetConfig();
      
      expect(config).toEqual({ nonce: 'test-nonce-123' });
    });

    it('should create empty config without nonce', () => {
      mockDocument.querySelector.mockReturnValue(null);
      mockWindow.CSP_NONCE = null;

      const result = useStyledComponentsCSP();
      const config = result.getStyleSheetConfig();
      
      expect(config).toEqual({});
    });

    it('should wrap styled component with nonce', () => {
      const mockMeta = {
        getAttribute: vi.fn((attr) => attr === 'content' ? 'test-nonce-123' : null)
      };
      mockDocument.querySelector.mockReturnValue(mockMeta);

      const result = useStyledComponentsCSP();
      const mockStyledComponent = {
        withConfig: vi.fn((config) => mockStyledComponent)
      };

      const wrapped = result.withNonce(mockStyledComponent);
      
      expect(mockStyledComponent.withConfig).toHaveBeenCalledWith({
        shouldForwardProp: expect.any(Function)
      });
      expect(wrapped).toBe(mockStyledComponent);
    });
  });

  describe('CSPStyleSheetManager', () => {
    let manager;

    beforeEach(() => {
      manager = new CSPStyleSheetManager();
    });

    it('should initialize without nonce', () => {
      expect(manager.nonce).toBeNull();
      expect(manager.styleElements).toBeInstanceOf(Map);
    });

    it('should initialize with nonce from meta tag', () => {
      const mockMeta = {
        getAttribute: vi.fn((attr) => attr === 'content' ? 'meta-nonce-789' : null)
      };
      mockDocument.querySelector.mockReturnValue(mockMeta);

      const managerWithNonce = new CSPStyleSheetManager();
      expect(managerWithNonce.nonce).toBe('meta-nonce-789');
    });

    it('should initialize with nonce from global variable', () => {
      mockWindow.CSP_NONCE = 'global-nonce-999';
      mockDocument.querySelector.mockReturnValue(null);

      const managerWithNonce = new CSPStyleSheetManager();
      expect(managerWithNonce.nonce).toBe('global-nonce-999');
    });

    it('should create style element with nonce', () => {
      manager.nonce = 'test-nonce-123';
      const css = 'body { color: red; }';
      
      const styleElement = manager.createStyleElement(css, 'test-style');
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('style');
      expect(styleElement.textContent).toBe(css);
      expect(styleElement.setAttribute).toHaveBeenCalledWith('nonce', 'test-nonce-123');
      expect(styleElement.setAttribute).toHaveBeenCalledWith('data-styled-id', 'test-style');
      expect(styleElement.setAttribute).toHaveBeenCalledWith('data-styled-components', 'true');
    });

    it('should create style element without nonce', () => {
      const css = 'body { color: red; }';
      
      const styleElement = manager.createStyleElement(css, 'test-style');
      
      expect(styleElement.textContent).toBe(css);
      expect(styleElement.setAttribute).not.toHaveBeenCalledWith('nonce', expect.any(String));
    });

    it('should inject style element into head', () => {
      const css = 'body { color: red; }';
      const styleElement = manager.createStyleElement(css, 'test-style');
      
      manager.injectStyleElement(styleElement, 'head');
      
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(styleElement);
      expect(manager.styleElements.get('test-style')).toBe(styleElement);
    });

    it('should inject style element into body', () => {
      const css = 'body { color: red; }';
      const styleElement = manager.createStyleElement(css, 'test-style');
      
      manager.injectStyleElement(styleElement, 'body');
      
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(styleElement);
      expect(manager.styleElements.get('test-style')).toBe(styleElement);
    });

    it('should remove style element', () => {
      const css = 'body { color: red; }';
      const styleElement = manager.createStyleElement(css, 'test-style');
      styleElement.parentNode = mockDocument.head;
      
      manager.injectStyleElement(styleElement);
      manager.removeStyleElement('test-style');
      
      expect(mockDocument.head.removeChild).toHaveBeenCalledWith(styleElement);
      expect(manager.styleElements.has('test-style')).toBe(false);
    });

    it('should update style element content', () => {
      const css = 'body { color: red; }';
      const styleElement = manager.createStyleElement(css, 'test-style');
      
      manager.injectStyleElement(styleElement);
      manager.updateStyleElement('test-style', 'body { color: blue; }');
      
      expect(styleElement.textContent).toBe('body { color: blue; }');
    });

    it('should clear all styles', () => {
      const styleElement1 = manager.createStyleElement('css1', 'style1');
      const styleElement2 = manager.createStyleElement('css2', 'style2');
      styleElement1.parentNode = mockDocument.head;
      styleElement2.parentNode = mockDocument.head;
      
      manager.injectStyleElement(styleElement1);
      manager.injectStyleElement(styleElement2);
      
      expect(manager.styleElements.size).toBe(2);
      
      manager.clearAllStyles();
      
      expect(mockDocument.head.removeChild).toHaveBeenCalledTimes(2);
      expect(manager.styleElements.size).toBe(0);
    });

    it('should update nonce', () => {
      manager.updateNonce('new-nonce-456');
      
      expect(manager.nonce).toBe('new-nonce-456');
    });

    it('should update existing style elements with new nonce', () => {
      const styleElement = manager.createStyleElement('css', 'style');
      manager.injectStyleElement(styleElement);
      
      manager.updateNonce('new-nonce-789');
      
      expect(styleElement.setAttribute).toHaveBeenCalledWith('nonce', 'new-nonce-789');
    });
  });

  describe('useStyleSheetManager Hook', () => {
    it('should return the global style sheet manager instance', () => {
      const manager = useStyleSheetManager();
      
      expect(manager).toBe(styleSheetManager);
      expect(manager).toBeInstanceOf(CSPStyleSheetManager);
    });
  });

  describe('createCSPAwareStyles', () => {
    it('should create style injection utilities', () => {
      const stylesFunction = () => 'body { color: red; }';
      const utilities = createCSPAwareStyles(stylesFunction, 'test-styles');
      
      expect(typeof utilities.inject).toBe('function');
      expect(typeof utilities.update).toBe('function');
      expect(typeof utilities.remove).toBe('function');
      expect(typeof utilities.getNonce).toBe('function');
    });

    it('should inject styles with function', () => {
      const stylesFunction = () => 'body { color: red; }';
      const utilities = createCSPAwareStyles(stylesFunction, 'test-styles');
      
      utilities.inject();
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('style');
      expect(mockDocument.head.appendChild).toHaveBeenCalled();
    });

    it('should inject styles with string', () => {
      const cssString = 'body { color: blue; }';
      const utilities = createCSPAwareStyles(cssString, 'test-styles');
      
      utilities.inject();
      
      const styleElement = mockDocument.createElement.mock.results[0].value;
      expect(styleElement.textContent).toBe(cssString);
    });

    it('should update styles', () => {
      const utilities = createCSPAwareStyles(() => 'initial css', 'test-styles');
      
      utilities.inject();
      utilities.update(() => 'updated css');
      
      const styleElement = mockDocument.createElement.mock.results[0].value;
      expect(styleElement.textContent).toBe('updated css');
    });

    it('should remove styles', () => {
      const utilities = createCSPAwareStyles('css', 'test-styles');
      
      utilities.inject();
      utilities.remove();
      
      expect(styleSheetManager.styleElements.has('test-styles')).toBe(false);
    });
  });

  describe('configureStyledComponentsForCSP', () => {
    it('should configure styled-components when available', () => {
      mockWindow.styledComponents = {};
      styleSheetManager.nonce = 'test-nonce-123';
      
      configureStyledComponentsForCSP();
      
      expect(mockWindow.styledComponents.nonce).toBe('test-nonce-123');
    });

    it('should handle when styled-components is not available', () => {
      mockWindow.styledComponents = undefined;
      
      expect(() => {
        configureStyledComponentsForCSP();
      }).not.toThrow();
    });
  });

  describe('validateCSPCompatibility', () => {
    it('should validate complete CSP setup', () => {
      const mockCSPMeta = {
        getAttribute: vi.fn(() => "default-src 'self'; script-src 'self' 'nonce-123';")
      };
      const mockNonceMeta = {
        getAttribute: vi.fn(() => 'nonce-123')
      };
      
      mockDocument.querySelector
        .mockImplementation((selector) => {
          if (selector === 'meta[http-equiv="Content-Security-Policy"]') {
            return mockCSPMeta;
          }
          if (selector === 'meta[name="csp-nonce"]') {
            return mockNonceMeta;
          }
          return null;
        });

      const validation = validateCSPCompatibility();
      
      expect(validation.hasCSPMeta).toBe(true);
      expect(validation.hasNonce).toBe(true);
      expect(validation.hasNonceMeta).toBe(true);
      expect(validation.recommendations).toHaveLength(0);
    });

    it('should detect unsafe CSP directives', () => {
      const mockCSPMeta = {
        getAttribute: vi.fn(() => "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';")
      };
      
      mockDocument.querySelector
        .mockImplementation((selector) => {
          if (selector === 'meta[http-equiv="Content-Security-Policy"]') {
            return mockCSPMeta;
          }
          return null;
        });

      const validation = validateCSPCompatibility();
      
      expect(validation.hasCSPMeta).toBe(true);
      expect(validation.hasNonce).toBe(false);
      expect(validation.recommendations).toContain('Consider replacing unsafe-inline with nonce-based CSP');
      expect(validation.recommendations).toContain('Remove unsafe-eval from CSP for better security');
    });

    it('should recommend CSP implementation when missing', () => {
      mockDocument.querySelector.mockReturnValue(null);

      const validation = validateCSPCompatibility();
      
      expect(validation.hasCSPMeta).toBe(false);
      expect(validation.hasNonce).toBe(false);
      expect(validation.recommendations).toContain('Implement CSP with nonce-based approach');
    });

    it('should recommend nonce update for existing CSP', () => {
      const mockCSPMeta = {
        getAttribute: vi.fn(() => "default-src 'self'; script-src 'self' 'unsafe-inline';")
      };
      
      mockDocument.querySelector
        .mockImplementation((selector) => {
          if (selector === 'meta[http-equiv="Content-Security-Policy"]') {
            return mockCSPMeta;
          }
          return null;
        });

      const validation = validateCSPCompatibility();
      
      expect(validation.hasCSPMeta).toBe(true);
      expect(validation.hasNonce).toBe(false);
      expect(validation.recommendations).toContain('Update CSP to use nonce-based approach');
    });

    it('should detect styled-components working', () => {
      const mockStyledElements = [
        { tagName: 'STYLE' },
        { tagName: 'STYLE' }
      ];
      mockDocument.querySelectorAll.mockReturnValue(mockStyledElements);

      const validation = validateCSPCompatibility();
      
      expect(validation.styledComponentsWorking).toBe(true);
    });
  });

  describe('Global Style Sheet Manager', () => {
    it('should export a global instance', () => {
      expect(styleSheetManager).toBeInstanceOf(CSPStyleSheetManager);
    });

    it('should maintain state across calls', () => {
      const nonce1 = 'nonce-111';
      const nonce2 = 'nonce-222';
      
      styleSheetManager.updateNonce(nonce1);
      expect(styleSheetManager.getNonce()).toBe(nonce1);
      
      styleSheetManager.updateNonce(nonce2);
      expect(styleSheetManager.getNonce()).toBe(nonce2);
    });
  });
});