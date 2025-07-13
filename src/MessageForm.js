import React, {useState} from 'react'
import { Mutation } from '@apollo/client/react/components'
import store from 'store2'
import './css/ChatInput.css'
import { CREATE_MESSAGE } from './queries'
import Textarea from 'react-textarea-autosize'

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
          <div className={`chat-input flex items-center radius-bottom ${inputHasFocus ? 'chat-input-shadow' : 'light-background'}`}>
            <Textarea
    					minRows={1}
    					maxRows={5}
              className={`InputField ${!inputHasFocus && 'light-background'}`}
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

          </div>
        )
      }}
    </Mutation>
  );
}

export default MessageForm
