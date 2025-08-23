import React, { Suspense } from 'react';
import ReactDOM from "react-dom/client";
import * as serviceWorker from './serviceWorker';
import { ApolloClient, createHttpLink, InMemoryCache, ApolloProvider, split, gql } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from 'graphql-ws';
import App from './App';
import store from 'store2'
import { jwtDecode } from 'jwt-decode'
import ThemeProvider from './components/styled/design-system/ThemeProvider';
import GlobalStyles from './components/styled/design-system/GlobalStyles';
import { WebsiteProvider } from './context/WebsiteContext';

const httpLink = createHttpLink({ uri: import.meta.env.VITE_GRAPHQL_HTTP_URL })
const authLink = setContext((_, { headers }) => {
  const token = store("token");
  if (token === null) {
    return headers;
  }
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${token}`
    }
  };
});

const wsLink = new GraphQLWsLink(createClient({
  url: import.meta.env.VITE_GRAPHQL_WS_URL,
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

const ClientApp = ({ error }) => (
  <ApolloProvider client={client}>
    <ThemeProvider>
      <GlobalStyles />
      <Suspense fallback={
        <div className="segment dimmer active">
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        </div>
      }>
        <WebsiteProvider>
          <App error={error} />
        </WebsiteProvider>
      </Suspense>
    </ThemeProvider>
  </ApolloProvider>
);

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

const renderApp = (token, error, targetElement = null) => {
  try {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        store('websiteId', decodedToken.user_id)
        store("token", token);
      } catch (tokenError) {
        console.error('Failed to decode token:', tokenError)
      }
    }

    const renderTarget = targetElement ? ReactDOM.createRoot(targetElement) : root;

    renderTarget.render(
      <React.StrictMode>
        <ClientApp error={error} />
      </React.StrictMode>
    );

  } catch (renderError) {
    console.error('Failed to render app even with fallbacks:', renderError)
  }
}

const attemptLogin = () => {
  loginClient.mutate({
    mutation: CONSUMER_LOGIN,
    variables: {
      publicKey: import.meta.env.VITE_PUBLIC_KEY
    }
  }).then(response => {
    const token = response?.data?.consumerLogin?.jwtToken;
    renderApp(token, null);
  }).catch(error => {
    console.error("Login mutation failed", error);
    renderApp(null, new Error("Failed to initialize chat. Please try again."));
  });
}

if (typeof window !== 'undefined') {
  window.chatInitialization = { attemptLogin };
  window.ChatApp = {
    render: renderApp,
    client: loginClient,
    attemptLogin
  };
}

renderApp(null, null);

serviceWorker.unregister();


// Hot Module Replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}