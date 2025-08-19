import { Component } from 'react'
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
          <MessageBox messages={data.messages}/>
          <MessageForm chatId={chatId} />
        </MessageBody>
      </Dropzone>
    );
  }
}

export default Chat
