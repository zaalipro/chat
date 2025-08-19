import styled, { keyframes } from 'styled-components';

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const fadeInUp = keyframes`
  0% {
    -webkit-transform: translateY(15px);
    transform: translateY(15px);
    opacity: 0;
  }
  100% {
    -webkit-transform: translateY(0);
    transform: translateY(0);
    opacity: 1;
  }
`;

export const fadeInLeft = keyframes`
  0% {
    -webkit-transform: translateX(15px);
    transform: translateX(15px);
    opacity: 0;
  }
  100% {
    -webkit-transform: translateX(0);
    transform: translateX(0);
    opacity: 1;
  }
`;

export const rotate = keyframes`
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(90deg);
  }
`;

export const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled components that use the keyframes
export const FadeIn = styled.div`
  animation: ${fadeIn} 0.5s ease-in;
`;

export const FadeInUp = styled.div`
  animation: ${fadeInUp} 0.4s ease 0s 1 normal;
  -webkit-transform: translateZ(0);
`;

export const FadeInLeft = styled.div`
  animation: ${fadeInLeft} 0.4s ease 0s 1 normal;
  -webkit-transform: translateZ(0);
`;

export const Rotate = styled.div`
  animation: ${rotate} 0.4s ease 0s 1 normal;
`;