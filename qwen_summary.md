# Chat Widget - Codebase Analysis and Improvements

## Plan Document

### Introduction

The chat widget is built with React 18.2.0 and uses Apollo Client 3.7.2 for GraphQL communication. It implements real-time messaging through GraphQL subscriptions and uses styled-components for styling. The widget is designed to be embedded in external websites and handles various states including chat creation, waiting for agents, active conversations, and post-chat rating.

### Planning

#### Understanding

The chat widget needs improvements in several areas:
1. Memory leaks from event listeners and subscriptions not being properly cleaned up
2. CSS styling issues and inconsistencies
3. Error handling improvements
4. Component architecture standardization
5. Better use of theme variables throughout the codebase

#### Planning Phase

**High-level approach:**
- Standardize on functional components with hooks
- Implement proper cleanup for all subscriptions and event listeners
- Fix CSS styling issues
- Improve error handling consistency
- Ensure theme variables are used consistently

**Data flow & architecture:**
- Data flows from GraphQL endpoints through Apollo Client to the UI
- Local storage is used for session persistence via store2
- Subscriptions handle real-time updates for messages and chat status
- Context API provides website configuration data to components

**Step-by-step execution plan:**
1. Fix CSS styling issues in ChatHeader component
2. Fix variable naming inconsistency in ChatMessage component
3. Implement proper cleanup for mediaQuery listener in widget.js
4. Improve error handling in CreateChatFlow component
5. Standardize component architecture to use only functional components

**Edge cases & failure handling:**
- Handle cases where no agents are available
- Manage timeouts when agents don't respond
- Gracefully handle network errors and authentication failures
- Ensure proper cleanup when components unmount

**Scalability & performance considerations:**
- Use useMemo and useCallback for performance optimization
- Implement proper subscription cleanup to prevent memory leaks
- Minimize unnecessary re-renders through careful useEffect dependencies

**Tools, libraries, and frameworks:**
- React 18.2.0 for UI components
- Apollo Client 3.7.2 for GraphQL communication
- styled-components for styling
- store2 for local storage management
- Formik for form handling

### Implementation Phase

The implementation will focus on fixing identified issues while maintaining the existing functionality. The widget will continue to support embedding in external websites and real-time communication with support agents.

## Design Document

### Overview

This chat widget is built with React 18.2.0 and uses Apollo Client 3.7.2 for GraphQL communication. The widget is designed to be embedded in any website and provides real-time customer support functionality. It uses styled-components for styling and follows a component-based architecture with hooks for state management.

Key technologies used:
- **React 18.2.0**: For building the user interface components
- **Apollo Client 3.7.2**: For GraphQL queries, mutations, and subscriptions
- **styled-components**: For component styling
- **Formik**: For form handling in the chat creation flow
- **store2**: For local storage management
- **graphql-ws**: For WebSocket-based GraphQL subscriptions

### Architecture

#### Component Structure

```text
src/
├── App.js
├── widget.js
├── queries.js
├── utils.js
├── ChatContainer.js
├── Chat.js
├── ChatMessage.js
├── MessageBox.js
├── MessageForm.js
├── ChatHeader.js
├── CreateChat.js
├── WaitingForAgent.js
├── ChatStatusMonitor.js
├── EndedChat.js
├── EndChat.js
├── Rate.js
├── Offline.js
├── ToggleButton.js
├── Components/
│   ├── Query.js
│   ├── TextField.js
│   ├── TextAreaField.js
│   ├── NumberField.js
│   ├── Rating.js
│   ├── ErrorState.js
├── components/styled/
│   ├── App.js
│   ├── Chat.js
│   ├── ChatInput.js
│   ├── ChatMessage.js
│   ├── ChatMessages.js
│   ├── DesignSystem.js
│   ├── keyframes.js
│   ├── design-system/
│       ├── GlobalStyles.js
│       ├── theme.js
│       ├── ThemeProvider.js
├── context/
│   ├── WebsiteContext.js
├── hooks/
│   ├── useChatCreation.js
│   ├── useChatMonitor.js
│   ├── useContracts.js
│   ├── useError.js
├── utils/
│   ├── chatUtils.js
├── constants/
│   ├── chatStatus.js
├── config/
│   ├── ChatConfig.js
```

#### Data Flow

