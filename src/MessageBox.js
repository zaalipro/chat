import React, { Component } from 'react'
import './css/ChatMessages.css'
import ChatMessage from './ChatMessage'

const mainColor = 'rgba(39,175,96,1)'
const companyLogoURL = 'http://imgur.com/qPjLkW0.png'

class MessageBox extends Component {
  componentDidMount() {
    this._scrollToBottom()
  }

  componentDidUpdate() {
    this._scrollToBottom()
  }

  render() {
    return (
      <div className='chat-messages-container'>
        {this.props.messages.map((message, i) => {
          const isLatestMessage = i === this.props.messages.length - 1
          return (<ChatMessage
            key={i}
            message={message}
            shouldRenderTimestamp={isLatestMessage}
            profileImageURL={companyLogoURL}
            userSpeechBubbleColor={mainColor}
          />)
        })}
        { /* invisible element required for automatic scrolling to bottom */ }
        <div style={ {float:'left', clear: 'both'} } ref={el => { this._messagesEnd = el }}></div>
      </div>
    )
  }

  _scrollToBottom = () => {
    if (this._messagesEnd) {
      this._messagesEnd.scrollIntoView({behavior: 'smooth'})
    }
  }

}

export default MessageBox
