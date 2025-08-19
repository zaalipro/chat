import React from 'react';

const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="error-state">
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
};

export default ErrorState;
