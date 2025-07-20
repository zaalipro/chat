import React from 'react'
import store from 'store2'

const EndedChat = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Chat Ended</h3>
      <p>This chat has been ended by the agent.</p>
      <button
        onClick={() => {
          store.remove('activeChat')
          window.location.reload()
        }}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Start New Chat
      </button>
    </div>
  )
}

export default EndedChat