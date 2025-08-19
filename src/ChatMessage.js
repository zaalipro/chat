import React, { Component } from 'react'
import { timeDifferenceForDate } from './utils'
import { 
  MessagePadding, 
  Flex, 
  FlexBottom, 
  FlexRight, 
  MessageContainer, 
  MessageContainerPaddingLeft, 
  MessageContainerPaddingRight, 
  MessageBubble, 
  MessageAvatar,
  Right,
  Opacity4,
  PaddingTop2
} from './components/styled/ChatMessage'
import { FadeInLeft } from './components/styled/keyframes'

const imageUrl = import.meta.env.VITE_COMPANY_LOGO_URL

class ChatMessage extends Component {

  render() {
    const { message } = this.props
    return (
      <FadeInLeft>
        {message.isAgent ? this._renderAgentMessage() : this._renderOwnMessage()}
      </FadeInLeft>
    )
  }

  _renderOwnMessage = () => {
    const {ago, textWithLineBreaks} = this._generateChatMessageInfo()
    return (
      <MessagePadding>
        <FlexBottom>
          <MessageContainerPaddingRight>
            <FlexRight>
              <MessageBubble $isAgent={false} $userSpeechBubbleColor={this.props.userSpeechBubbleColor}>
                <p>{textWithLineBreaks}</p>
              </MessageBubble>
              {this.props.shouldRenderTimestamp && (
                <Right>
                  <Opacity4>
                    <PaddingTop2>{ago}</PaddingTop2>
                  </Opacity4>
                </Right>
              )}
            </FlexRight>
          </MessageContainerPaddingRight>
        </FlexBottom>
      </MessagePadding>
    )
  }

  _renderAgentMessage = () => {
    const {ago, profileImageUrl, textWithLineBreaks} = this._generateChatMessageInfo()
    return (
      <MessagePadding>
        <FlexBottom>
          <img
            src={profileImageUrl}
            alt=''
            className='avatar message-avatar'></img>
          <MessageContainerPaddingLeft>
            <MessageBubble $isAgent={true}>
              <p>{textWithLineBreaks}</p>
            </MessageBubble>
            {this.props.shouldRenderTimestamp && (
              <Right>
                <Opacity4>
                  <PaddingTop2>{ago}</PaddingTop2>
                </Opacity4>
              </Right>
            )}
          </MessageContainerPaddingLeft>
        </FlexBottom>
      </MessagePadding>
    )
  }

  _generateChatMessageInfo = () => {
    const ago = timeDifferenceForDate(this.props.message.insertedAt)
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
