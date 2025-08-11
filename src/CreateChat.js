import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import TextField from "./Components/TextField";
import TextAreaField from "./Components/TextAreaField";
import { Segment, Form } from "semantic-ui-react";
import WaitingForAgent from "./WaitingForAgent";
import ChatStatusMonitor from "./ChatStatusMonitor";
import store from "store2";

// Hooks
import { useContracts } from "./hooks/useContracts";
import { useChatCreation } from "./hooks/useChatCreation";
import { useChatMonitor } from "./hooks/useChatMonitor";
import { useError } from "./hooks/useError";

// Config
import { CHAT_STATES, TIMEOUTS } from "./config/ChatConfig";

const CreateChat = ({ setCreate }) => {
  const websiteId = store("websiteId");

  // State
  const [state, setState] = useState(CHAT_STATES.FORM);
  const [pending, setPending] = useState([]);

  // Custom hooks
  const { contracts, loading, error: contractError, processing, loadComplete } = useContracts(websiteId);
  const { createChats, creating } = useChatCreation();
  const { handleStarted, handleMissed, handleError: monitorError, reset } = useChatMonitor();
  const { error, handleError, clearError } = useError();

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      handleError(contractError, 'CONTRACT_LOAD_FAILED');
    }
  }, [contractError, handleError]);

  // Check for offline state
  useEffect(() => {
    const shouldShow = contracts.length === 0 && 
                     !loading && 
                     !contractError && 
                     !processing && 
                     loadComplete;

    console.log('shouldShowOffline:', shouldShow);

    if (shouldShow) {
      console.log('No agents available');
      handleError(null, 'NO_AGENTS');
      setState(CHAT_STATES.FORM);
    }
  }, [contracts, loading, contractError, processing, loadComplete, handleError]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      clearError();
      reset();
      setState(CHAT_STATES.CREATING);

      // Check contracts
      if (contracts.length === 0) {
        console.warn('No contracts available');
        handleError(null, 'NO_AGENTS');
        setState(CHAT_STATES.FORM);
        setSubmitting(false);
        return;
      }

      console.log(`Creating ${contracts.length} chats`);

      // Create chats
      const result = await createChats(contracts, values);

      // Handle failures
      if (result.success.length === 0) {
        console.error('All chats failed:', result.failed);
        handleError(null, 'FAILED_TO_START');
        setState(CHAT_STATES.FORM);
        setSubmitting(false);
        return;
      }

      // Store customer name
      store("customerName", values.customerName);

      // Set up monitoring
      setPending(result.success);
      setState(CHAT_STATES.WAITING);
      setSubmitting(false);

    } catch (err) {
      console.error('Form submit error:', err);
      handleError(err);
      setState(CHAT_STATES.FORM);
      setSubmitting(false);
    }
  };

  const onChatStarted = async (chat) => {
    try {
      await handleStarted(chat, pending, () => {
        // Complete the flow
        setPending([]);
        setState(CHAT_STATES.CONNECTED);
        setCreate(false);
      });
    } catch (err) {
      console.error('Chat started error:', err);
      handleError(err);
      
      // Still proceed with chat
      store("activeChat", chat);
      setPending([]);
      setState(CHAT_STATES.CONNECTED);
      setCreate(false);
    }
  };

  const onChatMissed = (chatId, contractId) => {
    handleMissed(chatId, contractId);
    
    // Update pending chats
    setPending(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, missed: true } : chat
      )
    );
  };

  const onMonitorError = (err, chatId) => {
    monitorError(err, chatId);
    
    // Handle specific errors
    if (err.networkError) {
      setTimeout(() => {
        if (state === CHAT_STATES.WAITING) {
          handleError(err, 'CONNECTION_ERROR');
        }
      }, TIMEOUTS.CONNECTION_RETRY);
    } else if (err.graphQLErrors?.some(e => 
      e.message.includes('auth') || e.message.includes('unauthorized')
    )) {
      handleError(err, 'AUTH_ERROR');
      setState(CHAT_STATES.FORM);
      setPending([]);
    } else {
      handleError(err, 'CONNECTION_ERROR');
    }
  };



  // Timeout for waiting too long
  useEffect(() => {
    let timeout;

    if (state === CHAT_STATES.WAITING) {
      timeout = setTimeout(() => {
        console.log('Waiting timeout exceeded');
        handleError(null, 'TIMEOUT');
        setState(CHAT_STATES.FORM);
        setPending([]);
      }, TIMEOUTS.WAITING);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [state, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state === CHAT_STATES.WAITING) {
        console.log('Component unmounting, cleaning up...');
        setPending([]);
        setState(CHAT_STATES.FORM);
      }
    };
  }, [state]);

  // Retry handler
  const handleRetry = () => {
    clearError();
    reset();
    setState(CHAT_STATES.FORM);
    setPending([]);

    if (contractError) {
      window.location.reload();
    }
  };

  // Debug mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.createChatDebug = {
        state,
        pending,
        contracts,
        loading,
        error,
        websiteId
      };
    }
  }, [state, pending, contracts, loading, error, websiteId]);

  // Log current mode
  useEffect(() => {
    if (contracts.length === 0) {
      console.log('No contracts mode');
    } else if (contracts.length === 1) {
      console.log('Single contract mode:', contracts[0].id);
    } else {
      console.log(`Multi-chat mode: ${contracts.length} contracts`);
    }
  }, [contracts]);

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
        {/* Show waiting state */}
        {(state === CHAT_STATES.CREATING || state === CHAT_STATES.WAITING) && (
          <>
            <WaitingForAgent
              pendingChatsCount={pending.length}
              onCancel={() => {
                setState(CHAT_STATES.FORM);
                setPending([]);
                reset();
                clearError();
              }}
            />

            {/* Monitor chat statuses */}
            {state === CHAT_STATES.WAITING && pending.length > 0 && (
              <ChatStatusMonitor
                pendingChats={pending}
                onChatStarted={onChatStarted}
                onChatMissed={onChatMissed}
                onError={onMonitorError}
              />
            )}
          </>
        )}

        {/* Show form */}
        {state === CHAT_STATES.FORM && (
          <Segment padded>
            <div className="row">
              <Formik
                initialValues={{
                  customerName: "",
                  headline: ""
                }}
                validate={validate}
                onSubmit={handleSubmit}
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

const validate = values => {
  let errors = {};
  if (!values.customerName) {
    errors.customerName = "Required";
  } else if (values.customerName.length < 1) {
    errors.customerName = "Customer name should be more than 1 character";
  }
  if (!values.headline) {
    errors.headline = "Required";
  } else if (values.headline.length < 10) {
    errors.headline = "headline length should be more than 10 characters";
  }
  return errors;
};

export default CreateChat;
