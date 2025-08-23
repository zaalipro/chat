import { useState, useEffect } from 'react'
import Query from './Components/Query'
import { useMutation, useSubscription, useQuery } from '@apollo/client'
import { GET_MESSAGES, MESSAGE_SUBSCRIPTION, END_CHAT, GET_CHAT, CHAT_STATUS_SUBSCRIPTION } from './queries'
import { CHAT_STATUS, getDisplayStatus } from './constants/chatStatus'
import Chat from './Chat'
import ChatHeader from './ChatHeader'
import EndedChat from './EndedChat'

const ChatContainer = ({ chat, website }) => {
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

  // Subscribe to chat status changes
  const { data: chatStatusData } = useSubscription(CHAT_STATUS_SUBSCRIPTION, {
    variables: { chatId: chat.id }
  })

  useEffect(() => {
    if (chatStatusData?.chat?.status === CHAT_STATUS.FINISHED) {
      setChatEnded(true)
    }
  }, [chatStatusData])

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
              color={website?.color}
            />
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
