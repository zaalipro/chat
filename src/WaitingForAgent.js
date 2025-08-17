import React from 'react';

const WaitingForAgent = ({ pendingChatsCount = 0, onCancel }) => {
  return (
    <div className="segment padded dimmer active">
      <div className="loader-container">
        <div className="loader large"></div>
        <div className="loader-text">Waiting for agent response</div>
      </div>
      
      <div className="text-center p-5" style={{ minHeight: '200px' }}>
        <div className="mb-4">
          <p className="text-secondary mb-2" style={{ fontSize: '16px' }}>
            {pendingChatsCount > 1 
              ? `Connecting to ${pendingChatsCount} available agents...`
              : 'Connecting to available agent...'
            }
          </p>
          <p className="text-muted" style={{ fontSize: '14px' }}>
            You'll be connected to the first agent who responds
          </p>
        </div>
        
        {onCancel && (
          <button 
            className="btn btn-basic mt-4"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default WaitingForAgent;