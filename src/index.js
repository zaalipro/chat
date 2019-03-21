import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import 'semantic-ui-css/semantic.min.css'
import ApolloClient from "apollo-client";
import { ApolloProvider } from "react-apollo";
import { ApolloProvider as ApolloProviderHooks } from 'react-apollo-hooks';
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-boost';
import { split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { Dimmer, Loader, Segment } from 'semantic-ui-react'
import App from './App';
import store from 'store2'

const httpLink = createHttpLink({ uri: `https://api.graph.cool/simple/v1/kodala` })

const wsLink = new WebSocketLink({
  uri: `wss://subscriptions.graph.cool/v1/kodala`,
  options: {
    reconnect: true
  }
});

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
  <ApolloProvider client={client}>
    <ApolloProviderHooks client={client}>
      <Suspense fallback={<Segment><Dimmer active><Loader /></Dimmer></Segment>}>
        <App />
      </Suspense>
    </ApolloProviderHooks>
  </ApolloProvider>
);

store('contractId', 'cjthncbu00grt0177kaupd8fp');
store('websiteId', 'cjta33b8c0rnv01162lvt55xo')
ReactDOM.render(<ClientApp />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
