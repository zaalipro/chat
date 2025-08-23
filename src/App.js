import React, {useState, useEffect} from 'react';
import CreateChat from './CreateChat'
import Offline from './Offline'
import ErrorState from './components/ErrorState';
import { gql, useApolloClient } from '@apollo/client';
import { jwtDecode } from 'jwt-decode';
import { CHAT_STATUS } from './constants/chatStatus';
import { WebsiteProvider, useWebsite } from './context/WebsiteContext';

import store from 'store2'
import Query from './Components/Query'
import ChatContainer from './ChatContainer'
import { GET_CHAT } from './queries'
import ToggleButton from './ToggleButton'
import Rate from './Rate'
import { processContractsForCurrentSession, selectContract } from './utils';

import { Container, Panel } from './components/styled/App';

const CONSUMER_LOGIN = gql`
  mutation consumerLogin($publicKey: UUID!) {
    consumerLogin(input: {
      publicKey: $publicKey
    }) {
      jwtToken
    }
  }
`;

const CreateChatFlow = ({ show, setCreate }) => {
  const { website } = useWebsite();
  const [selectedContract, setSelectedContract] = useState(null);
  const [showOffline, setOffline] = useState(false);

  const processContracts = async (allContracts) => {
    const sessionContracts = await processContractsForCurrentSession(allContracts);
    setSelectedContract(selectContract(sessionContracts));
    return sessionContracts.length > 0;
  };

  const checkWorkingHours = async (allContracts) => {
    const hasAvailableContracts = await processContracts(allContracts);
    setOffline(!hasAvailableContracts);
  };

  useEffect(() => {
    if (website && website.contracts) {
      checkWorkingHours(website.contracts);
    }
  }, [website]);

  if (!selectedContract || showOffline) {
    return <Offline />;
  }

  return <CreateChat show={show} setCreate={setCreate} />;
};


const App = ({ error }) => {
  // websiteId from local storage, managed by React state for re-rendering.
  const [websiteId, setWebsiteId] = useState(store('websiteId'));
  // Flag to indicate when a login attempt is in progress.
  const [isLoggingIn, setLoggingIn] = useState(false);
  // Holds any error that occurs during login.
  const [loginError, setLoginError] = useState(null);
  // Gets the Apollo Client instance from the context provided by ApolloProvider.
  const client = useApolloClient();

  // Asynchronous function to handle the consumer login process.
  const retryLogin = async () => {
    // Set logging in state to true and clear any previous errors.
    setLoggingIn(true);
    setLoginError(null);
    // Retrieve the public key from window object or Vite environment variables.
    const publicKey = import.meta.env.VITE_PUBLIC_KEY;
    // If no public key is found, record an error and stop the process.
    if (!publicKey) {
      const err = new Error("Public key not found for login.");
      console.error(err);
      setLoginError(err);
      setLoggingIn(false);
      return;
    }

    try {
      // Execute the consumer login GraphQL mutation.
      const response = await client.mutate({
        mutation: CONSUMER_LOGIN,
        variables: { publicKey }
      });
      // Extract the JWT token from the mutation response.
      const token = response?.data?.consumerLogin?.jwtToken;
      // If a token is received, decode it and store the session info.
      if (token) {
        const decodedToken = jwtDecode(token);
        const newWebsiteId = decodedToken.user_id;
        // Store websiteId and token in local storage for session persistence.
        store('websiteId', newWebsiteId);
        store('token', token);
        // Update the websiteId in the component's state to trigger a re-render.
        setWebsiteId(newWebsiteId);
      } else {
        // If the response does not contain a token, throw an error.
        throw new Error("Login response did not contain a token.");
      }
    } catch (e) {
      // Catch any errors during the mutation process.
      console.error("Login mutation failed", e);
      setLoginError(e);
    } finally {
      // Ensure the logging in flag is reset after the attempt is complete.
      setLoggingIn(false);
    }
  };

  const activeChat = store('activeChat')
  const [showCreate, setCreate] = useState(!activeChat)

  // This effect hook triggers the login process under specific conditions.
  useEffect(() => {
    // It runs if showing the create chat screen, no websiteId exists,
    // a login is not already in progress, and there has been no previous login error.
    // This prevents infinite loops on login failure.
    if (showCreate && !websiteId && !isLoggingIn && !loginError) {
      retryLogin();
    }
  }, [showCreate, websiteId, isLoggingIn, loginError]); // Dependencies for the effect.

  // If there's a generic error passed as a prop, display it.
  if (error) {
    return <ErrorState message={error.message} onRetry={retryLogin} />;
  }

  const [isOpen, setOpen] = useState(false)
  // Replace cx utility with conditional styling
  const panelStyles = isOpen ? 'fadeInUp' : 'hide'

  if (showCreate) {
    // If websiteId is missing, display the current login status.
    if (!websiteId) {
      // Show an initializing message while logging in.
      if (isLoggingIn) return <ErrorState message="Initializing..." />;
      // Show an error message if login failed, with a retry button.
      if (loginError) return <ErrorState message={`Failed to initialize: ${loginError.message}`} onRetry={retryLogin} />;
      // Default message while waiting for the login process to start.
      return <ErrorState message="Initializing session..." />;
    }

    return (
      <div className='App chat-widget'>
        <div>
          <Container>
            <Panel $isOpen={isOpen}>
              <WebsiteProvider websiteId={websiteId}>
                <CreateChatFlow show={showCreate} setCreate={setCreate} />
              </WebsiteProvider>
            </Panel>
            <ToggleButton
              isOpen={isOpen}
              togglePanel={() => setOpen(!isOpen)}
            />
          </Container>
        </div>
      </div>
    )
  }

  return (
      <div className='App chat-widget'>
        <div>
          <Container>
            <Panel $isOpen={isOpen}>
              <Query query={GET_CHAT} variables={{ chatId: activeChat.id }}>
                {({ data}) => {
                  if (data.chat.status === CHAT_STATUS.FINISHED) {
                    return(<Rate chat={data.chat} setCreate={setCreate} />)
                  }
                  return (
                    <ChatContainer chat={data.chat} />
                  )
                }}
              </Query>
            </Panel>
            <ToggleButton
              isOpen={isOpen}
              togglePanel={() => setOpen(!isOpen)}
            />
          </Container>
        </div>
      </div>
  )
}

export default App;