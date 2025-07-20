import React from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 * @param {React.Component} Component - The component to wrap
 * @param {Object} options - Options for the ErrorBoundary
 * @param {Function} options.fallback - Custom fallback UI
 * @returns {React.Component} - The wrapped component
 */
const withErrorBoundary = (Component, options = {}) => {
  const WithErrorBoundary = (props) => {
    return (
      <ErrorBoundary fallback={options.fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
};

export default withErrorBoundary;