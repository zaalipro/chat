# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React-based chat application that allows customers to start conversations with agents through a widget interface. The application uses Apollo Client for GraphQL communication with real-time subscriptions via WebSockets.

## Development Commands

### Primary Commands
- `npm start` - Start development server on port 3006 (sources .env file)
- `npm run build` - Build for production
- `npm test` - Run tests in watch mode
- `npm run eject` - Eject from Create React App (one-way operation)

### Environment Setup
- Copy `.env` file with required environment variables (see Environment Variables section)
- Run `npm install` to install dependencies
- Ensure GraphQL server is running and accessible

## Architecture Overview

### High-Level Structure
This is a React application built on Create React App with the following key architectural patterns:

**State Management**: Local component state + Apollo Client cache for GraphQL data
**Real-time Communication**: GraphQL subscriptions via WebSocket connections
**Authentication**: JWT tokens with automatic login via public key
**Session Management**: Multi-session chat routing based on time zones (Asian, European, American)

### Core Data Flow
1. **Authentication**: App automatically logs in using `REACT_APP_PUBLIC_KEY` via `consumerLogin` mutation
2. **Contract Loading**: Fetches available agent contracts based on website ID and current session
3. **Chat Creation**: Creates chat(s) with available agents, supporting both single and multi-chat modes
4. **Real-time Messaging**: Uses WebSocket subscriptions for live message updates and chat status changes
5. **Session Routing**: Determines agent availability based on UTC time zones and contract sessions

### Key Components

#### **App.js**
- Main application wrapper
- Handles chat state transitions (create chat vs active chat)
- Manages contract fetching and working hours validation
- **Props**: None (root component)
- **State**: `showCreate`, `isOpen`, `showOffline`, `selectedContract`

#### **CreateChat.js**
- Chat creation form and flow management
- Supports both single and multi-agent chat creation
- Manages chat creation states and error handling
- **Props**: `setCreate` function
- **State**: Uses multiple custom hooks for contracts, chat creation, monitoring, and errors
- **Location**: `src/CreateChat.js`

#### **ChatContainer.js**
- Container for active chat interface
- Manages message subscriptions and chat status monitoring
- **Props**: `chat` object from parent
- **State**: `chatEnded` for handling ended chats
- **Location**: `src/ChatContainer.js`

#### **Chat.js**
- Main chat UI component with message list and input
- **Props**: `data` (messages), `chatId`, `subscribeToNewMessages` callback
- **Location**: `src/Chat.js`

#### **MessageForm.js**
- Message input with send functionality
- Handles Enter key for sending, Shift+Enter for new lines
- **Props**: `chatId`
- **State**: `inputHasFocus`, `message`
- **Location**: `src/MessageForm.js`

### GraphQL Integration

#### Key Queries
- `GET_CHAT` - Fetch chat details by ID
- `GET_MESSAGES` - Fetch messages for a chat
- `GET_WEBSITE_CONTRACTS` - Fetch available agent contracts

#### Key Mutations
- `CREATE_CHAT` - Create new chat with agent
- `CREATE_MESSAGE` - Send message in chat
- `END_CHAT` - End active chat
- `RATE_AGENT` - Rate chat experience

#### Key Subscriptions
- `MESSAGE_SUBSCRIPTION` - Real-time message updates
- `CHAT_STATUS_SUBSCRIPTION` - Real-time chat status changes

### Custom Hooks

#### **useContracts** (`src/hooks/useContracts.js`)
- Manages contract loading and session-based filtering
- Handles working hours validation and agent availability

#### **useChatCreation** (`src/hooks/useChatCreation.js`)
- Handles single and multi-chat creation logic
- Manages IP address detection and chat key generation

#### **useChatMonitor** (`src/hooks/useChatMonitor.js`)
- Monitors chat status changes and handles timeouts
- Manages missed chat notifications

#### **useError** (`src/hooks/useError.js`)
- Centralized error handling with user-friendly messages
- Provides retry functionality

### Session Management System

The application implements a timezone-based session system:

- **Session 1**: Asian timezone (00:00-08:00 UTC)
- **Session 2**: European timezone (08:00-16:00 UTC) 
- **Session 3**: American timezone (16:00-24:00 UTC)

Contracts are filtered based on current UTC time to show only agents available in the current session.

### Environment Variables

Required environment variables (create `.env` file):
- `REACT_APP_GRAPHQL_HTTP_URL` - GraphQL HTTP endpoint
- `REACT_APP_GRAPHQL_WS_URL` - GraphQL WebSocket endpoint
- `REACT_APP_PUBLIC_KEY` - Public key for authentication
- `REACT_APP_DEFAULT_CONTRACT_ID` - Fallback contract ID
- `REACT_APP_API_URL` - API base URL for time service
- `REACT_APP_IPIFY_URL` - IP detection service URL

### Styling System

- Uses Semantic UI React for components
- Custom CSS files in `src/css/` directory
- Color theming centered around `rgba(39,175,96,1)` (green theme)
- Responsive design with mobile-first approach

## Important Implementation Details

### Multi-Chat Creation
The application supports creating multiple chats simultaneously with different agents. The `CreateChat.js` component manages this flow:
- Fetches all available contracts for current session
- Creates chats with all available agents
- Monitors all pending chats for responses
- Connects to the first agent that responds

### Real-time Updates
Uses Apollo Client subscriptions for:
- Live message updates in active chats
- Chat status changes (started, ended, missed)
- Agent availability monitoring

### Error Handling
Centralized error handling through `useError` hook with predefined error messages in `src/config/ChatConfig.js`. Provides user-friendly error messages and retry functionality.

### Local Storage Usage
- `activeChat` - Currently active chat object
- `websiteId` - Website identifier from JWT token
- `customerName` - Customer name for messages
- `token` - JWT authentication token
- `contractId` - Fallback contract ID (legacy)

## Development Workflow

### Adding New Features
1. Follow the spec.md workflow: analyze codebase, research best practices
2. Create `.specs/[NN]_[feature_name]_spec.md` file with requirements and design
3. Wait for approval before implementing
4. Use GraphQL for all data operations (no client-side filtering/sorting)
5. Follow existing patterns for component structure and hooks

### Code Quality Guidelines
- Use function components with hooks (avoid class components)
- Implement proper error handling for all async operations
- Add loading states for all data operations
- Follow existing naming conventions and file structure
- Use TypeScript for new components (gradual migration)

### Testing Strategy
- Unit tests for utility functions and hooks
- Integration tests for chat creation and messaging flows
- Error handling scenarios testing
- Multi-browser testing for WebSocket connections

## Common Development Tasks

### Running Single Tests
```bash
npm test -- --testNamePattern="specific test name"
```

### Debugging GraphQL
- Check Network tab for failed queries/mutations
- Monitor WebSocket connection in browser DevTools
- Use Apollo Client DevTools extension
- Check console for GraphQL errors and network issues

### Working with Subscriptions
- Ensure WebSocket URL is correct in environment variables
- Check authentication token is passed to WebSocket connection
- Monitor subscription lifecycle in Apollo DevTools
- Handle subscription cleanup in component unmount

