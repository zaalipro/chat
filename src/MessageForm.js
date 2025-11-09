import {useState} from 'react'
import { Mutation } from '@apollo/client/react/components'
import store from 'store2'
import { CREATE_MESSAGE } from './queries'
import { ChatInput, ChatInputShadow, InputField, SubmitButton } from './components/styled/ChatInput'
import { sanitizeMessage, sanitizeAuthor } from './utils/sanitize'

const MessageForm = ({chatId}) => {
  const [inputHasFocus, setInputFocus] = useState(true)
  const [message, setMessage] = useState('')

  return (
    <Mutation mutation={CREATE_MESSAGE}>
      {(createMessage, { data }) => {
        const handleSubmit = () => {
          if (message.length < 1) {
            return
          }

          try {
            // Sanitize user inputs before sending to server
            const sanitizedMessage = sanitizeMessage(message)
            const sanitizedAuthor = sanitizeAuthor(store('customerName'))

            createMessage({ variables: {
              text: sanitizedMessage,
              author: sanitizedAuthor,
              chatId
            }}).then( resp => {
              setMessage('')
            }).catch(error => {
              console.error('Failed to send message:', error)
              // Optionally show error feedback to user
            })
          } catch (sanitizeError) {
            console.error('Input validation failed:', sanitizeError)
            // Optionally show validation error to user
            return
          }
        }

        const onKeyDown = (e) => {
          if (e.keyCode === 13) { // ENTER
            if (e.shiftKey) { // allow new lines with ENTER + SHIFT
              return
            }
            handleSubmit();
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
              <SubmitButton onClick={handleSubmit}>Send</SubmitButton>
            </ChatInputShadow>
          </ChatInput>
        )
      }}
    </Mutation>
  );
}

export default MessageForm
