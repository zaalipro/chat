import styled, { css } from 'styled-components';
import { fadeIn, fadeInUp, fadeInLeft } from './keyframes';
import { spin } from './keyframes';

// Layout Components
export const Container = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing.md};
  
  @media (max-width: 768px) {
    padding: 0 ${props => props.theme.spacing.sm};
  }
`;

export const Segment = styled.div`
  background: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.gray200};
  border-radius: ${props => props.theme.radius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
  
  ${props => props.$padded && `
    padding: ${props => props.theme.spacing.xl};
    
    @media (max-width: 768px) {
      padding: ${props => props.theme.spacing.lg};
    }
  `}
  
  ${props => props.$basic && `
    background: transparent;
    border: none;
    box-shadow: none;
    padding: ${props => props.theme.spacing.md};
  `}
`;

// Form Components
export const Form = styled.form`
  width: 100%;
`;

export const FormField = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @media (max-width: 768px) {
    margin-bottom: ${props => props.theme.spacing.md};
  }
`;

export const FormLabel = styled.label`
  display: block;
  margin-bottom: ${props => props.theme.spacing.sm};
  font-weight: 600;
  color: ${props => props.theme.colors.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};
`;

export const FormInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.gray300};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.fontSize.base};
  font-family: inherit;
  transition: border-color ${props => props.theme.transitions.fast}, box-shadow ${props => props.theme.transitions.fast};
  background: ${props => props.theme.colors.white};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
  
  ${props => props.$error && `
    border-color: ${props => props.theme.colors.danger};
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
  `}
`;

export const FormTextarea = styled.textarea`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.gray300};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.fontSize.base};
  font-family: inherit;
  transition: border-color ${props => props.theme.transitions.fast}, box-shadow ${props => props.theme.transitions.fast};
  background: ${props => props.theme.colors.white};
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
  
  ${props => props.$error && `
    border-color: ${props => props.theme.colors.danger};
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
  `}
`;

export const FormError = styled.div`
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: ${props => props.theme.radius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.colors.danger};
`;

export const FormErrorHeader = styled.div`
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

// Button Components
export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border: 1px solid transparent;
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.fontSize.base};
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  background: ${props => props.theme.colors.white};
  color: ${props => props.theme.colors.textPrimary};
  min-height: 2.5rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: ${props => props.theme.shadows.sm};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  ${props => props.$primary && `
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.white};
    border-color: ${props => props.theme.colors.primary};
    
    &:hover {
      background: ${props => props.theme.colors.primaryDark};
      border-color: ${props => props.theme.colors.primaryDark};
    }
  `}
  
  ${props => props.$secondary && `
    background: ${props => props.theme.colors.gray600};
    color: ${props => props.theme.colors.white};
    border-color: ${props => props.theme.colors.gray600};
    
    &:hover {
      background: ${props => props.theme.colors.gray700};
      border-color: ${props => props.theme.colors.gray700};
    }
  `}
  
  ${props => props.$basic && `
    background: transparent;
    border-color: ${props => props.theme.colors.gray300};
    color: ${props => props.theme.colors.textSecondary};
    
    &:hover {
      background: ${props => props.theme.colors.gray100};
      border-color: ${props => props.theme.colors.gray400};
    }
  `}
  
  ${props => props.$small && `
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.fontSize.sm};
    min-height: 2rem;
  `}
  
  ${props => props.$large && `
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
    font-size: ${props => props.theme.fontSize.lg};
    min-height: 3rem;
  `}
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

// Loader Component
export const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xxl};
  min-height: 200px;
`;

export const Loader = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme.colors.gray200};
  border-top: 3px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  ${css`
    animation: ${spin} 1s linear infinite;
  `}
  margin-bottom: ${props => props.theme.spacing.lg};
  
  ${props => props.$large && `
    width: 60px;
    height: 60px;
    border-width: 4px;
  `}
`;

export const LoaderText = styled.div`
  font-size: ${props => props.theme.fontSize.lg};
  font-weight: 500;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
`;

// Dimmer Component
export const Dimmer = styled.div`
  position: relative;
  
  ${props => props.$active && `
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      z-index: 1;
      border-radius: inherit;
    }
  `}
`;

export const DimmerLoaderContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  background: transparent;
  padding: ${props => props.theme.spacing.lg};
`;

// Rating Component
export const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin: ${props => props.theme.spacing.md} 0;
`;

