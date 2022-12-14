import React from 'react'
import Query from './Components/Query'
import { useMutation } from '@apollo/client'
import { GET_MESSAGES, MESSAGE_SUBSCRIPTION, END_CHAT, GET_CHAT } from './queries'
import store from 'store2'
import Chat from './Chat'
import ChatHeader from './ChatHeader'

const ChatContainer = () => {
  const chat = store('activeChat')
  const endChat = useMutation(END_CHAT, {
    variables: { chatId: chat.id },
    refetchQueries: [
      { query: GET_CHAT, variables: { chatId: chat.id } },
    ]
  })

  return(
    <Query query={GET_MESSAGES} variables={{ chatId: chat.id }}>
      {({ subscribeToMore, ...rest}) => {
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
