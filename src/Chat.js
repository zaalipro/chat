import React, { Component } from 'react'
import MessageBox from './MessageBox'
import MessageForm from './MessageForm'
import { Dropzone, MessageBody, ChatContainer } from './components/styled/Chat'

class Chat extends Component {
  componentDidMount() {
    this.props.subscribeToNewMessages()
  }

  render() {
    const { data, chatId } = this.props

    return (
      <Dropzone>
        <MessageBody>
          <ChatContainer>
            <MessageBox messages={data.messages}/>
            <MessageForm chatId={chatId} />
          </ChatContainer>
        </MessageBody>
      </Dropzone>
    );
  }
}

export default Chat
