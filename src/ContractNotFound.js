import React from 'react'

const ContractNotFound = () => {
  return (
    <div className='App'>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Configuration Error</h3>
        <p>Contract ID not found. Please check your configuration.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload
        </button>
      </div>
    </div>
  )
}

export default ContractNotFound