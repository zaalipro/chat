import React, { useState, useEffect } from 'react'
import Query from './Components/Query'
import { useMutation, useSubscription } from '@apollo/client'
import { GET_MESSAGES, MESSAGE_SUBSCRIPTION, END_CHAT, GET_CHAT, CHAT_STATUS_SUBSCRIPTION } from './queries'
import store from 'store2'
import Chat from './Chat'
import ChatHeader from './ChatHeader'
import EndedChat from './EndedChat'
import ErrorBoundary from './ErrorBoundary'
import { CHAT_STATUS, STORAGE_KEYS, ERROR_MESSAGES, BUTTON_LABELS } from './constants'

const ChatContainer = () => {
  const chat = store(STORAGE_KEYS.ACTIVE_CHAT)
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
    if (chatStatusData?.chat?.status === CHAT_STATUS.ENDED) {
      setChatEnded(true)
    }
  }, [chatStatusData])
  
  // Handle case where chat is missing - AFTER all hooks are called
  if (!chat?.id) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Chat Error</h3>
        <p>{ERROR_MESSAGES.CHAT_ERROR}</p>
        <button
          onClick={() => {
            store.remove(STORAGE_KEYS.ACTIVE_CHAT)
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
          {BUTTON_LABELS.START_NEW_CHAT}
        </button>
      </div>
    )
  }

  if (chatEnded) {
    return <EndedChat />
  }

  return (
    <ErrorBoundary
      fallback={(error, errorInfo) => (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Error Loading Messages</h3>
          <p>We're sorry, but there was an error loading the chat messages.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      )}
    >
      <Query query={GET_MESSAGES} variables={{ chatId: chat.id }}>
        {({ subscribeToMore, ...rest }) => {
          return (
            <span>
              <ErrorBoundary
                fallback={(error, errorInfo) => (
                  <div style={{ padding: '10px', color: 'red' }}>
                    Error loading chat header. <button onClick={() => window.location.reload()}>Reload</button>
                  </div>
                )}
              >
                <ChatHeader endChat={endChat} />
              </ErrorBoundary>
              
              <ErrorBoundary
                fallback={(error, errorInfo) => (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Error in Chat</h3>
                    <p>We're sorry, but there was an error displaying the chat.</p>
                    <button
                      onClick={() => window.location.reload()}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Reload
                    </button>
                  </div>
                )}
              >
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
              </ErrorBoundary>
            </span>
          )
        }}
      </Query>
    </ErrorBoundary>
  )
}

export default ChatContainer
