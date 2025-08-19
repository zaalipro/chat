import { useEffect, useRef, useCallback, useState } from 'react';
import { useSubscription, useMutation } from '@apollo/client';
import { CHAT_STATUS_SUBSCRIPTION, UPDATE_CHAT_MISSED } from './queries';
import { createChatTimeouts, clearChatTimeouts, clearChatTimeout } from './utils';

const ChatStatusMonitor = ({ 
  pendingChats = [], 
  onChatStarted, 
  onChatMissed,
  onError 
}) => {
  const timeoutsRef = useRef({});
  const [updateChatMissed] = useMutation(UPDATE_CHAT_MISSED);

  // Handle chat missed timeout
  const handleChatMissed = useCallback(async (chatId, contractId) => {
    try {
      console.log(`Marking chat ${chatId} as missed`);
      
      // Call the mutation to mark chat as missed
      await updateChatMissed({
        variables: { chatId }
      });
      
      // Notify parent component
      if (onChatMissed) {
        onChatMissed(chatId, contractId);
      }
      
      // Clear the timeout for this chat
      clearChatTimeout(timeoutsRef.current, chatId);
      
    } catch (error) {
      console.error(`Failed to mark chat ${chatId} as missed:`, error);
      if (onError) {
        onError(error, chatId);
      }
    }
  }, [updateChatMissed, onChatMissed, onError]);

  // Set up timeouts for chat miss handling
  useEffect(() => {
    if (pendingChats.length > 0) {
      // Clear existing timeouts
      clearChatTimeouts(timeoutsRef.current);
      
      // Create new timeouts
      timeoutsRef.current = createChatTimeouts(pendingChats, handleChatMissed);
      
      console.log(`Set up timeouts for ${pendingChats.length} chats`);
    }

    // Cleanup function
    return () => {
      clearChatTimeouts(timeoutsRef.current);
      timeoutsRef.current = {};
    };
  }, [pendingChats, handleChatMissed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearChatTimeouts(timeoutsRef.current);
    };
  }, []);

  return (
    <>
      {pendingChats.map(chat => (
        <ChatSubscription
          key={chat.id}
          chatId={chat.id}
          onChatStarted={(chatData) => {
            // Clear timeout for this chat since it's now started
            clearChatTimeout(timeoutsRef.current, chat.id);
            
            // Clear all timeouts since we found an active chat
            clearChatTimeouts(timeoutsRef.current);
            
            // Notify parent component
            if (onChatStarted) {
              onChatStarted(chatData);
            }
          }}
          onError={onError}
        />
      ))}
    </>
  );
};

// Individual chat subscription component
const ChatSubscription = ({ chatId, onChatStarted, onError }) => {
  const [hasNotifiedStarted, setHasNotifiedStarted] = useState(false);
  
  const handleChatStarted = useCallback((chatData) => {
    if (!hasNotifiedStarted && chatData && chatData.status === 'started') {
      console.log(`Chat ${chatId} status changed to started - notifying parent`);
      setHasNotifiedStarted(true);
      onChatStarted(chatData);
    } else if (hasNotifiedStarted) {
      console.log(`Chat ${chatId} already notified as started, skipping duplicate notification`);
    }
  }, [chatId, onChatStarted, hasNotifiedStarted]);

  const { data, error } = useSubscription(CHAT_STATUS_SUBSCRIPTION, {
    variables: { chatId },
    onSubscriptionData: ({ subscriptionData }) => {
      const chatData = subscriptionData?.data?.chat;
      handleChatStarted(chatData);
    },
    onSubscriptionComplete: () => {
      console.log(`Subscription completed for chat ${chatId}`);
    },
    shouldResubscribe: true // Automatically resubscribe on connection loss
  });

  useEffect(() => {
    if (error) {
      console.error(`Subscription error for chat ${chatId}:`, error);
      if (onError) {
        onError(error, chatId);
      }
    }
  }, [error, chatId, onError]);

  // Check initial data in case chat is already started
  useEffect(() => {
    if (data?.chat) {
      handleChatStarted(data.chat);
    }
  }, [data, handleChatStarted]);

  // This component doesn't render anything visible
  return null;
};

export default ChatStatusMonitor;