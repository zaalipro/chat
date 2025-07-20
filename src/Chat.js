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
    
    // Add null check for data and messages
    if (!data || !data.messages) {
      return (
        <div className="dropzone relative">
          <div className='message-body chat-container'>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Loading messages...</p>
            </div>
            <MessageForm chatId={chatId} />
          </div>
        </div>
      );
    }

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
