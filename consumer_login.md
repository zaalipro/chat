# Tasks for Consumer Login

- [X] **Implement `consumerLogin` Mutation:** Add a GraphQL mutation to `src/index.js` to authenticate the consumer and retrieve a JWT.
- [X] **Use Public Key from Environment:** The mutation should use the `REACT_APP_PUBLIC_KEY` from the `.env` file.
- [X] **Store JWT:** Store the received `jwtToken` in the browser's local storage using `store2`.
- [X] **Update Apollo HTTP Link:** The main Apollo Client instance should use the stored token in the `authLink` to send it as a bearer token in the authorization header for HTTP requests.
- [X] **Update Apollo WebSocket Link:** The `wsLink` for GraphQL subscriptions should be configured to dynamically read the token from storage for authentication.
- [X] **Asynchronous Application Bootstrap:** The application rendering should wait for the `consumerLogin` mutation to complete to ensure the token is available for the initial GraphQL queries.
