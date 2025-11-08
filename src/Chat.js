import { Component } from 'react'
import MessageBox from './MessageBox'
import MessageForm from './MessageForm'
import { Dropzone, MessageBody, MessagesArea, ChatContainer } from './components/styled/Chat'

class Chat extends Component {
  componentDidMount() {
    // Store the unsubscribe function returned by subscribeToNewMessages
    this.unsubscribe = this.props.subscribeToNewMessages()
  }

  componentWillUnmount() {
    // Clean up subscriptions when component unmounts
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  render() {
    const { data, chatId } = this.props

    return (
      <Dropzone>
        <MessageBody>
          <MessagesArea>
            <MessageBox messages={data.messages}/>
          </MessagesArea>
          <MessageForm chatId={chatId} />
        </MessageBody>
      </Dropzone>
    );
  }
}

export default Chat
