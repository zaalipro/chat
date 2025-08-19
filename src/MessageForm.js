import {useState} from 'react'
import { Mutation } from '@apollo/client/react/components'
import store from 'store2'
import { CREATE_MESSAGE } from './queries'
import { ChatInput, ChatInputShadow, InputField } from './components/styled/ChatInput'

const MessageForm = ({chatId}) => {
  const [inputHasFocus, setInputFocus] = useState(true)
  const [message, setMessage] = useState('')

  return (
    <Mutation mutation={CREATE_MESSAGE}>
      {(createMessage, { data }) => {
        const onKeyDown = (e) => {
          if (e.keyCode === 13) { // ENTER
            if (e.shiftKey) { // allow new lines with ENTER + SHIFT
              return
            }
            if (message.length < 1) {
              return
            }

            createMessage({ variables: {
              text: message,
              author: store('customerName'),
              chatId
            }}).then( resp => {
              setMessage('')
            });
            e.preventDefault()
          }
        }

        return (
          <ChatInput>
            <ChatInputShadow>
              <InputField
                $minRows={1}
                $maxRows={5}
                placeholder='Send a message ...'
                value={message}
                autoFocus={true}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => {
                  setInputFocus(true)
                }}
                onBlur={() => {
                  setInputFocus(false)
                }}
              />
            </ChatInputShadow>
          </ChatInput>
        )
      }}
    </Mutation>
  );
}

export default MessageForm
