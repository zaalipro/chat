import React from 'react'
import Query from './Components/Query'
import { GET_MESSAGES, MESSAGE_SUBSCRIPTION } from './queries'
import store from 'store2'
import Chat from './Chat'

const ChatContainer = () => {
  const chat = store('activeChat')

  return(
    <Query query={GET_MESSAGES} variables={{ chatId: chat.id }}>
      {({ subscribeToMore, ...rest}) => {
        return (
          <Chat
            {...rest}
            chatId={chat.id}
            subscribeToNewMessages={() =>
              subscribeToMore({
                document: MESSAGE_SUBSCRIPTION,
                variables: { chatId: chat.id },
                updateQuery: (prev, { subscriptionData }) => {
                  console.log('subscribeToNewMessages', prev, subscriptionData)
                  if (!subscriptionData.data.Message) return prev;
                  return Object.assign({}, prev, {
                    allMessages: [...prev.allMessages, subscriptionData.data.Message.node]
                  });
                }
              })
            }
          />
        )
      }}
    </Query>
  )
}

export default ChatContainer
