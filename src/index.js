import React, { Suspense } from 'react';
import ReactDOM from "react-dom/client";
import './css/index.css'
import * as serviceWorker from './serviceWorker';
import 'semantic-ui-css/semantic.min.css';
import { ApolloClient, createHttpLink, InMemoryCache, ApolloProvider, split } from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from 'graphql-ws';
import { Dimmer, Loader, Segment } from 'semantic-ui-react'
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import store from 'store2'
import { API, STORAGE_KEYS, UI } from './constants'

const httpLink = createHttpLink({ uri: API.GRAPHQL })

// const wsLink = new WebSocketLink({
//   uri: `ws://localhost:5000/graphql`,
//   options: {
//     reconnect: true
//   }
// });
const wsLink = new GraphQLWsLink(createClient({
  url: API.WEBSOCKET,
  options: {
    reconnect: true,
    connectionParams: {
      authToken: store(STORAGE_KEYS.TOKEN)
    }
  }
}));

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  httpLink,
)

const client = new ApolloClient({
  link,
  cache: new InMemoryCache().restore(window.__APOLLO_STATE__),
})


const ClientApp = () => (
  <ErrorBoundary
    fallback={(error, errorInfo) => (
      <div style={{
        padding: '40px',
        margin: '20px auto',
        maxWidth: '600px',
        backgroundColor: '#ffebee',
        border: '1px solid #ffcdd2',
        borderRadius: '4px',
        color: '#b71c1c',
        textAlign: 'center'
      }}>
        <h2>Application Error</h2>
        <p>We're sorry, but the application has encountered a critical error.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: UI.COLORS.SECONDARY,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Application
        </button>
      </div>
    )}
  >
    <ApolloProvider client={client}>
      <Suspense fallback={<Segment><Dimmer active><Loader /></Dimmer></Segment>}>
        <App />
      </Suspense>
    </ApolloProvider>
  </ErrorBoundary>
);

store(STORAGE_KEYS.CONTRACT_ID, '9f12e91d-b3f1-4c38-b6fe-75051f64de7c');
store(STORAGE_KEYS.WEBSITE_ID, 'fe926e90-0704-43e6-ac57-e9a866d5b4ae')
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ClientApp />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