export const RatingStar = styled.span`
  font-size: ${props => props.theme.fontSize.xl};
  color: ${props => props.theme.colors.gray300};
  cursor: pointer;
  transition: color ${props => props.theme.transitions.fast};
  
  ${props => (props.active || props.hover) && `
    color: #ffc107;
  `}
  
  ${props => props.hover && `
    ~ & {
      color: ${props => props.theme.colors.gray300};
    }
  `}
`;

// Message Components
export const Message = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.radius.md};
  margin-bottom: ${props => props.theme.spacing.md};
  border: 1px solid transparent;
  
  ${props => props.$error && `
    background: rgba(220, 53, 69, 0.1);
    border-color: rgba(220, 53, 69, 0.3);
    color: ${props => props.theme.colors.danger};
  `}
  
  ${props => props.$success && `
    background: rgba(40, 167, 69, 0.1);
    border-color: rgba(40, 167, 69, 0.3);
    color: ${props => props.theme.colors.success};
  `}
  
  ${props => props.$info && `
    background: rgba(23, 162, 184, 0.1);
    border-color: rgba(23, 162, 184, 0.3);
    color: ${props => props.theme.colors.info};
  `}
  
  ${props => props.$warning && `
    background: rgba(255, 193, 7, 0.1);
    border-color: rgba(255, 193, 7, 0.3);
    color: #856404;
  `}
`;

export const MessageHeader = styled.div`
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

// Utility Classes
export const Flex = styled.div`
  display: flex;
  
  ${props => props.center && `
    align-items: center;
    justify-content: center;
  `}
  
  ${props => props.hcenter && `
    justify-content: center;
  `}
  
  ${props => props.vcenter && `
    align-items: center;
  `}
  
  ${props => props.column && `
    flex-direction: column;
  `}
`;

export const FullWidth = styled.div`
  width: 100%;
`;

export const TextCenter = styled.div`
  text-align: center;
`;

export const TextLeft = styled.div`
  text-align: left;
`;

export const TextRight = styled.div`
  text-align: right;
`;

export const TextPrimary = styled.div`
  color: ${props => props.theme.colors.textPrimary};
`;

export const TextSecondary = styled.div`
  color: ${props => props.theme.colors.textSecondary};
`;

export const TextMuted = styled.div`
  color: ${props => props.theme.colors.textMuted};
`;

export const TextLight = styled.div`
  color: ${props => props.theme.colors.textLight};
`;

export const TextOpaque = styled.div`
  color: ${props => props.theme.colors.textOpaque};
`;

export const Mb0 = styled.div`
  margin-bottom: 0;
`;

export const Mb1 = styled.div`
  margin-bottom: ${props => props.theme.spacing.xs};
`;

export const Mb2 = styled.div`
  margin-bottom: ${props => props.theme.spacing.sm};
`;

export const Mb3 = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

export const Mb4 = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

export const Mb5 = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

export const Mt0 = styled.div`
  margin-top: 0;
`;

export const Mt1 = styled.div`
  margin-top: ${props => props.theme.spacing.xs};
`;

export const Mt2 = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
`;

export const Mt3 = styled.div`
  margin-top: ${props => props.theme.spacing.md};
`;

export const Mt4 = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
`;

export const Mt5 = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
`;

export const P0 = styled.div`
  padding: 0;
`;

export const P1 = styled.div`
  padding: ${props => props.theme.spacing.xs};
`;

export const P2 = styled.div`
  padding: ${props => props.theme.spacing.sm};
`;

export const P3 = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

export const P4 = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

export const P5 = styled.div`
  padding: ${props => props.theme.spacing.xl};
`;

// Animations
export const FadeIn = styled.div`
  ${css`
    animation: ${fadeIn} 0.5s ease-in;
  `}
`;

export const FadeInUp = styled.div`
  ${css`
    animation: ${fadeInUp} 0.5s ease-out;
  `}
`;

export const FadeInLeft = styled.div`
  ${css`
    animation: ${fadeInLeft} 0.5s ease-out;
  `}
`;

// Widget-specific styles for embedding
export const ChatWidgetEmbed = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  height: 600px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  z-index: ${props => props.theme.zIndex.modal};
  font-family: ${props => props.theme.fontFamily};
  box-shadow: ${props => props.theme.shadows.xl};
  border-radius: ${props => props.theme.radius.lg};
  overflow: hidden;
  background: ${props => props.theme.colors.white};
  
  @media (max-width: 480px) {
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
`;