1. **Initialization**: widget.js initializes Apollo Client with HTTP and WebSocket links
2. **Authentication**: App.js handles consumer login and token storage
3. **Contract Loading**: CreateChat.js uses useContracts hook to fetch available contracts via GET_WEBSITE_CONTRACTS query
4. **Chat Creation**: CreateChat.js uses useChatCreation hook to create chats via CREATE_CHAT mutation
5. **Message Sending**: MessageForm.js uses CREATE_MESSAGE mutation to send messages
6. **Real-time Updates**: 
   - Chat.js subscribes to new messages via MESSAGE_SUBSCRIPTION
   - ChatStatusMonitor.js subscribes to chat status changes via CHAT_STATUS_SUBSCRIPTION
7. **Chat Ending**: ChatContainer.js uses END_CHAT mutation to end conversations
8. **Rating**: Rate.js uses RATE_AGENT mutation to submit agent ratings

### Components and Interfaces

#### App

- **File location**: `src/App.js`
- **Props**: 
  - `error` (Error object): Error to display on initialization
- **State variables**:
  - `websiteId` (string): ID of the website for which the widget is configured
  - `isLoggingIn` (boolean): Flag indicating if a login attempt is in progress
  - `loginError` (Error object): Error that occurred during login
- **Technical description**: Main application component that handles authentication and routing between different chat states (creation form, active chat, rating form, offline state).

#### ChatContainer

- **File location**: `src/ChatContainer.js`
- **Props**:
  - `chat` (object): Chat object containing id and other properties
- **State variables**:
  - `chatEnded` (boolean): Flag indicating if the chat has ended
- **Technical description**: Container component for active chats that handles chat status monitoring and renders either the active chat interface or the ended chat interface.

#### Chat

- **File location**: `src/Chat.js`
- **Props**:
  - `data` (object): Message data from GraphQL query
  - `chatId` (string): ID of the current chat
  - `subscribeToNewMessages` (function): Function to initiate subscription to new messages
- **Technical description**: Component that renders the chat interface including message box and message form. It subscribes to new messages when mounted.

#### ChatMessage

- **File location**: `src/ChatMessage.js`
- **Props**:
  - `message` (object): Message object with text, author, and timestamp
  - `shouldRenderTimestamp` (boolean): Flag indicating if timestamp should be shown
  - `profileImageURL` (string): URL for agent profile image
  - `userSpeechBubbleColor` (string): Color for user message bubbles
- **Technical description**: Component that renders individual chat messages with appropriate styling for agent vs user messages.

#### MessageForm

- **File location**: `src/MessageForm.js`
- **Props**:
  - `chatId` (string): ID of the chat to which messages are sent
- **State variables**:
  - `inputHasFocus` (boolean): Flag indicating if input field has focus
  - `message` (string): Current message text in the input field
- **Technical description**: Form component for sending messages that handles both keyboard submission (Enter key) and button click submission.

#### CreateChat

- **File location**: `src/CreateChat.js`
- **Props**:
  - `setCreate` (function): Function to update chat creation state
- **State variables**:
  - `state` (string): Current state in the chat creation flow (FORM, CREATING, WAITING, CONNECTED)
  - `pending` (array): Array of pending chat objects
- **Technical description**: Component that handles the chat creation flow including form validation, contract processing, and waiting for agent responses.

#### ChatStatusMonitor

- **File location**: `src/ChatStatusMonitor.js`
- **Props**:
  - `pendingChats` (array): Array of pending chat objects to monitor
  - `onChatStarted` (function): Callback when a chat starts
  - `onChatMissed` (function): Callback when a chat is missed
  - `onError` (function): Callback for handling errors
- **State variables**:
  - `timeoutsRef` (object): Ref for managing chat timeout handlers
- **Technical description**: Component that monitors chat statuses through GraphQL subscriptions and handles timeouts for chats that don't get agent responses.

### API or GraphQL Queries

#### queries.js

```javascript
import { gql } from '@apollo/client'

// Fragments
const chatFragment = gql`
  fragment chatFragment on Chat {
    id
    key
    status
    missed
    headline
    ipAddress
    customerName
  }
`

const messageFragment = gql`
  fragment messageFragment on Message {
    id
    text
    author
    isAgent
    insertedAt
    updatedAt
  }
`

const contractFragment = gql`
  fragment contractFragment on Contract {
    id
    status
    session
    color
    chatMissTime
  }
`

export const CREATE_CHAT = gql`
  mutation createChat(
    $customerName: String!
    $headline: String!
    $contractId: UUID!
    $ipAddress: InternetAddress,
    $key: UUID!
  ) {
    createChat(
      input: {
        chat: {
          customerName: $customerName
          headline: $headline
          contractId: $contractId
          ipAddress: $ipAddress
          key: $key
        }
      }
    ) {
      chat {
        ...chatFragment
      }
    }
  }
