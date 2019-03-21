import React from 'react'
import { Segment, Message } from 'semantic-ui-react'

let MessageBox = ({messages}) => {
  return (
    <Segment>
      { messages && messages.map((message, i) =>
        <Message key={'msg' + +i} floating content={message.text} header={message.author} color={message.isAgent ? 'blue' : 'grey'}/>
      )}
    </Segment>
  );
}

export default MessageBox
