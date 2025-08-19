import React from 'react';
import { 
  Segment, 
  LoaderContainer, 
  Loader, 
  LoaderText, 
  TextSecondary, 
  TextMuted, 
  Mb4, 
  Mb2, 
  Mt4, 
  P5, 
  TextCenter,
  Button
} from './components/styled/DesignSystem';
import { Dimmer, DimmerLoaderContainer } from './components/styled/DesignSystem';

const WaitingForAgent = ({ pendingChatsCount = 0, onCancel }) => {
  return (
    <Segment $padded $active>
      <DimmerLoaderContainer>
        <LoaderContainer>
          <Loader large />
          <LoaderText>Waiting for agent response</LoaderText>
        </LoaderContainer>
      </DimmerLoaderContainer>
      
      <TextCenter>
        <div className="p-5" style={{ minHeight: '200px' }}>
          <Mb4>
            <TextSecondary className="mb-2" style={{ fontSize: '16px' }}>
              {pendingChatsCount > 1 
                ? `Connecting to ${pendingChatsCount} available agents...`
                : 'Connecting to available agent...'
              }
            </TextSecondary>
            <TextMuted style={{ fontSize: '14px' }}>
              You'll be connected to the first agent who responds
            </TextMuted>
          </Mb4>
          
          {onCancel && (
            <Button 
              $basic
              className="mt-4"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </TextCenter>
    </Segment>
  );
};

export default WaitingForAgent;