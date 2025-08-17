import React, { Suspense } from 'react';
import ReactDOM from "react-dom/client";
import './css/index.css'
import './css/design-system.css'
import * as serviceWorker from './serviceWorker';
import { ApolloClient, createHttpLink, InMemoryCache, ApolloProvider, split, gql } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from 'graphql-ws';
import App from './App';
import store from 'store2'
import { jwtDecode } from 'jwt-decode'
// Removed GET_WEBSITE_CONTRACTS import since CreateChat.js handles contract fetching
// Removed contract switching imports since CreateChat.js handles multi-chat creation

const httpLink = createHttpLink({ uri: process.env.REACT_APP_GRAPHQL_HTTP_URL })
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = store("token");
  if (token === null) {
    return headers;
  }
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${token}`
    }
  };
});

// const wsLink = new WebSocketLink({
//   uri: `ws://localhost:5000/graphql`,
//   options: {
//     reconnect: true
//   }
// });
const wsLink = new GraphQLWsLink(createClient({
  url: process.env.REACT_APP_GRAPHQL_WS_URL,
  options: {
    reconnect: true,
    connectionParams: () => ({
      authToken: store("token")
    })
  }
}));

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  authLink.concat(httpLink),
)

const client = new ApolloClient({
  link,
  cache: new InMemoryCache().restore(window.__APOLLO_STATE__),
})

// Contract switching logic removed - CreateChat.js now handles multi-chat creation directly

const ClientApp = () => (
  <ApolloProvider client={client}>
    <Suspense fallback={<div className="segment dimmer active"><div className="loader-container"><div className="loader"></div></div></div>}>
      <App />
    </Suspense>
  </ApolloProvider>
);

// store('contractId', '9f12e91d-b3f1-4c38-b6fe-75051f64de7c');
// store('websiteId', 'fe926e90-0704-43e6-ac57-e9a866d5b4ae')


// european agent
store('contractId', process.env.REACT_APP_DEFAULT_CONTRACT_ID)

const CONSUMER_LOGIN = gql`
  mutation consumerLogin($publicKey: UUID!) {
    consumerLogin(input: {
      publicKey: $publicKey
    }) {
      jwtToken
    }
  }
`;

const loginClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(document.getElementById("root"));

const renderApp = (token) => {
  try {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log('decodedToken', decodedToken)
        console.log('websiteId', decodedToken.user_id)
        store('websiteId', decodedToken.user_id)
        store("token", token);

        // Contract switching removed - CreateChat.js handles multi-chat creation
        console.log('WebsiteId available for CreateChat.js:', decodedToken.user_id)
      } catch (tokenError) {
        console.error('Failed to decode token:', tokenError)
        // Continue with app rendering even if token decoding fails
      }
    } else {
      // Handle case where no token is available
      console.log('No authentication token available')
      const websiteId = store('websiteId')
      if (websiteId) {
        console.log('Using existing websiteId from localStorage for CreateChat.js:', websiteId)
      } else {
        console.warn('No websiteId available')
        // Ensure we have a fallback contractId for backward compatibility
        const fallbackContractId = process.env.REACT_APP_DEFAULT_CONTRACT_ID
        if (fallbackContractId && !store('contractId')) {
          console.log('Using environment fallback contract for backward compatibility')
          store('contractId', fallbackContractId)
        }
      }
    }

    root.render(
      <React.StrictMode>
        <ClientApp />
      </React.StrictMode>
    );

  } catch (error) {
    console.error('Critical error in renderApp:', error)

    // Attempt to render app anyway with fallback contract
    const fallbackContractId = process.env.REACT_APP_DEFAULT_CONTRACT_ID
    if (fallbackContractId) {
      store('contractId', fallbackContractId)
    }

    try {
      root.render(
        <React.StrictMode>
          <ClientApp />
        </React.StrictMode>
      );
    } catch (renderError) {
      console.error('Failed to render app even with fallbacks:', renderError)
    }
  }
}

// Contract monitoring cleanup removed - no longer needed

loginClient.mutate({
  mutation: CONSUMER_LOGIN,
  variables: {
    publicKey: process.env.REACT_APP_PUBLIC_KEY
  }
}).then(response => {
  const token = response?.data?.consumerLogin?.jwtToken;
  renderApp(token);
}).catch(error => {
  console.error("Login mutation failed", error);
  renderApp(null); // Render the app even if login fails
});


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
