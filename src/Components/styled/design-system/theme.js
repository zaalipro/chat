// Theme for the chat widget
export const theme = {
  // Colors
  colors: {
    primary: 'rgba(39, 175, 96, 1)',
    primaryDark: 'rgba(30, 140, 77, 1)',
    primaryLight: 'rgba(39, 175, 96, 0.1)',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    
    // Neutral Colors
    white: '#ffffff',
    lightGray: '#f8f9fa',
    gray100: '#f1f3f4',
    gray200: '#e9ecef',
    gray300: '#dee2e6',
    gray400: '#ced4da',
    gray500: '#adb5bd',
    gray600: '#6c757d',
    gray700: '#495057',
    gray800: '#343a40',
    gray900: '#212529',
    black: '#000000',
    
    // Text Colors
    textPrimary: '#212529',
    textSecondary: '#6c757d',
    textMuted: '#999999',
    textLight: '#ffffff',
    textOpaque: 'rgba(255, 255, 255, 0.8)',
    
    // Background colors
    backgroundDarkGray: '#8196b2',
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  
  // Border Radius
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    circle: '50%',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    header: '0px -3px 42px 6px rgba(0,0,0,0.17)',
    hover: '0px 6px 30px -4px rgba(0,0,0,0.0)',
    hoverActive: '0px 6px 30px -4px rgba(0,0,0,0.45)',
    input: '0px -3px 48px -1px rgba(0,0,0,0.10)',
  },
  
  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    xxl: '1.5rem',
    xxxl: '1.875rem',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },
  
  // Z-index
  zIndex: {
    dropdown: 1000,
    modal: 1050,
    tooltip: 1070,
  },
  
  // Widget dimensions
  widget: {
    width: '400px',
    height: '700px',
    mobileWidth: '100%',
    mobileHeight: '100%',
  },
  
  // Message bubble
  message: {
    maxWidth: '280px',
    maxWidthMobile: '240px',
    minHeight: '44px',
    minHeightMobile: '40px',
    padding: '20px 24px',
    paddingMobile: '16px 20px',
  },
  
  // Avatar
  avatar: {
    size: '40px',
  },
};

export default theme;