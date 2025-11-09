/**
 * Styled Components CSP Integration
 * Helps styled-components work with nonce-based Content Security Policy
 */

import { useCSPNonce } from './secure-csp.js';

/**
 * Custom hook for styled-components with CSP nonce support
 * @returns {Object} Styled components configuration with nonce
 */
export function useStyledComponentsCSP() {
  const nonce = useCSPNonce();
  
  return {
    // Get nonce for styled-components
    nonce,
    
    // Configure styled-components to use nonce
    getStyleSheetConfig: () => {
      if (nonce) {
        return {
          nonce: nonce
        };
      }
      return {};
    },
    
    // Helper to create styled component with nonce
    withNonce: (styledComponent) => {
      if (nonce) {
        // Add nonce attribute to styled component
        return styledComponent.withConfig({
          shouldForwardProp: (prop, defaultValidatorFn) => {
            // Allow nonce prop to be forwarded
            if (prop === 'nonce') return true;
            return defaultValidatorFn(prop);
          }
        });
      }
      return styledComponent;
    }
  };
}

/**
 * CSP-aware StyleSheet Manager
 * Manages style sheets with nonce support for styled-components
 */
export class CSPStyleSheetManager {
  constructor() {
    this.nonce = null;
    this.styleElements = new Map();
    this.init();
  }

  init() {
    // Get nonce from meta tag or global variable
    if (typeof document !== 'undefined') {
      const nonceMeta = document.querySelector('meta[name="csp-nonce"]');
      if (nonceMeta) {
        this.nonce = nonceMeta.getAttribute('content');
      }
    }
    
    if (typeof window !== 'undefined' && window.CSP_NONCE) {
      this.nonce = window.CSP_NONCE;
    }
  }

  /**
   * Create style element with nonce
   * @param {string} css - CSS content
   * @param {string} id - Style element ID
   * @returns {HTMLStyleElement} Style element
   */
  createStyleElement(css, id) {
    if (typeof document === 'undefined') {
      return null;
    }

    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    
    // Add nonce if available
    if (this.nonce) {
      styleElement.setAttribute('nonce', this.nonce);
    }
    
    // Add ID for tracking
    if (id) {
      styleElement.setAttribute('data-styled-id', id);
      styleElement.id = id;
    }
    
    // Add CSP-compliant attributes
    styleElement.setAttribute('data-styled-components', 'true');
    
    return styleElement;
  }

  /**
   * Inject style element into DOM
   * @param {HTMLStyleElement} styleElement - Style element to inject
   * @param {string} position - Insert position ('head' or 'body')
   */
  injectStyleElement(styleElement, position = 'head') {
    if (!styleElement || typeof document === 'undefined') {
      return;
    }

    const target = position === 'head' ? document.head : document.body;
    target.appendChild(styleElement);
    
    // Track injected styles
    const id = styleElement.id || styleElement.getAttribute('data-styled-id');
    if (id) {
      this.styleElements.set(id, styleElement);
    }
  }

  /**
   * Remove style element from DOM
   * @param {string} id - Style element ID
   */
  removeStyleElement(id) {
    if (typeof document === 'undefined') {
      return;
    }

    const styleElement = this.styleElements.get(id);
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
      this.styleElements.delete(id);
    }
  }

  /**
   * Update style element content
   * @param {string} id - Style element ID
   * @param {string} newCss - New CSS content
   */
  updateStyleElement(id, newCss) {
    const styleElement = this.styleElements.get(id);
    if (styleElement) {
      styleElement.textContent = newCss;
    }
  }

  /**
   * Get all injected style elements
   * @returns {Map} Map of style elements
   */
  getStyleElements() {
    return new Map(this.styleElements);
  }

  /**
   * Clear all injected styles
   */
  clearAllStyles() {
    this.styleElements.forEach((styleElement, id) => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    });
    this.styleElements.clear();
  }

  /**
   * Get current nonce
   * @returns {string|null} Current nonce
   */
  getNonce() {
    return this.nonce;
  }

  /**
   * Update nonce (useful for SPAs)
   * @param {string} newNonce - New nonce
   */
  updateNonce(newNonce) {
    this.nonce = newNonce;
    
    // Update existing style elements with new nonce
    this.styleElements.forEach((styleElement) => {
      if (newNonce) {
        styleElement.setAttribute('nonce', newNonce);
      } else {
        styleElement.removeAttribute('nonce');
      }
    });
  }
}

