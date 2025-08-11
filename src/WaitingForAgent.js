import React from 'react';
import { Dimmer, Loader, Button, Segment } from 'semantic-ui-react';

const WaitingForAgent = ({ pendingChatsCount = 0, onCancel }) => {
  return (
    <Segment padded>
      <Dimmer active>
        <Loader size="large">Waiting for agent response</Loader>
      </Dimmer>
      
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            fontSize: '16px', 
            color: '#666',
            marginBottom: '10px'
          }}>
            {pendingChatsCount > 1 
              ? `Connecting to ${pendingChatsCount} available agents...`
              : 'Connecting to available agent...'
            }
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: '#999'
          }}>
            You'll be connected to the first agent who responds
          </p>
        </div>
        
        {onCancel && (
          <Button 
            basic 
            color="grey" 
            onClick={onCancel}
            style={{ marginTop: '20px' }}
          >
            Cancel
          </Button>
        )}
      </div>
    </Segment>
  );
};

export default WaitingForAgent;