`

export const MESSAGE_SUBSCRIPTION = gql`
  subscription ($chatId: UUID!) {
    messages(condition: {chatId: $chatId}, orderBy: INSERTED_AT_ASC) {
      ...messageFragment
    }
  }
  ${messageFragment}
`

export const GET_CONTRACT = gql`
  query ($id: UUID!) {
    contract(id: $id) {
      ...contractFragment
    }
  }
  ${contractFragment}
`

export const GET_MESSAGES = gql`
  query ($chatId: UUID!) {
    messages(condition: {chatId: $chatId}, orderBy: INSERTED_AT_ASC) {
      ...messageFragment
    }
  }
  ${messageFragment}
`

export const GET_CHAT = gql`
  query ($chatId: UUID!) {
    chat(id: $chatId) {
      ...chatFragment
      contract {
        agent {
          id
        }
      }
    }
  }
  ${chatFragment}
`

export const RATE_AGENT = gql`
  mutation createRate($chatId: UUID!, $rating: Int!) {
    createRate(input: {
      rate: { rating: $rating, chatId: $chatId }
    }) {
      rate {
        id
      }
    }
  }
`

export const CREATE_MESSAGE = gql`
  mutation createMessage($text: String!, $author: String!, $chatId: UUID!) {
    createMessage(input: {
      message: {
        text: $text isAgent: false author: $author chatId: $chatId
      }
    }) {
      message {
        ...messageFragment
      }
    }
  }
  ${messageFragment}
`

export const CHAT_STATUS_SUBSCRIPTION = gql`
  subscription ($chatId: UUID!) {
    chat(id: $chatId) {
      ...chatFragment
    }
  }
  ${chatFragment}
`

export const END_CHAT = gql`
  mutation endChat($chatId: UUID!) {
    updateChat(
      input: {
        id: $chatId
        patch: {
          status: FINISHED
        }
      }
    ) {
      chat {
        ...chatFragment
      }
    }
  }
  ${chatFragment}
`

export const GET_WEBSITE_CONTRACTS = gql`
  query GetWebsiteContracts($websiteId: UUID!) {
    website(id: $websiteId) {
      logoUrl
      color
      contracts(condition: {status: "active"}) {
        ...contractFragment
      }
    }
  }
  ${contractFragment}
`

export const UPDATE_CHAT_MISSED = gql`
  mutation UpdateChatMissed($chatId: UUID!) {
    updateChat(input: {
      id: $chatId
      patch: {
        missed: true
      }
    }) {
      chat {
        ...chatFragment
      }
    }
  }
  ${chatFragment}
`
```

### Data Models

#### GraphQL Schema

Based on the queries and mutations, the data models are:

**Chat Model:**
```graphql
type Chat {
  id: UUID!
  key: UUID!
  status: ChatStatus!
  missed: Boolean!
  headline: String!
  ipAddress: InternetAddress
  customerName: String!
  contract: Contract
}
```

**Message Model:**
```graphql
type Message {
  id: UUID!
  text: String!
  author: String!
  isAgent: Boolean!
  insertedAt: DateTime!
  updatedAt: DateTime!
}
```

**Contract Model:**
```graphql
type Contract {
  id: UUID!
  status: String!
  session: Int!
  color: String!
  chatMissTime: Int!
  agent: Agent
}
```

**Agent Model:**
```graphql
type Agent {
  id: UUID!
}
```

#### Transformed Format for Frontend Rendering

**Chat Object:**
```javascript
{
  id: string,
  key: string,
  status: string, // ACTIVE, STARTED, FINISHED
  missed: boolean,
  headline: string,
  ipAddress: string,
  customerName: string,
  contract: {
    id: string,
    status: string,
    session: number,
    color: string,
    chatMissTime: number,
    agent: {
      id: string
    }
  }
}
```

**Message Object:**
```javascript
{
  id: string,
  text: string,
  author: string,
  isAgent: boolean,
  insertedAt: string, // ISO date string
  updatedAt: string // ISO date string
}
```

**Contract Object:**
```javascript
{
  id: string,
  status: string,
  session: number,
  color: string,
  chatMissTime: number
}
```

### Error Handling

#### Loading States

- During initialization: Display "Initializing..." message
- During contract loading: Display loading spinner
- During chat creation: Display "Starting..." message on the button
- During message sending: Button shows loading state

#### Error States

