import { useState, useCallback } from 'react';
import { ERROR_MESSAGES } from '../config/ChatConfig';

export const useError = () => {
  const [error, setError] = useState(null);
  
  const handleError = useCallback((err, type = 'UNEXPECTED') => {
    console.error(`Error (${type}):`, err);
    
    let message = ERROR_MESSAGES[type] || ERROR_MESSAGES.UNEXPECTED;
    
    // Handle specific error types
    if (err?.networkError) {
      message = ERROR_MESSAGES.CONNECTION_ERROR;
    } else if (err?.graphQLErrors?.some(e => 
      e.message.includes('auth') || e.message.includes('unauthorized')
    )) {
      message = ERROR_MESSAGES.AUTH_ERROR;
    }
    
    setError(message);
  }, []);
  
  const clearError = useCallback(() => setError(null), []);
  
  return { error, handleError, clearError };
};