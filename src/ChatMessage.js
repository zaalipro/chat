import React, { Component } from 'react'
import './ChatMessage.css'
import { timeDifferenceForDate } from './utils'
const imageUrl = 'http://imgur.com/qPjLkW0.png'

class ChatMessage extends Component {

  render() {
    const { message } = this.props
    return (
      <div className='fadeInLeft'>
        {message.isAgent ? this._renderAgentMessage() : this._renderOwnMessage()}
      </div>
    )
  }

  _renderOwnMessage = () => {
    const {ago, textWithLineBreaks} = this._generateChatMessageInfo()
    return (
      <div className='message-padding'>
        <div className='flex flex-bottom'>
          <div className='message-container message-container-padding-right flex-right'>
            <div
              style={{backgroundColor: this.props.userSpeechBubbleColor}}
              className='white padding-20 radius background-blue'>
              <p>{textWithLineBreaks}</p>
            </div>
            {this.props.shouldRenderTimestamp &&
              <p className='right opacity-4 padding-top-2'>{ago}</p>
            }
          </div>
        </div>
      </div>
    )
  }

  _renderAgentMessage = () => {
    const {ago, profileImageUrl, textWithLineBreaks} = this._generateChatMessageInfo()
    return (
      <div className='message-padding'>
        <div className='flex flex-bottom'>
          <img
            src={profileImageUrl}
            alt=''
            className='avatar message-avatar'></img>
          <div className='message-container message-container-padding-left'>
            <div className='opaque background-gray padding-20 radius opaque'>
              <p>{textWithLineBreaks}</p>
            </div>
            {this.props.shouldRenderTimestamp &&
              <p className='right opacity-4 padding-top-2'>{ago}</p>
            }
          </div>
        </div>
      </div>
    )
  }

  _generateChatMessageInfo = () => {
    const ago = timeDifferenceForDate(this.props.message.createdAt)
    const textWithLineBreaks = this.props.message.text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ))
    return {ago, imageUrl, textWithLineBreaks}
  }

}

export default ChatMessage
