import { useState, useEffect } from 'react'
import Query from './Components/Query'
import { useMutation, useSubscription, useQuery } from '@apollo/client'
import { GET_MESSAGES, MESSAGE_SUBSCRIPTION, END_CHAT, GET_CHAT, CHAT_STATUS_SUBSCRIPTION } from './queries'
import { CHAT_STATUS, getDisplayStatus } from './constants/chatStatus'
import Chat from './Chat'
import ChatHeader from './ChatHeader'
import EndedChat from './EndedChat'

import { useWebsite } from './context/WebsiteContext';

const ChatContainer = ({ chat }) => {
  const { website } = useWebsite();
  const [chatEnded, setChatEnded] = useState(false)
  const [endChat] = useMutation(END_CHAT, {
    variables: { chatId: chat.id },
    refetchQueries: [
      { query: GET_CHAT, variables: { chatId: chat.id } },
    ]
  })

  // Get chat details including company name
  const { data: chatData } = useQuery(GET_CHAT, {
    variables: { chatId: chat.id }
  })

  // Subscribe to chat status changes with proper cleanup
  const { data: chatStatusData, unsubscribe: unsubscribeChatStatus } = useSubscription(CHAT_STATUS_SUBSCRIPTION, {
    variables: { contractId: chat.contractId },
    shouldResubscribe: true,
    onError: (error) => {
      console.error('Chat status subscription error:', error);
    }
  })

  useEffect(() => {
    if (chatStatusData?.chatChanged?.record?.status === CHAT_STATUS.FINISHED) {
      setChatEnded(true)
    }
  }, [chatStatusData])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeChatStatus) {
        unsubscribeChatStatus();
      }
    };
  }, [unsubscribeChatStatus])

  if (chatEnded) {
    return <EndedChat />
  }

  // Extract company name and status from chat data
  const companyName = chatData?.chat?.companyName || "Company Name"
  const status = chatData?.chat?.status 
    ? getDisplayStatus(chatData.chat.status)
    : "Started"

  return (
    <Query query={GET_MESSAGES} variables={{ chatId: chat.id }}>
      {({ subscribeToMore, ...rest }) => {
        return (
          <span>
            <ChatHeader 
              endChat={endChat} 
              companyName={companyName}
              status={status}
            />
            <Chat
              {...rest}
              chatId={chat.id}
              subscribeToNewMessages={() =>
                subscribeToMore({
                  document: MESSAGE_SUBSCRIPTION,
                  variables: { chatId: chat.id },
                  updateQuery: (prev, { subscriptionData }) => {
                    if (!subscriptionData.data) return prev;
                    
                    const newMessage = subscriptionData.data.onMessageAdded.record;
                    return {
                      messages: [...prev.messages, newMessage]
                    };
                  },
                  onError: (error) => {
                    console.error('Message subscription error:', error);
                  }
                })
              }
            />
          </span>
        )
      }}
    </Query>
  )
}

export default ChatContainer
