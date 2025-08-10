import React, { Suspense } from 'react';
import ReactDOM from "react-dom/client";
import './css/index.css'
import * as serviceWorker from './serviceWorker';
import 'semantic-ui-css/semantic.min.css';
import { ApolloClient, createHttpLink, InMemoryCache, ApolloProvider, split, gql } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from 'graphql-ws';
import { Dimmer, Loader, Segment } from 'semantic-ui-react'
import App from './App';
import store from 'store2'
import { jwtDecode } from 'jwt-decode'

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


const ClientApp = () => (
  <ApolloProvider client={client}>
    <Suspense fallback={<Segment><Dimmer active><Loader /></Dimmer></Segment>}>
      <App />
    </Suspense>
  </ApolloProvider>
);

// store('contractId', '9f12e91d-b3f1-4c38-b6fe-75051f64de7c');
// store('websiteId', 'fe926e90-0704-43e6-ac57-e9a866d5b4ae')


// european agent
store('contractId', process.env.REACT_APP_DEFAULT_CONTRACT_ID)
store('websiteId', process.env.REACT_APP_DEFAULT_WEBSITE_ID)

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
  if (token) {
    const decodedToken = jwtDecode(token);
    console.log('decodedToken', decodedToken)
    console.log('websiteId', decodedToken.user_id)
    store("token", token);
  }

  root.render(
    <React.StrictMode>
      <ClientApp />
    </React.StrictMode>
  );
}

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
