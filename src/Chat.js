import React, { Component } from 'react'
import { Container, Segment } from 'semantic-ui-react'
import MessageBox from './MessageBox'
import MessageForm from './MessageForm'
import EndChat from './EndChat'

class Chat extends Component {
  componentDidMount() {
    this.props.subscribeToNewMessages()
  }

  render() {
    const { data, chatId } = this.props

    return (
      <Container>
        <MessageBox messages={data.allMessages}/>
        <hr />
        <Segment.Group horizontal>
          <Segment inverted color='teal'>
            <MessageForm chatId={chatId} />
          </Segment>
          <EndChat chatId={chatId} />
        </Segment.Group>
      </Container>
    );
  }
}

export default Chat
