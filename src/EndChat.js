import React from 'react'
import { useMutation } from '@apollo/client'
import { END_CHAT, GET_CHAT } from './queries'
import store from 'store2'

const EndChat = ({chatId}) => {
  // TODO: create message with content "user ended chat"
  const endChat = useMutation(END_CHAT, {
    variables: { chatId },
    refetchQueries: [
      { query: GET_CHAT, variables: { chatId } },
    ]
  })

  return(
    <div className="segment" style={{ backgroundColor: 'var(--info-color)' }}>
      <button 
        className="btn" 
        style={{ backgroundColor: 'var(--danger-color)', color: 'white' }}
        onClick={() => {
          endChat().then(resp => store.remove('activeChat'))
        }}
      >
        End Chat
      </button>
    </div>
  )
}

export default EndChat
