import React, { Component } from 'react'
import MessageBox from './MessageBox'
import MessageForm from './MessageForm'
import './css/Chat.css'

class Chat extends Component {
  componentDidMount() {
    this.props.subscribeToNewMessages()
  }

  render() {
    const { data, chatId } = this.props

    return (
      <div className="dropzone relative">
        <div className='message-body chat-container'>
          <MessageBox messages={data.messages}/>
          <MessageForm chatId={chatId} />
        </div>
      </div>
    );
  }
}

export default Chat
