import React, {useState, useEffect, useCallback} from 'react';
import CreateChat from './CreateChat'
import Offline from './Offline'
import ErrorState from './components/ErrorState';
import { gql, useApolloClient } from '@apollo/client';
import { jwtDecode } from 'jwt-decode';
import { CHAT_STATUS } from './constants/chatStatus';
import { WebsiteProvider, useWebsite } from './context/WebsiteContext';

import store from 'store2'
import secureStore from './utils/crypto';
import Query from './Components/Query'
import ChatContainer from './ChatContainer'
import { GET_CHAT } from './queries'
import ToggleButton from './ToggleButton'
import Rate from './Rate'
import { processContractsForCurrentSession, selectContract } from './utils';

import { Container, Panel } from './components/styled/App';
import { configureStyledComponentsForCSP, validateCSPCompatibility } from './utils/styled-csp-integration';

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

const AppContent = () => {
  const activeChat = store('activeChat');
  const [showCreate, setCreate] = useState(!activeChat);
  const [isOpen, setOpen] = useState(false);

  if (showCreate) {
    return (
      <div>
        <Container>
          <Panel $isOpen={isOpen}>
            <CreateChatFlow show={showCreate} setCreate={setCreate} />
          </Panel>
          <ToggleButton
            isOpen={isOpen}
            togglePanel={() => setOpen(!isOpen)}
          />
        </Container>
      </div>
    );
  }

  return (
    <div>
      <Container>
        <Panel $isOpen={isOpen}>
          <Query query={GET_CHAT} variables={{ chatId: activeChat.id }}>
            {({ data }) => {
              if (!data || !data.chat) return null;
              if (data.chat.status === CHAT_STATUS.FINISHED) {
                return <Rate chat={data.chat} setCreate={setCreate} />;
              }
              return <ChatContainer chat={data.chat} />;
            }}
          </Query>
        </Panel>
        <ToggleButton
          isOpen={isOpen}
          togglePanel={() => setOpen(!isOpen)}
        />
      </Container>
    </div>
  );
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

  // Initialize CSP integration on app startup
  useEffect(() => {
    // Configure styled-components to work with CSP
    try {
      configureStyledComponentsForCSP();
      
      // Validate CSP compatibility in development
      if (process.env.NODE_ENV === 'development') {
        const validation = validateCSPCompatibility();
        if (validation.recommendations.length > 0) {
          console.group('🔒 CSP Compatibility Check');
          console.log('CSP Validation Results:', validation);
          validation.recommendations.forEach(rec => {
            console.warn('Recommendation:', rec);
          });
          console.groupEnd();
        }
      }
    } catch (cspError) {
      console.error('Failed to initialize CSP integration:', cspError);
    }
  }, []);

  // Asynchronous function to handle the consumer login process.
  // Wrapped in useCallback to prevent infinite re-renders
  const retryLogin = useCallback(async () => {
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
      // If a token is received, decode it and store the session info securely.
      if (token) {
        const decodedToken = jwtDecode(token);
        const newWebsiteId = decodedToken.user_id;
        
        // Store websiteId in regular localStorage (non-sensitive)
        store('websiteId', newWebsiteId);
        
        // Store token securely with encryption
        try {
          await secureStore.set('token', token);
          console.log('Token stored securely');
        } catch (storageError) {
          console.error('Failed to store token securely, using fallback:', storageError);
          // Fallback to regular storage if secure storage fails
          store('token', token);
        }
        
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
  }, [client]); // Added client dependency to useCallback

  // This effect hook triggers the login process under specific conditions.
  useEffect(() => {
    const showCreate = !store('activeChat');
    // It runs if showing the create chat screen, no websiteId exists,
    // a login is not already in progress, and there has been no previous login error.
    // This prevents infinite loops on login failure.
    if (showCreate && !websiteId && !isLoggingIn && !loginError) {
      retryLogin();
    }
  }, [websiteId, isLoggingIn, loginError, retryLogin]); // Added retryLogin to dependencies

  // If there's a generic error passed as a prop, display it.
  if (error) {
    return <ErrorState message={error.message} onRetry={retryLogin} />;
  }

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
      <WebsiteProvider websiteId={websiteId}>
        <AppContent />
      </WebsiteProvider>
    </div>
  )
}

export default App;