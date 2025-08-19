import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* Base styles for the React app root */
  body {
    margin: 0;
    padding: 0;
    font-family: ${props => props.theme.fontFamily};
  }
  
  /* CSS Custom Properties fallback (if needed) */
  :root {
    /* Colors */
    --primary-color: ${props => props.theme.colors.primary};
    --primary-dark: ${props => props.theme.colors.primaryDark};
    --primary-light: ${props => props.theme.colors.primaryLight};
    --secondary-color: ${props => props.theme.colors.secondary};
    --success-color: ${props => props.theme.colors.success};
    --danger-color: ${props => props.theme.colors.danger};
    --warning-color: ${props => props.theme.colors.warning};
    --info-color: ${props => props.theme.colors.info};
    
    /* Neutral Colors */
    --white: ${props => props.theme.colors.white};
    --light-gray: ${props => props.theme.colors.lightGray};
    --gray-100: ${props => props.theme.colors.gray100};
    --gray-200: ${props => props.theme.colors.gray200};
    --gray-300: ${props => props.theme.colors.gray300};
    --gray-400: ${props => props.theme.colors.gray400};
    --gray-500: ${props => props.theme.colors.gray500};
    --gray-600: ${props => props.theme.colors.gray600};
    --gray-700: ${props => props.theme.colors.gray700};
    --gray-800: ${props => props.theme.colors.gray800};
    --gray-900: ${props => props.theme.colors.gray900};
    --black: ${props => props.theme.colors.black};
    
    /* Text Colors */
    --text-primary: ${props => props.theme.colors.textPrimary};
    --text-secondary: ${props => props.theme.colors.textSecondary};
    --text-muted: ${props => props.theme.colors.textMuted};
    --text-light: ${props => props.theme.colors.textLight};
    --text-opaque: ${props => props.theme.colors.textOpaque};
    
    /* Spacing */
    --spacing-xs: ${props => props.theme.spacing.xs};
    --spacing-sm: ${props => props.theme.spacing.sm};
    --spacing-md: ${props => props.theme.spacing.md};
    --spacing-lg: ${props => props.theme.spacing.lg};
    --spacing-xl: ${props => props.theme.spacing.xl};
    --spacing-xxl: ${props => props.theme.spacing.xxl};
    
    /* Border Radius */
    --radius-sm: ${props => props.theme.radius.sm};
    --radius-md: ${props => props.theme.radius.md};
    --radius-lg: ${props => props.theme.radius.lg};
    --radius-xl: ${props => props.theme.radius.xl};
    
    /* Typography */
    --font-family: ${props => props.theme.fontFamily};
    --font-size-xs: ${props => props.theme.fontSize.xs};
    --font-size-sm: ${props => props.theme.fontSize.sm};
    --font-size-base: ${props => props.theme.fontSize.base};
    --font-size-lg: ${props => props.theme.fontSize.lg};
    --font-size-xl: ${props => props.theme.fontSize.xl};
    --font-size-2xl: ${props => props.theme.fontSize.xxl};
    --font-size-3xl: ${props => props.theme.fontSize.xxxl};
    
    /* Line Heights */
    --line-height-tight: ${props => props.theme.lineHeight.tight};
    --line-height-normal: ${props => props.theme.lineHeight.normal};
    --line-height-relaxed: ${props => props.theme.lineHeight.relaxed};
  }
  
  /* Reset and Base Styles */
  * {
    box-sizing: border-box;
  }
  
  .chat-widget *,
  .chat-widget *:before,
  .chat-widget *:after {
    box-sizing: inherit;
  }
`;

export default GlobalStyles;