import React, { Component } from 'react'
import { Container, Segment } from 'semantic-ui-react'
import MessageBox from './MessageBox'
import MessageForm from './MessageForm'

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
        <Segment inverted color='teal'>
          <MessageForm chatId={chatId} />
        </Segment>
      </Container>
    );
  }
}

export default Chat
