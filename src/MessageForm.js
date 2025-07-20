import React, { useState, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import store from 'store2'
import './css/ChatInput.css'
import { CREATE_MESSAGE } from './queries'
import Textarea from 'react-textarea-autosize'
import ErrorBoundary from './ErrorBoundary'
import { STORAGE_KEYS, MESSAGE, ERROR_MESSAGES } from './constants'

const MessageForm = ({ chatId }) => {
  const [inputHasFocus, setInputFocus] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Set error if chatId is invalid, but don't return early (would violate hooks rules)
  useEffect(() => {
    if (!chatId) {
      setError(ERROR_MESSAGES.INVALID_CHAT)
    } else {
      setError('')
    }
  }, [chatId])

  // Use the modern useMutation hook instead of the deprecated Mutation component
  // Always call hooks at the top level
  const [createMessage] = useMutation(CREATE_MESSAGE);

  // If there's an error, show it
  if (error) {
    return (
      <div className="chat-input flex items-center radius-bottom light-background">
        <div style={{ padding: '10px', color: 'red' }}>
          {error}
        </div>
      </div>
    )
  }

  const onKeyDown = (e) => {
    if (e.keyCode === MESSAGE.ENTER_KEY_CODE) { // ENTER
      if (e.shiftKey) { // allow new lines with ENTER + SHIFT
        return
      }
      if (message.length < MESSAGE.MIN_LENGTH) {
        return
      }

      const customerName = store(STORAGE_KEYS.CUSTOMER_NAME) || MESSAGE.DEFAULT_AUTHOR

      createMessage({
        variables: {
          text: message,
          author: customerName,
          chatId
        }
      })
        .then(_ => {
          setMessage('')
        })
        .catch(error => {
          console.error(ERROR_MESSAGES.SEND_ERROR, error)
          // Could add UI feedback here
        });
      e.preventDefault()
    }
  }

  return (
    <ErrorBoundary
      fallback={(error, errorInfo) => (
        <div className="chat-input flex items-center radius-bottom light-background">
          <div style={{ padding: '10px', color: 'red' }}>
            Error in message form. Please reload the page.
          </div>
        </div>
      )}
    >
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
    </ErrorBoundary>
  );
}

export default MessageForm