- **Authentication errors**: Display "Authentication error. Please refresh the page and try again."
- **Network errors**: Display "Connection error. Please check your internet connection."
- **No agents available**: Display "No agents are currently available. Please try again later."
- **Chat creation failures**: Display "Failed to start conversation. Please try again."
- **Timeouts**: Display "No agents responded within the expected time. Please try again."
- **Unexpected errors**: Display "An unexpected error occurred. Please try again."

#### Fallback Behavior

- If session-based contract filtering fails, fall back to using all contracts
- If IP address detection fails, proceed with chat creation without IP address
- If time API fails, fall back to local browser time
- If WebSocket connection is lost, Apollo Client automatically attempts to reconnect

### Implementation Details

#### Libraries/Packages

- **Apollo Client**: For GraphQL communication with queries, mutations, and subscriptions
- **Formik**: For form handling in the chat creation flow
- **Moment.js**: For time formatting (imported but not used in the codebase)
- **store2**: For local storage management
- **styled-components**: For component styling
- **graphql-ws**: For WebSocket-based GraphQL subscriptions

#### Styling

- Uses styled-components design system approach from `src/Components/styled/`
- Theme-based styling via props.theme
- Transient props ($) for conditional styling
- Responsive design with media queries for mobile devices

#### Performance

- Uses React.memo for components where appropriate
- Implements proper cleanup for subscriptions and timeouts
- Uses Apollo Client caching for efficient data retrieval
- Implements lazy loading for code splitting where applicable

#### Accessibility

- Form fields have proper labels
- Buttons have aria-label attributes where needed
- Keyboard navigation is supported through form submission with Enter key
- Focus states are managed for form elements

### Dependencies

#### New Dependencies

No new dependencies are required for the identified improvements.

#### Reused Dependencies

- `@apollo/client` version ^3.7.2
- `axios` version ^1.2.1
- `formik` version ^2.2.9
- `graphql` version ^15.8.0
- `graphql-tag` version ^2.12.6
- `graphql-ws` version ^5.11.2
- `jwt-decode` version ^4.0.0
- `moment` version ^2.29.4
- `react` version ^18.2.0
- `react-dom` version ^18.2.0
- `react-router-dom` version ^6.4.5
- `react-textarea-autosize` version ^8.4.0
- `store2` version ^2.14.2
- `styled-components` version ^6.1.19

### Integration Points

The chat widget is designed to be embedded in external websites. The main integration point is through the `widget.js` file which exports an `initChatWidget` function.

Integration snippet:
```javascript
import { initChatWidget } from './widget';

// Initialize the chat widget with configuration
initChatWidget({
  containerId: 'chat-widget-root',
  publicKey: 'your-public-key',
  graphqlHttpUrl: 'http://localhost:5001/graphql',
  graphqlWsUrl: 'ws://localhost:5001/graphql',
  apiUrl: 'http://localhost:5001',
  ipifyUrl: 'https://api.ipify.org?format=json'
});
```

### Theme/Styling Integration

The widget uses theme variables from `src/Components/styled/design-system/theme.js` for consistent styling:

- Colors are accessed through `props.theme.colors.primary`, `props.theme.colors.danger`, etc.
- Spacing values are accessed through `props.theme.spacing.md`, `props.theme.spacing.lg`, etc.
- Border radius values are accessed through `props.theme.radius.md`, `props.theme.radius.lg`, etc.
- Shadows are accessed through `props.theme.shadows.sm`, `props.theme.shadows.md`, etc.
- Typography values are accessed through `props.theme.fontFamily`, `props.theme.fontSize.base`, etc.

All styled components should use these theme variables instead of hardcoded values to ensure consistent styling throughout the widget.

## Task List

Based on the codebase analysis, here is the implementation plan for identified improvements:

### Phase 1: Bug Fixes

- [ ] Fix CSS styling issue in ChatHeader component (font-weight value)
- [ ] Fix variable naming inconsistency in ChatMessage component (imageUrl vs profileImageUrl)
- [ ] Fix error handling in CreateChatFlow component

### Phase 2: Memory Leak Prevention

- [ ] Implement proper cleanup for mediaQuery listener in widget.js
- [ ] Ensure all GraphQL subscriptions are properly unsubscribed in ChatStatusMonitor.js
- [ ] Review and improve cleanup in useEffect hooks in CreateChat.js

### Phase 3: Component Architecture Standardization

- [ ] Convert class components to functional components with hooks
- [ ] Standardize styling approach to use theme variables consistently
- [ ] Improve error handling consistency across components

### Phase 4: Performance Optimization

- [ ] Implement useMemo and useCallback where appropriate
- [ ] Review and optimize component re-renders
- [ ] Ensure efficient use of Apollo Client caching
