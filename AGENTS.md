# Agent Guidelines for Chat Widget App

## Development Workflow
```bash
npm start          # Development server (always run this first)
npm test           # Run before committing changes
npm run build      # Test production build before deployment
```

## Build, Lint, and Test Commands

### Development
- **Start dev server**: `npm start`
- **Build for production**: `npm run build`

### Testing
- **Run all tests**: `npm test`
- **Run single test file**: `npm test -- --testPathPattern=ChatHelpers.test.js`
- **Run tests in watch mode**: `npm test -- --watch`
- **Run specific test**: `npm test -- --testNamePattern="handles message submission correctly"`
- **Run tests with coverage**: `npm test -- --coverage`

### Linting
- **ESLint**: Configured via `eslintConfig` in package.json
- **Run linting**: `npx eslint src/`
- **Fix linting issues**: `npx eslint src/ --fix`

## Core Architecture & Patterns

### Spec-Driven Development
- **CRITICAL**: Always read `.specs/spec.md` before producing any code
- Generate `.specs/[NN]_[feature_name]_spec.md` files for new features
- Wait for user approval before implementing code
- Never use client-side filtering/sorting - use GraphQL queries

### MCP-Focused Workflow
- Always use context7 MCP to fetch live documentation
- Always use Sequential Thinking MCP to breakdown of complex problems

### Container/Component Pattern
- **Containers**: Handle GraphQL operations, pass data as props (`Container.js`)
- **Components**: Pure UI logic, receive data via props
- **File Structure**: Each feature must have `Container.js`, `queries.js`, `index.js`
- **GraphQL Files**: `queries.js`, `mutations.js`, `subscriptions.js` (separate subscriptions)

### Feature Organization
- **Chat features**: `src/` (main directory for chat components)
- **Shared components**: `src/Components/`
- **Styled components**: `src/Components/styled/`
- **Authentication**: Handled in `src/widget.js` and `src/App.js`

## Code Style Guidelines

### React & JavaScript
- Use functional components with hooks (no class components)
- Prefer `const` arrow functions over `function` declarations
- Use early returns for better readability
- Follow DRY principle - avoid code duplication
- Use descriptive variable names with auxiliary verbs (e.g., `isLoaded`, `hasError`)

### Naming Conventions (Strict)
- **Components**: PascalCase (e.g., `ChatContainer`, `MessageForm`)
- **Variables/Functions**: camelCase (e.g., `sendMessage`, `formatDate`)
- **Event handlers**: Prefix with `handle` (e.g., `handleClick`, `handleSubmit`)
- **GraphQL queries**: Prefix with `use` (e.g., `useGetChat`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants
- **Files**: PascalCase for components, camelCase for utilities
- **Containers**: Always `Container.js`
- **Export barrels**: `index.js`

### Imports & Exports
- Use index.js export barrels: `export { default } from './Container'`
- Prefer named exports over default exports
- Group imports: React, third-party libraries, internal components, utilities
- Use absolute imports when possible

### Styling
- **Primary**: Styled Components with design system
- **Component library**: Custom design system in `src/Components/styled/design-system/`
- **Approach**: Mobile-first responsive design
- **Scoping**: All CSS is automatically scoped with `.chat-widget` prefix

### Apollo Client & GraphQL
- Use Apollo hooks: `useQuery`, `useMutation`, `useSubscription`
- Separate subscriptions in `subscriptions.js` files
- Use Apollo cache for state management over local state
- Implement proper error handling with Apollo's error policies
- Update cache after mutations when needed

### Authentication & Security
- **JWT Tokens**: Store using `store2` library, decode with `jwt-decode`
- **Widget Initialization**: Use `initChatWidget` function with config object
- Never commit secrets or API keys
- Validate and sanitize user inputs

### Accessibility
- Include `aria-label`, `tabindex="0"` for interactive elements
- Implement keyboard navigation (`onKeyDown`)
- Ensure sufficient color contrast
- Add screen reader support

### Error Handling
- Use try-catch blocks for async operations
- Provide meaningful error messages
- Handle loading and error states in components
- Validate inputs and provide user feedback
- Use error boundaries for components that might fail

### Testing
- Write tests for utility functions and complex logic
- Use Vitest with React Testing Library
- Test file patterns: `__tests__/*.test.js` or `*.spec.js`
- Focus on behavior testing over implementation details
- Mock external dependencies (API calls, etc.)

## Technology Stack
- **React 18** with functional components and hooks
- **Apollo Client** for GraphQL operations
- **Styled Components** for styling with design system
- **Vite** for build tool and development server
- **Formik** for forms with validation schemas
- **React Router v6** for routing
- **GraphQL subscriptions** with `graphql-ws` transport
- **JWT authentication** with `store2` and `jwt-decode`

## Performance Guidelines
- Use `useCallback` and `useMemo` for expensive operations
- Use React.memo for expensive components
- Configure appropriate Apollo fetch policies
- Clean up subscriptions in useEffect cleanup
- Avoid importing entire libraries when tree-shaking is available

## Integration Rules
- **Cursor Rules**: Follow `.cursor/rules/reactrules.mdc`
- **Kiro Steering**: Follow `.kiro/steering/` documents for tech and structure
- **Date Handling**: Always use `moment` library
- **HTTP Requests**: Use `axios` only for non-GraphQL API calls

## Widget-Specific Guidelines

### Widget Initialization
- Use `ChatWidget.initChatWidget(config)` to initialize the widget
- Config object should include:
  - `publicKey`: Your public API key
  - `graphqlHttpUrl`: GraphQL HTTP endpoint
  - `graphqlWsUrl`: GraphQL WebSocket endpoint
  - Optional: `containerId`, `companyLogoUrl`, `apiUrl`, `ipifyUrl`

### Embedding Options
- **UMD Build**: For simple browser globals embedding
- **ES Module Build**: For modern applications using ES modules
- **Legacy Embed Script**: For backward compatibility

### CSS Scoping
- All widget CSS is automatically scoped with `.chat-widget` prefix
- This prevents conflicts with host website styles
- Do not remove or modify the scoping mechanism

### Responsive Design
- Widget is responsive by default
- Mobile view automatically adjusts to full screen on small devices
- Desktop view uses fixed 400px width and 700px height

### Environment Variables
- Supports both Vite (`VITE_`) and Create React App (`REACT_APP_`) prefixes
- Environment variables are mapped in `vite.config.js` for backward compatibility