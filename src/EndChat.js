import React from 'react'
import { useMutation } from 'react-apollo-hooks'
import { END_CHAT, GET_CHAT } from './queries'
import { Segment, Button } from 'semantic-ui-react'
import store from 'store2'

const EndChat = ({chatId}) => {
  // TODO: create message with content "user ended chat"
  console.log(chatId)
  const endChat = useMutation(END_CHAT, {
    variables: { chatId },
    refetchQueries: [
      { query: GET_CHAT, variables: { chatId } },
    ]
  })

  return(
    <Segment inverted color='teal'>
      <Button color="red" onClick={() => {
        endChat().then(resp => store.remove('activeChat'))
      }}>End Chat</Button>
    </Segment>
  )
}

export default EndChat
