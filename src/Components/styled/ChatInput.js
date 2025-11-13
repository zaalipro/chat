import styled from 'styled-components';

export const ChatInput = styled.div`
  position: relative;
  width: 100%;
`;

export const ChatInputShadow = styled.div`
  box-shadow: 0px -3px 48px -1px rgba(0,0,0,0.10);
  background: #fff;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

export const InputField = styled.textarea`
  width: 100%;
  height: auto;
  border: 0px;
  padding: 20px 0px 20px 30px;
  resize: none;
  font-size: 15px;
  font-family: var(--font-family, "Helvetica Neue", Helvetica, Arial, sans-serif);
  font-weight: 400;
  line-height: 1.33;
  color: #565867;
  flex-grow: 1;
  outline: none;
  transition: border-color 0.2s ease;
  
  ${props => props.$minRows && `
    min-height: ${props.$minRows * 20}px;
  `}
  
  ${props => props.$maxRows && `
    max-height: ${props.$maxRows * 20}px;
  `}
  
  ${props => props.$hasError && `
    color: #dc3545;
    background-color: #fff5f5;
  `}
  
  ${props => props.disabled && `
    opacity: 0.6;
    cursor: not-allowed;
  `}
  
  &:focus {
    background-color: #fafafa;
  }
  
  &:focus${props => props.$hasError && `
    background-color: #fff5f5;
  `}
`;

export const SubmitButton = styled.button`
  background-color: ${props => props.$isLoading ? '#cccccc' : '#00BCD4'};
  color: white;
  border: none;
  border-radius: 9px;
  padding: 25px 20px;
  margin-right: 10px;
  cursor: ${props => props.$isLoading || props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 15px;
  transition: all 0.2s ease;
  min-width: 80px;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.$isLoading ? '#cccccc' : '#00acc1'};
  }
  
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  
  ${props => props.$isLoading && `
    display: flex;
    align-items: center;
    justify-content: center;
  `}
`;

export const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
  text-align: center;
  padding: 0.25rem 1rem;
  background-color: #fff5f5;
  border-radius: 4px;
  animation: slideIn 0.2s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const LoadingSpinner = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const LightBackground = styled.div`
  background-color: rgba(240,243,245,1);
`;

export const CharacterCount = styled.div`
  font-size: 0.7rem;
  color: ${props => props.$nearLimit ? '#ff9800' : '#999'};
  margin-right: 10px;
  margin-bottom: 0.25rem;
  align-self: flex-end;
  transition: color 0.2s ease;
`;
