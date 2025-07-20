import React, { useState, useEffect } from 'react'
import Query from './Components/Query'
import { useMutation, useSubscription } from '@apollo/client'
import { GET_MESSAGES, MESSAGE_SUBSCRIPTION, END_CHAT, GET_CHAT, CHAT_STATUS_SUBSCRIPTION } from './queries'
import store from 'store2'
import Chat from './Chat'
import ChatHeader from './ChatHeader'
import EndedChat from './EndedChat'

const ChatContainer = () => {
  const chat = store('activeChat')
  const [chatEnded, setChatEnded] = useState(false)
  
  // Always declare hooks at the top level, regardless of conditions
  const [endChat] = useMutation(END_CHAT, {
    variables: { chatId: chat?.id || '' },
    refetchQueries: [
      { query: GET_CHAT, variables: { chatId: chat?.id || '' } },
    ],
    skip: !chat?.id // Skip the mutation if chat.id is not available
  })

  // Subscribe to chat status changes
  const { data: chatStatusData } = useSubscription(CHAT_STATUS_SUBSCRIPTION, {
    variables: { chatId: chat?.id || '' },
    skip: !chat?.id // Skip the subscription if chat.id is not available
  })

  useEffect(() => {
    if (chatStatusData?.chat?.status === 'ended') {
      setChatEnded(true)
    }
  }, [chatStatusData])
  
  // Handle case where chat is missing - AFTER all hooks are called
  if (!chat?.id) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Chat Error</h3>
        <p>Unable to load chat information. Please try again.</p>
        <button
          onClick={() => {
            store.remove('activeChat')
            window.location.reload()
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Start New Chat
        </button>
      </div>
    )
  }

  if (chatEnded) {
    return <EndedChat />
  }

  return (
    <Query query={GET_MESSAGES} variables={{ chatId: chat.id }}>
      {({ subscribeToMore, ...rest }) => {
        return (
          <span>
            <ChatHeader endChat={endChat} />
            <Chat
              {...rest}
              chatId={chat.id}
              subscribeToNewMessages={() =>
                subscribeToMore({
                  document: MESSAGE_SUBSCRIPTION,
                  variables: { chatId: chat.id },
                  updateQuery: (_, { subscriptionData }) => {
                    return subscriptionData.data
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