/**
 * Global style sheet manager instance
 */
export const styleSheetManager = new CSPStyleSheetManager();

/**
 * React Hook for Style Sheet Manager
 * @returns {CSPStyleSheetManager} Style sheet manager instance
 */
export function useStyleSheetManager() {
  return styleSheetManager;
}

/**
 * Utility to create CSS-in-JS with nonce support
 * @param {Function} stylesFunction - Function that returns CSS string
 * @param {string} id - Style ID
 * @returns {Object} Style injection utilities
 */
export function createCSPAwareStyles(stylesFunction, id) {
  const manager = styleSheetManager;
  
  return {
    inject: () => {
      const css = typeof stylesFunction === 'function' ? stylesFunction() : stylesFunction;
      const styleElement = manager.createStyleElement(css, id);
      if (styleElement) {
        manager.injectStyleElement(styleElement);
      }
    },
    
    update: (newStyles) => {
      const css = typeof newStyles === 'function' ? newStyles() : newStyles;
      manager.updateStyleElement(id, css);
    },
    
    remove: () => {
      manager.removeStyleElement(id);
    },
    
    getNonce: () => manager.getNonce()
  };
}

/**
 * Styled Components Configuration
 * Configure styled-components to work with CSP
 */
export function configureStyledComponentsForCSP() {
  // This would be called once during app initialization
  
  if (typeof window !== 'undefined' && window.styledComponents) {
    // Configure styled-components if available
    const nonce = styleSheetManager.getNonce();
    
    // Add nonce to global styled-components configuration
    if (nonce) {
      window.styledComponents = {
        ...window.styledComponents,
        nonce: nonce
      };
    }
  }
}

/**
 * Development helper to validate CSP compatibility
 * @returns {Object} Validation result
 */
export function validateCSPCompatibility() {
  const validation = {
    hasNonce: false,
    hasCSPMeta: false,
    hasNonceMeta: false,
    styledComponentsWorking: false,
    recommendations: []
  };

  if (typeof document !== 'undefined') {
    // Check for CSP meta tag
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      validation.hasCSPMeta = true;
      const cspContent = cspMeta.getAttribute('content');
      
      // Check if CSP uses nonce
      if (cspContent.includes("'nonce-")) {
        validation.hasNonce = true;
      }
      
      // Check for unsafe directives
      if (cspContent.includes("'unsafe-inline'")) {
        validation.recommendations.push('Consider replacing unsafe-inline with nonce-based CSP');
      }
      
      if (cspContent.includes("'unsafe-eval'")) {
        validation.recommendations.push('Remove unsafe-eval from CSP for better security');
      }
    }

    // Check for nonce meta tag
    const nonceMeta = document.querySelector('meta[name="csp-nonce"]');
    if (nonceMeta) {
      validation.hasNonceMeta = true;
    }

    // Check if styled-components styles are being injected
    const styledElements = document.querySelectorAll('style[data-styled-components]');
    validation.styledComponentsWorking = styledElements.length > 0;
  }

  // Add recommendations based on validation
  if (!validation.hasNonce && !validation.hasCSPMeta) {
    validation.recommendations.push('Implement CSP with nonce-based approach');
  }

  if (validation.hasCSPMeta && !validation.hasNonce) {
    validation.recommendations.push('Update CSP to use nonce-based approach');
  }

  return validation;
}

export default {
  useStyledComponentsCSP,
  CSPStyleSheetManager,
  styleSheetManager,
  useStyleSheetManager,
  createCSPAwareStyles,
  configureStyledComponentsForCSP,
  validateCSPCompatibility
};