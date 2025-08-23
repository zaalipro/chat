---
inclusion: always
---

# Technology Stack & Development Rules

## Core Technologies
- **React 18.2.0** with functional components and hooks only
- **Apollo Client 3.7.2** for GraphQL operations and caching
- **Create React App** build system (port 3006)
- **Semantic UI React** for UI components

## GraphQL Patterns
- All queries/mutations/subscriptions in `src/queries.js`
- Use `subscribeToMore` for real-time updates
- Implement optimistic updates for immediate UI feedback
- Handle WebSocket connections at `ws://localhost:5001/graphql`
- Always include error handling for GraphQL operations

## React Development Rules
- Functional components only - no class components
- Use custom hooks for complex state logic
- Destructure props in function signatures
- Default exports for main components
- Import order: external libraries, then internal (absolute paths from src/)

## State Management
- Local state with `useState` for component-specific data
- Apollo Client cache for GraphQL data
- `store2` for local storage persistence
- Custom hooks for shared state logic
- Avoid prop drilling - use context or hooks

## Development Workflow
- Development server: `npm start` (port 3006)
- GraphQL endpoint: `http://localhost:5001/graphql`
- Environment variables via `REACT_APP_` prefix
- Token-based auth stored in local storage

## Required Libraries
- **Apollo Client** - GraphQL client with subscriptions
- **Formik** - Form handling and validation
- **Moment.js** - Date/time operations
- **Store2** - Local storage management
- **Classnames** - Conditional CSS classes

## Performance Requirements
- Use `useMemo`/`useCallback` for expensive operations
- Clean up subscriptions and effects
- Implement lazy loading where appropriate
- Maintain responsive design for widget embedding