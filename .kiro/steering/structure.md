---
inclusion: always
---

# Project Structure & Conventions

## Directory Organization

### Root Structure
- `src/` - All source code
- `public/` - Static assets (favicon, manifest)
- `.kiro/` - Kiro configuration and steering
- `.specs/` - Feature specifications

### Source Organization
```
src/
├── index.js              # App entry point with Apollo Client
├── App.js                # Root component with chat state
├── queries.js            # All GraphQL queries/mutations/subscriptions
├── Components/           # Reusable UI components
│   ├── styled/          # Styled-components design system
│   └── [ComponentName].js
├── constants/           # Application constants and enums
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── config/             # Configuration files
```

## Coding Conventions

### Component Patterns
- **Functional components only** - Use React hooks, no class components
- **PascalCase naming** - `ChatContainer.js`, `MessageForm.js`
- **Single responsibility** - One component per file
- **Props destructuring** - Destructure props in function signature
- **Default exports** - Use default export for main component

### Styled Components Architecture
- **Design system approach** - Use `src/Components/styled/DesignSystem.js`
- **Theme-based styling** - Access theme via `props.theme`
- **Transient props** - Use `$` prefix for styled-only props (`$primary`, `$active`)
- **Component co-location** - Styled components in same file or dedicated styled folder
- **Responsive design** - Mobile-first approach with theme breakpoints

### Import/Export Patterns
```javascript
// External libraries first
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';

// Internal imports - absolute paths from src/
import { CHAT_STATUS } from '../constants/chatStatus';
import { useChatMonitor } from '../hooks/useChatMonitor';
import { Button, Container } from '../Components/styled/DesignSystem';

// Default export at bottom
export default ComponentName;
```

### Constants & Enums
- **UPPER_SNAKE_CASE** - `CHAT_STATUS.ACTIVE`
- **Centralized location** - `src/constants/` directory
- **Enum objects** - Use objects for related constants
- **Helper functions** - Include display/utility functions with constants

### Custom Hooks
- **Prefix with `use`** - `useChatMonitor`, `useChatCreation`
- **Single concern** - Each hook handles one specific functionality
- **Return objects** - Return named object properties, not arrays
- **Error handling** - Include error states and handlers
- **Cleanup** - Provide reset/cleanup functions when needed

### State Management Patterns
- **Local state first** - Use `useState` for component-specific state
- **Custom hooks** - Extract complex state logic into custom hooks
- **Apollo Client cache** - For GraphQL data and optimistic updates
- **Local storage** - Use `store2` for session persistence
- **Avoid prop drilling** - Use context or custom hooks for deep state

### GraphQL Conventions
- **Centralized queries** - All queries in `src/queries.js`
- **UPPER_SNAKE_CASE** - Query/mutation names: `CREATE_MESSAGE`
- **Subscription handling** - Use `subscribeToMore` for real-time updates
- **Error boundaries** - Wrap GraphQL operations with error handling
- **Optimistic updates** - Use for immediate UI feedback

### File Naming
- **Components** - PascalCase: `ChatContainer.js`
- **Hooks** - camelCase with `use` prefix: `useChatMonitor.js`
- **Utilities** - camelCase: `chatUtils.js`
- **Constants** - camelCase: `chatStatus.js`
- **Styled components** - PascalCase: `DesignSystem.js`

### Error Handling
- **Try-catch blocks** - Wrap async operations
- **Error boundaries** - Use React error boundaries for component errors
- **User feedback** - Show meaningful error messages
- **Logging** - Use `console.error` for debugging
- **Graceful degradation** - Provide fallback UI states

### Performance Considerations
- **Memoization** - Use `useMemo`/`useCallback` for expensive operations
- **Lazy loading** - Dynamic imports for code splitting
- **Subscription cleanup** - Always clean up subscriptions
- **Debouncing** - For user input and API calls
- **Bundle optimization** - Keep styled-components tree-shakeable

## Architecture Guidelines

### Component Hierarchy
1. **Container components** - Handle data fetching and state
2. **Presentational components** - Pure UI components
3. **Styled components** - Theme-aware styling
4. **Utility components** - Reusable UI patterns

### Data Flow
1. **GraphQL subscriptions** - Real-time chat updates
2. **Apollo Client cache** - Centralized data management
3. **Local storage** - Session persistence
4. **Component state** - UI-specific state

### Widget Embedding
- **Isolated styles** - Prevent CSS conflicts with host sites
- **Responsive design** - Adapt to different screen sizes
- **Z-index management** - Proper layering for modals/overlays
- **Event handling** - Prevent event bubbling to host page