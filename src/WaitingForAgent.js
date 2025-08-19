import { 
  Loader, 
  Button,
  TextCenter
} from './components/styled/DesignSystem';

const WaitingForAgent = ({ pendingChatsCount = 0, onCancel }) => {
  return (
    <div style={{ 
      padding: '40px 20px', 
      textAlign: 'center',
      background: 'white',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Loader style={{ marginBottom: '24px' }} />
      
      <h3 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '18px', 
        fontWeight: '500',
        color: '#333'
      }}>
        Waiting for agent response
      </h3>
      
      <p style={{ 
        margin: '0 0 24px 0', 
        fontSize: '14px', 
        color: '#666',
        lineHeight: '1.4'
      }}>
        {pendingChatsCount > 1 
          ? `Connecting to ${pendingChatsCount} available agents...`
          : 'Connecting to available agent...'
        }
        <br />
        You'll be connected to the first agent who responds
      </p>
      
      {onCancel && (
        <Button 
          onClick={onCancel}
          style={{
            marginTop: '16px',
            padding: '8px 24px',
            fontSize: '14px',
            backgroundColor: '#e91e63',
            color: 'white',
            border: 'none'
          }}
        >
          Cancel
        </Button>
      )}
    </div>
  );
};

export default WaitingForAgent;