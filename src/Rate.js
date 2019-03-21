import React from 'react';
import { Segment, Button, Rating } from 'semantic-ui-react'
import { Mutation } from 'react-apollo'
import { RATE_AGENT } from './queries'

const Rate = ({chat, setCreate}) => {
  return(
    <Mutation mutation={RATE_AGENT}>
    {(createRate) => (
      <Segment>
        chat finished, start <Button size="small" onClick={() => setCreate(true)}>new chat</Button>
        Please rate an agent:
        <Rating icon='star' defaultRating={5} maxRating={10} onRate={(e, {rating}) => {
          console.log(chat)
          createRate({variables: {
            chatId: chat.id,
            rating: rating
          }})
          setCreate(true)
        }}/>
      </Segment>
    )}
    </Mutation>
  )
}

export default Rate
