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
  const [endChat] = useMutation(END_CHAT, {
    variables: { chatId: chat.id },
    refetchQueries: [
      { query: GET_CHAT, variables: { chatId: chat.id } },
    ]
  })

  // Subscribe to chat status changes
  const { data: chatStatusData } = useSubscription(CHAT_STATUS_SUBSCRIPTION, {
    variables: { chatId: chat.id }
  })

  useEffect(() => {
    if (chatStatusData?.chat?.status === 'ended') {
      setChatEnded(true)
    }
  }, [chatStatusData])

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
                  updateQuery: (prev, { subscriptionData }) => {
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
