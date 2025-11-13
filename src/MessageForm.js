import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import MessageBox from './MessageBox';
import { sanitizeMessageEnhanced } from './utils/sanitize';
import { useMutation } from '@apollo/client';
import { CREATE_MESSAGE } from './queries';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const InputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  position: relative;
`;

const Input = styled(MessageBox)`
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  resize: none;
  padding: 0.75rem;
  border: 2px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.danger : theme.colors.border};
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s ease;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.danger : theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme, hasError }) => 
      hasError ? `${theme.colors.danger}20` : `${theme.colors.primary}20`};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const SendButton = styled.button`
  padding: 0.75rem 1.25rem;
  background: ${({ theme, disabled }) => 
    disabled ? theme.colors.background : theme.colors.primary};
  color: ${({ theme, disabled }) => 
    disabled ? theme.colors.textMuted : theme.colors.white};
  border: 2px solid ${({ theme, disabled }) => 
    disabled ? theme.colors.border : theme.colors.primary};
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  min-width: 80px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryDark};
    border-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => `${theme.colors.primary}30`};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px ${({ theme }) => `${theme.colors.primary}20`};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.85rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: ${({ theme }) => `${theme.colors.danger}10`};
  border: 1px solid ${({ theme }) => `${theme.colors.danger}30`};
  border-radius: 4px;
  line-height: 1.4;
`;

const MessageForm = ({ chatId, onMessageSent, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const [sendMessage] = useMutation(CREATE_MESSAGE, {
    onCompleted: (data) => {
      if (data?.createMessage?.message) {
        setMessage('');
        setError('');
        onMessageSent && onMessageSent(data.createMessage.message);
      } else {
        setError('Failed to send message. Please try again.');
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Send message error:', error);
      setError(error.message || 'Failed to send message. Please try again.');
      setIsSubmitting(false);
    }
  });

  // Get user ID for rate limiting
  const getUserId = useCallback(() => {
    // Try to get user ID from various sources
    return (
      localStorage.getItem('userId') ||
      sessionStorage.getItem('userId') ||
      'anonymous_' + Math.random().toString(36).substr(2, 9)
    );
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (disabled || isSubmitting || !message.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const userId = getUserId();
      
      // Background validation and sanitization
      const result = await sanitizeMessageEnhanced(message, userId);
      const sanitizedMessage = result.sanitizedInput || result;

      if (!sanitizedMessage.trim()) {
        setError('Message contains only disallowed content');
        setIsSubmitting(false);
        return;
      }

      // Send the message using the correct GraphQL mutation variables
      await sendMessage({
        variables: {
          text: sanitizedMessage,
          author: localStorage.getItem('customerName') || 'Anonymous',
          chatId: chatId
        }
      });

    } catch (error) {
      console.error('Message submission error:', error);
      
      // Handle different error types with user-friendly messages
      if (error.message.includes('Rate limit')) {
        setError('Please wait before sending another message.');
      } else if (error.message.includes('Security threat') || error.message.includes('prohibited content')) {
        setError('Message contains content that cannot be sent for security reasons.');
      } else if (error.message.includes('too large') || error.message.includes('maximum')) {
        setError('Message is too long. Please shorten it and try again.');
      } else if (error.message.includes('Input cannot be empty')) {
        setError('Message cannot be empty.');
      } else {
        setError('Failed to send message. Please try again.');
      }
      
      setIsSubmitting(false);
    }
  }, [message, chatId, disabled, isSubmitting, sendMessage, getUserId]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    
    // Check length limit
    if (value.length > 5000) {
      setError('Message is too long (maximum 5000 characters)');
      return;
    }
    
    setMessage(value);
    setError('');
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const isFormDisabled = disabled || isSubmitting;
  const hasError = !!error;
  const isOverLimit = message.length > 5000;

  return (
    <Form onSubmit={handleSubmit}>
      <InputContainer>
        <Input
          ref={inputRef}
          as="textarea"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isFormDisabled}
          hasError={hasError}
          rows={1}
          style={{
            minHeight: '44px',
            maxHeight: '120px',
            resize: 'none'
          }}
        />
        
        <SendButton
          type="submit"
          disabled={isFormDisabled || !message.trim() || isOverLimit}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              Sending...
            </>
          ) : (
            'Send'
          )}
        </SendButton>
      </InputContainer>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}
    </Form>
  );
};

export default MessageForm;
