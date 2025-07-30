# Project Structure

## Root Directory
- `package.json` - Dependencies and scripts
- `public/` - Static assets (favicon, manifest, index.html)
- `src/` - Source code

## Source Organization

### Main Application Files
- `src/index.js` - Application entry point with Apollo Client setup
- `src/App.js` - Root component with chat state management
- `src/queries.js` - All GraphQL queries, mutations, and subscriptions

### Core Components
- `src/ChatContainer.js` - Main chat wrapper with message subscriptions
- `src/Chat.js` - Chat message display and real-time updates
- `src/ChatHeader.js` - Chat header with end chat functionality
- `src/CreateChat.js` - New chat creation form
- `src/MessageBox.js` - Individual message display
- `src/MessageForm.js` - Message input form

### Reusable Components (`src/Components/`)
- `Query.js` - Apollo Query wrapper with loading/error states
- `TextField.js` - Text input field component
- `TextAreaField.js` - Textarea input component
- `NumberField.js` - Number input component

### Utilities
- `src/utils.js` - Helper functions (time formatting, working hours validation)
- `src/serviceWorker.js` - PWA service worker registration

### Styling (`src/css/`)
- Component-specific CSS files following naming convention
- `App.css` - Global utility classes and layout styles
- `index.css` - Base body styles

## Architecture Patterns

### State Management
- Local component state with React hooks
- Global state via `store2` local storage
- Apollo Client cache for GraphQL data

### Data Flow
- GraphQL subscriptions for real-time updates
- Mutation-based state changes
- Local storage for session persistence

### Component Structure
- Functional components with hooks
- Query components wrap data-dependent UI
- Separation of container and presentational components