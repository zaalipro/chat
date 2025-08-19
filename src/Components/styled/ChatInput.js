import styled from 'styled-components';

export const ChatInput = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
`;

export const ChatInputShadow = styled.div`
  box-shadow: 0px -3px 48px -1px rgba(0,0,0,0.10);
  background: #fff;
`;

export const InputField = styled.textarea`
  width: calc(100% - 52px);
  height: auto;
  border: 0px;
  padding: 20px 0px 20px 30px;
  resize: none;
  font-size: 15px;
  font-family: var(--font-family, "Helvetica Neue", Helvetica, Arial, sans-serif);
  font-weight: 400;
  line-height: 1.33;
  color: #565867;
  
  ${props => props.$minRows && `
    min-height: ${props.$minRows * 20}px;
  `}
  
  ${props => props.$maxRows && `
    max-height: ${props.$maxRows * 20}px;
  `}
`;

export const LightBackground = styled.div`
  background-color: rgba(240,243,245,1);
`;