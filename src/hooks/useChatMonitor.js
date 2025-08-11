import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_MESSAGE } from '../queries';
import { createActiveChat, resetChatState } from '../utils/chatUtils';
import store from 'store2';

export const useChatMonitor = () => {
  const [callCount, setCallCount] = useState(0);
  const [msgsCreated, setMsgsCreated] = useState(new Set());
  const msgsRef = useRef(new Set());
  const [createMessage] = useMutation(CREATE_MESSAGE);

  const handleStarted = useCallback(async (chat, pending, onComplete) => {
    try {
      setCallCount(prev => prev + 1);
      console.log('=== CHAT STARTED ===');
      console.log('Call:', callCount + 1);
      console.log('Chat:', chat);
      console.log('Created msgs:', msgsCreated);

      // Set active chat
      const active = createActiveChat(chat);
      store("activeChat", active);

      // Verify storage
      const stored = store("activeChat");
      if (!stored?.id) {
        throw new Error('Failed to store active chat');
      }

      // Find full chat data
      const full = pending.find(p => p.id === chat.id);
      
      if (full) {
        console.log(`Connected via contract ${full.contract.id}`);

        // Create message if not already created
        if (!msgsRef.current.has(chat.id)) {
          console.log('Creating message for:', chat.id);
          
          // Mark immediately to prevent race
          msgsRef.current.add(chat.id);
          setMsgsCreated(new Set(msgsRef.current));
          
          try {
            await createMessage({
              variables: {
                text: chat.headline,
                author: chat.customerName,
                isAgent: false,
                chatId: chat.id
              }
            });
            console.log('Message created for:', chat.id);
          } catch (msgError) {
            console.error('Message creation failed:', msgError);
            // Rollback on failure
            msgsRef.current.delete(chat.id);
            setMsgsCreated(new Set(msgsRef.current));
          }
        } else {
          console.log('Message already created for:', chat.id);
        }
      } else {
        console.log('No matching pending chat for:', chat.id);
      }

      // Complete the flow
      if (onComplete) {
        onComplete();
      }

      console.log('=== END CHAT STARTED ===');
    } catch (error) {
      console.error('Error in handleStarted:', error);
      throw error;
    }
  }, [callCount, msgsCreated, createMessage]);

  const handleMissed = useCallback((chatId, contractId) => {
    console.log(`Chat ${chatId} missed for contract ${contractId}`);
  }, []);

  const handleError = useCallback((error, chatId) => {
    console.error(`Monitor error for chat ${chatId}:`, error);
  }, []);

  const reset = useCallback(() => {
    resetChatState(setMsgsCreated, msgsRef);
    setCallCount(0);
  }, []);

  return {
    handleStarted,
    handleMissed,
    handleError,
    reset,
    callCount,
    msgsCreated
  };
};