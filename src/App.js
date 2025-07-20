import React, { useState, useEffect, useCallback, useRef } from 'react';
import './css/App.css'
import cx from 'classnames'
import CreateChat from './CreateChat'
import Offline from './Offline'
import moment from 'moment'
import store from 'store2'
import Query from './Components/Query'
import ChatContainer from './ChatContainer'
import { GET_CHAT, GET_CONTRACT } from './queries'
import ToggleOpeningStateButton from './ToggleOpeningStateButton'
import Rate from './Rate'
import ContractNotFound from './ContractNotFound'
import ErrorBoundary from './ErrorBoundary'
import { isWorkingHours, getCurrentTime } from './utils';
import { CHAT_STATUS, STORAGE_KEYS, ERROR_MESSAGES } from './constants';

const App = () => {
  // Get activeChat from localStorage
  let activeChat = store(STORAGE_KEYS.ACTIVE_CHAT)
  console.log('Active chat from localStorage:', activeChat)

  // If activeChat exists and its status is "finished", reset it
  if (activeChat && activeChat.status === CHAT_STATUS.FINISHED) {
    console.log('Resetting finished chat on page load')
    store.remove(STORAGE_KEYS.ACTIVE_CHAT)
    activeChat = null
  }

  const contractId = store(STORAGE_KEYS.CONTRACT_ID)
  const [showCreate, setCreate] = useState(!activeChat)
  const [isOpen, setOpen] = useState(true)
  const [showOffline, setOffline] = useState(false)
  const [contractSession, setContractSession] = useState(null)
  const sessionUpdatedRef = useRef({})

  // Use useCallback to memoize the function - DEFINE BEFORE USING IT
  const checkWorkingHours = useCallback((contractSession) => {
    console.log('checkWorkingHours called with session:', contractSession);

    getCurrentTime()
      .then(function (response) {
        console.log('getCurrentTime response:', response);
        const now = moment(response.data, 'YYYY-MM-DDTHH:mm:ss.SSSSZ').utc()
        console.log('Current time (UTC):', now.format('YYYY-MM-DD HH:mm:ss'));

        const isWorking = isWorkingHours(contractSession, now);
        console.log('isWorkingHours result:', isWorking);

        setOffline(!isWorking);
      })
      .catch(function (error) {
        console.error('getCurrentTime error:', error);
        // Fallback to local time if API fails
        const now = moment()
        console.log('Fallback to local time:', now.format('YYYY-MM-DD HH:mm:ss'));

        const isWorking = isWorkingHours(contractSession, now);
        console.log('isWorkingHours result (fallback):', isWorking);

        setOffline(!isWorking);
      })
  }, [setOffline]) // Only depends on setOffline

  // Use effect to check working hours when contractSession changes
  useEffect(() => {
    if (contractSession) {
      console.log('Contract session changed to:', contractSession);
      checkWorkingHours(contractSession);

      // For testing: Force online status after a short delay
      // setTimeout(() => {
      //   console.log('Forcing online status for testing');
      //   setOffline(false);
      // }, 1000);
    }
  }, [contractSession, checkWorkingHours])

  // Handle case where contractId is missing
  if (!contractId) {
    return <ContractNotFound />
  }
  const panelStyles = cx(`panel drop-shadow radius overflow-hidden ${isOpen ? 'fadeInUp' : 'hide'}`)

  if (showCreate) {
    return (
      <div className='App'>
        <div>
          <div className='container'>
            <div className={panelStyles}>
              <ErrorBoundary
                fallback={(error, errorInfo) => (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Error Loading Contract</h3>
                    <p>We're sorry, but there was an error loading the contract information.</p>
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
                      Try Again
                    </button>
                  </div>
                )}
              >
                <Query query={GET_CONTRACT} variables={{ id: contractId }}>
                  {({ data }) => {
                    if (!data?.contract) {
                      return <div>{ERROR_MESSAGES.LOADING_CONTRACT}</div>
                    }

                    // Update the session in the parent component using a ref to track updates
                    // This prevents state updates during render
                    const sessionKey = `${data?.contract?.id}-${data?.contract?.session}`;
                    if (data?.contract?.session && !sessionUpdatedRef.current[sessionKey]) {
                      // Mark this session as processed to avoid repeated state updates
                      sessionUpdatedRef.current[sessionKey] = true;

                      console.log('Contract session from API:', data.contract.session, 'type:', typeof data.contract.session);

                      // Schedule the state update after render
                      setTimeout(() => {
                        // Convert session to number if it's a string
                        const sessionNum = typeof data.contract.session === 'string'
                          ? parseInt(data.contract.session, 10)
                          : data.contract.session;

                        console.log('Setting contract session to:', sessionNum);
                        setContractSession(sessionNum);
                      }, 0);
                    }

                    if (data.contract.status !== CHAT_STATUS.ACTIVE || showOffline) {
                      return (<Offline />)
                    }

                    return (
                      <ErrorBoundary
                        fallback={(error, errorInfo) => (
                          <div style={{ padding: '20px', textAlign: 'center' }}>
                            <h3>Error Creating Chat</h3>
                            <p>We're sorry, but there was an error creating the chat.</p>
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
                              Try Again
                            </button>
                          </div>
                        )}
                      >
                        <CreateChat show={showCreate} setCreate={setCreate} />
                      </ErrorBoundary>
                    )
                  }}
                </Query>
              </ErrorBoundary>
            </div>
            <ToggleOpeningStateButton
              isOpen={isOpen}
              togglePanel={() => setOpen(!isOpen)}
              mainColor={'rgba(39,175,96,1)'}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='App'>
      <div>
        <div className='container'>
          <div className={panelStyles}>
            <ErrorBoundary
              fallback={(error, errorInfo) => (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h3>Error Loading Chat</h3>
                  <p>We're sorry, but there was an error loading the chat information.</p>
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
              )}
            >
              <Query query={GET_CHAT} variables={{ chatId: activeChat?.id }}>
                {({ data }) => {
                  if (!data?.chat) {
                    return <div>{ERROR_MESSAGES.LOADING_CHAT}</div>
                  }
                  if (data.chat.status === CHAT_STATUS.FINISHED) {
                    return (
                      <ErrorBoundary>
                        <Rate chat={data.chat} setCreate={setCreate} />
                      </ErrorBoundary>
                    )
                  }
                  return (
                    <ErrorBoundary
                      fallback={(error, errorInfo) => (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                          <h3>Error in Chat</h3>
                          <p>We're sorry, but there was an error in the chat component.</p>
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
                      )}
                    >
                      <ChatContainer chat={data.chat} />
                    </ErrorBoundary>
                  )
                }}
              </Query>
            </ErrorBoundary>
          </div>
          <ToggleOpeningStateButton
            isOpen={isOpen}
            togglePanel={() => setOpen(!isOpen)}
            mainColor={'rgba(39,175,96,1)'}
          />
        </div>
      </div>
    </div>
  )
}

export default App;
