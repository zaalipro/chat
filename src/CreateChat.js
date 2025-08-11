import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from '@apollo/client';
import { Formik } from "formik";
import TextField from "./Components/TextField";
import TextAreaField from "./Components/TextAreaField";
import { Segment, Form } from "semantic-ui-react";
import { CREATE_CHAT, CREATE_MESSAGE, GET_WEBSITE_CONTRACTS } from "./queries";
import { detectIPAddress, processContractsForCurrentSession } from "./utils";
import WaitingForAgent from "./WaitingForAgent";
import ChatStatusMonitor from "./ChatStatusMonitor";
import store from "store2";

const CreateChat = ({ setCreate }) => {
  const contractId = store("contractId");
  const websiteId = store("websiteId");
  
  // Multi-chat state management
  const [chatCreationState, setChatCreationState] = useState('form'); // 'form', 'creating', 'waiting', 'connected'
  const [pendingChats, setPendingChats] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]);
  const [error, setError] = useState(null);

  // GraphQL hooks
  const [createChat] = useMutation(CREATE_CHAT);
  const [createMessage] = useMutation(CREATE_MESSAGE);
  
  // Fetch website contracts
  const { data: contractsData, loading: contractsLoading, error: contractsError } = useQuery(
    GET_WEBSITE_CONTRACTS,
    {
      variables: { websiteId },
      skip: !websiteId,
      fetchPolicy: 'cache-and-network'
    }
  );

  // Get active contracts for current session
  useEffect(() => {
    const getActiveContracts = async () => {
      try {
        if (contractsData?.website?.contracts) {
          const sessionContracts = await processContractsForCurrentSession(contractsData.website.contracts);
          console.log(`Found ${sessionContracts.length} active contracts for current session`);
          setActiveContracts(sessionContracts);
        }
      } catch (error) {
        console.error('Failed to get active contracts:', error);
        setError('Failed to load available agents');
      }
    };

    if (contractsData && !contractsLoading) {
      getActiveContracts();
    }
  }, [contractsData, contractsLoading]);

  // Handle contract loading error
  useEffect(() => {
    if (contractsError) {
      console.error('Contract loading error:', contractsError);
      setError('Failed to load contract information');
    }
  }, [contractsError]);

  // Multi-chat creation logic
  const createMultipleChats = async (contracts, formData, ipAddress) => {
    const key = crypto.randomUUID()
    const chatPromises = contracts.map(contract => 
      createChat({
        variables: {
          customerName: formData.customerName,
          headline: formData.headline,
          contractId: contract.id,
          ipAddress: ipAddress,
          key: key
        }
      }).then(response => ({
        success: true,
        chat: response.data.createChat.chat,
        contract: contract
      })).catch(error => ({
        success: false,
        error: error,
        contract: contract
      }))
    );

    return Promise.allSettled(chatPromises);
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      setChatCreationState('creating');
      
      // Detect IP address
      const ipAddress = await detectIPAddress();
      
      // Determine which contracts to use
      let contractsToUse = activeContracts;
      
      // Fallback to single contract if no active contracts found
      if (contractsToUse.length === 0) {
        console.warn('No active contracts found, falling back to single contract');
        if (contractId) {
          // Use the current contractId as fallback
          contractsToUse = [{
            id: contractId,
            session: 2, // Default session
            status: 'active',
            color: '#27af60',
            chatMissTime: 30 // Default timeout
          }];
        } else {
          setError('No agents available at this time');
          setChatCreationState('form');
          setSubmitting(false);
          return;
        }
      }

      console.log(`Creating ${contractsToUse.length} chats for contracts:`, contractsToUse.map(c => c.id));

      // Handle single contract case (backward compatibility)
      if (contractsToUse.length === 1) {
        const contract = contractsToUse[0];
        const key = crypto.randomUUID()
        try {
          const response = await createChat({
            variables: {
              customerName: values.customerName,
              headline: values.headline,
              contractId: contract.id,
              ipAddress: ipAddress,
              key: key
            }
          });

          const chat = response.data.createChat.chat;
          
          // Store customer info (backward compatibility format)
          const activeChat = {
            id: chat.id,
            status: chat.status,
            customerName: chat.customerName,
            headline: chat.headline,
            ipAddress: chat.ipAddress
          };
          
          store("activeChat", activeChat);
          store("customerName", values.customerName);
          
          // Verify backward compatibility
          console.log('Single chat mode: activeChat stored successfully', activeChat);
          
          // Create initial message
          await createMessage({
            variables: {
              text: chat.headline,
              author: chat.customerName,
              isAgent: false,
              chatId: chat.id
            }
          });

          // Complete the flow
          setSubmitting(false);
          setCreate(false);
          return;

        } catch (error) {
          console.error('Single chat creation failed:', error);
          setError('Failed to start conversation. Please try again.');
          setChatCreationState('form');
          setSubmitting(false);
          return;
        }
      }

      // Multi-chat creation
      const results = await createMultipleChats(contractsToUse, values, ipAddress);
      
      console.log(results, 'results')
      // Process results
      const successfulChats = [];
      const failedChats = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successfulChats.push({
            ...result.value.chat,
            contract: result.value.contract
          });
        } else {
          failedChats.push({
            contract: contractsToUse[index],
            error: result.reason || result.value?.error
          });
        }
      });

      console.log(`Chat creation results: ${successfulChats.length} successful, ${failedChats.length} failed`);

      // Handle case where all chats failed
      if (successfulChats.length === 0) {
        console.error('All chat creations failed:', failedChats);
        setError('Failed to connect to any agents. Please try again.');
        setChatCreationState('form');
        setSubmitting(false);
        return;
      }

      // Store customer info
      store("customerName", values.customerName);
      
      // Set up pending chats for monitoring
      setPendingChats(successfulChats);
      setChatCreationState('waiting');
      setSubmitting(false);

      // Log failed chats for debugging
      if (failedChats.length > 0) {
        console.warn('Some chat creations failed:', failedChats);
      }

    } catch (error) {
      console.error('Form submission error:', error);
      setError('An unexpected error occurred. Please try again.');
      setChatCreationState('form');
      setSubmitting(false);
    }
  };

  const handleChatStarted = async (chatData) => {
    try {
      console.log('Agent responded! Chat started:', chatData);
      
      // Set this chat as the active chat (maintaining backward compatibility)
      const activeChat = {
        id: chatData.id,
        status: chatData.status,
        customerName: chatData.customerName,
        headline: chatData.headline,
        ipAddress: chatData.ipAddress
      };
      
      store("activeChat", activeChat);
      
      // Verify localStorage structure for backward compatibility
      const storedChat = store("activeChat");
      if (!storedChat || !storedChat.id) {
        console.error('localStorage activeChat structure validation failed');
        throw new Error('Failed to store active chat properly');
      }
      
      // Find the full chat data from pending chats to get contract info
      const fullChatData = pendingChats.find(chat => chat.id === chatData.id);
      
      if (fullChatData) {
        console.log(`Connected to agent via contract ${fullChatData.contract.id}`);
        
        // Create initial message for this chat
        try {
          await createMessage({
            variables: {
              text: chatData.headline,
              author: chatData.customerName,
              isAgent: false,
              chatId: chatData.id
            }
          });
          
          console.log('Initial message created successfully');
        } catch (messageError) {
          console.error('Failed to create initial message:', messageError);
          // Continue anyway, the chat is still active
        }
      }
      
      // Clean up pending chats and change state
      setPendingChats([]);
      setChatCreationState('connected');
      
      // Hide the create form and show the chat interface
      setCreate(false);
      
    } catch (error) {
      console.error('Error handling chat started:', error);
      setError('Connected to agent but failed to initialize chat properly');
      
      // Still try to proceed with the chat
      store("activeChat", chatData);
      setPendingChats([]);
      setChatCreationState('connected');
      setCreate(false);
    }
  };

  const handleChatMissed = (chatId, contractId) => {
    console.log(`Chat ${chatId} missed for contract ${contractId} - marked as missed but continuing to monitor`);
    
    // Update the pending chats to reflect the missed status
    setPendingChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId 
          ? { ...chat, missed: true }
          : chat
      )
    );
    
    // Log the current state for debugging
    console.log(`Chat ${chatId} marked as missed. Still monitoring for agent response.`);
  };

  const handleMonitorError = (error, chatId) => {
    console.error(`Monitor error for chat ${chatId}:`, error);
    
    // Implement retry logic or fallback behavior
    if (error.networkError) {
      console.log('Network error detected, subscription will retry automatically');
      
      // If we have persistent network issues, show a warning
      setTimeout(() => {
        if (chatCreationState === 'waiting') {
          setError('Connection issues detected. Retrying...');
        }
      }, 5000);
      
    } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      console.error('GraphQL errors in subscription:', error.graphQLErrors);
      
      // Handle specific GraphQL errors
      const hasAuthError = error.graphQLErrors.some(err => 
        err.message.includes('authentication') || err.message.includes('unauthorized')
      );
      
      if (hasAuthError) {
        setError('Authentication error. Please refresh the page and try again.');
        setChatCreationState('form');
        setPendingChats([]);
      }
    } else {
      console.error('Subscription error that may require manual intervention:', error);
      setError('Connection error. Please check your internet connection.');
    }
  };

  // Handle edge case: no active contracts available
  const handleNoActiveContracts = () => {
    console.log('No active contracts available for current session');
    setError('No agents are currently available. Please try again later.');
    setChatCreationState('form');
  };



  // Timeout handler for waiting too long
  useEffect(() => {
    let waitingTimeout;
    
    if (chatCreationState === 'waiting') {
      // Set a maximum waiting time (e.g., 5 minutes)
      waitingTimeout = setTimeout(() => {
        console.log('Maximum waiting time exceeded');
        setError('No agents responded within the expected time. Please try again.');
        setChatCreationState('form');
        setPendingChats([]);
      }, 5 * 60 * 1000); // 5 minutes
    }
    
    return () => {
      if (waitingTimeout) {
        clearTimeout(waitingTimeout);
      }
    };
  }, [chatCreationState]);

  // Check for offline state
  useEffect(() => {
    if (activeContracts.length === 0 && contractsData && !contractsLoading && !contractsError) {
      // No active contracts found, but data loaded successfully
      handleNoActiveContracts();
    }
  }, [activeContracts, contractsData, contractsLoading, contractsError]);

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Clean up any pending operations when component unmounts
      if (chatCreationState === 'waiting') {
        console.log('CreateChat component unmounting during waiting state, cleaning up...');
        setPendingChats([]);
        setChatCreationState('form');
      }
    };
  }, [chatCreationState]);

  // Enhanced error recovery
  const handleRetry = () => {
    setError(null);
    setChatCreationState('form');
    setPendingChats([]);
    
    // Refetch contracts if needed
    if (contractsError) {
      window.location.reload(); // Simple recovery for contract loading errors
    }
  };

  // Backward compatibility verification
  useEffect(() => {
    // Log the current mode for debugging
    if (activeContracts.length === 0 && contractId) {
      console.log('Running in backward compatibility mode with single contract:', contractId);
    } else if (activeContracts.length === 1) {
      console.log('Running in single contract mode with active contract:', activeContracts[0].id);
    } else if (activeContracts.length > 1) {
      console.log(`Running in multi-chat mode with ${activeContracts.length} active contracts`);
    }
  }, [activeContracts, contractId]);

  // Integration testing helper (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Expose component state for testing
      window.createChatDebug = {
        chatCreationState,
        pendingChats,
        activeContracts,
        error,
        contractId,
        websiteId
      };
    }
  }, [chatCreationState, pendingChats, activeContracts, error, contractId, websiteId]);

  return (
    <span>
      <div
        style={{ backgroundColor: "rgba(39,175,96,1)" }}
        className="header header-padding header-shadow"
      >
        <div className="conversation-header gutter-left">
          <h3 className="fadeInLeft">Start conversation</h3>
          <p className="text-opaque fadeInLeft">TeamViewer</p>
        </div>
      </div>
      <div className="body overflow-y-scroll overflow-x-hidden">
        {/* Show waiting state when creating or waiting for agents */}
        {(chatCreationState === 'creating' || chatCreationState === 'waiting') && (
          <>
            <WaitingForAgent 
              pendingChatsCount={pendingChats.length}
              onCancel={() => {
                setChatCreationState('form');
                setPendingChats([]);
                setError(null);
              }}
            />
            
            {/* Monitor chat statuses when waiting */}
            {chatCreationState === 'waiting' && pendingChats.length > 0 && (
              <ChatStatusMonitor
                pendingChats={pendingChats}
                onChatStarted={handleChatStarted}
                onChatMissed={handleChatMissed}
                onError={handleMonitorError}
              />
            )}
          </>
        )}

        {/* Show form when in form state */}
        {chatCreationState === 'form' && (
          <Segment padded>
            <div className="row">
              <Formik
                initialValues={{
                  customerName: "",
                  headline: ""
                }}
                validate={validate}
                onSubmit={handleFormSubmit}
              >
                {form => {
                  return (
                    <Form
                      onSubmit={form.handleSubmit}
                      error={Object.keys(form.errors).length > 0 || !!error}
                    >
                      <TextField
                        form={form}
                        name="customerName"
                        label="Customer name"
                        placeholder="John"
                      />
                      <TextAreaField
                        form={form}
                        name="headline"
                        label="Head line"
                      />
                      
                      {error && (
                        <div style={{ 
                          color: 'red', 
                          marginTop: '10px', 
                          fontSize: '14px',
                          padding: '10px',
                          backgroundColor: '#fff2f2',
                          border: '1px solid #ffcdd2',
                          borderRadius: '4px'
                        }}>
                          <div>{error}</div>
                          <button
                            type="button"
                            onClick={handleRetry}
                            style={{
                              marginTop: '8px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Retry
                          </button>
                        </div>
                      )}
                      
                      <br />
                      <br />
                      <br />
                      <br />
                      <br />
                      <div className="flex flex-hcenter full-width conversation-button-wrapper pointer-events-none">
                        <div
                          className="conversation-button background-darkgray drop-shadow-hover pointer flex-center flex pointer-events-initial"
                          onClick={() => form.submitForm()}
                        >
                          <p>Start Conversation</p>
                        </div>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            </div>
          </Segment>
        )}
      </div>
    </span>
  );
};

const validate = values => values => {
  let errors = {};
  if (!values.customerName) {
    errors.customerName = "Required";
  } else if (values.headline.length < 1) {
    errors.customerName = "Customer name should be more than 1 character";
  }
  if (!values.headline) {
    errors.headline = "Required";
  } else if (values.headline.length < 10) {
    errors.headline = "headline length should be more than 100 characters";
  }
  return errors;
};

export default CreateChat;
