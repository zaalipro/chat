import React from 'react';
import { Message, MessageHeader, Button } from '../components/styled/DesignSystem';

const ErrorState = ({ message, onRetry }) => {
  return (
    <Message $error>
      <MessageHeader>Error</MessageHeader>
      <p>{message}</p>
      {onRetry && (
        <Button $primary $small onClick={onRetry}>
          Retry
        </Button>
      )}
    </Message>
  );
};

export default ErrorState;
