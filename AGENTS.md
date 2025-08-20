# Agent Guidelines for Kodala App

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
- **Run single test file**: `npm test -- --testPathPattern=ChartHelpers.test.js`
- **Run tests in watch mode**: `npm test -- --watch`
- **Run specific test**: `npm test -- --testNamePattern="converts minutes to hours correctly"`
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
- **Agent features**: `src/Agent/[FeatureName]/`
- **Company features**: `src/Company/[FeatureName]/`
- **Shared components**: `src/Components/`
- **Authentication**: `src/Auth/`

## Code Style Guidelines

### React & JavaScript
- Use functional components with hooks (no class components)
- Prefer `const` arrow functions over `function` declarations
- Use early returns for better readability
- Follow DRY principle - avoid code duplication
- Use descriptive variable names with auxiliary verbs (e.g., `isLoaded`, `hasError`)

### Naming Conventions (Strict)
- **Components**: PascalCase (e.g., `ToastProvider`, `ChatList`)
- **Variables/Functions**: camelCase (e.g., `addToast`, `formatDate`)
- **Event handlers**: Prefix with `handle` (e.g., `handleClick`, `handleSubmit`)
- **GraphQL queries**: Prefix with `use` (e.g., `useSiteMetadata`)
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
- **Primary**: Tailwind CSS utility classes
- **Component library**: DaisyUI for consistent UI components
- **Approach**: Mobile-first responsive design
- **Avoid**: Custom CSS files or inline styles

### Apollo Client & GraphQL
- Use Apollo hooks: `useQuery`, `useMutation`, `useSubscription`
- Separate subscriptions in `subscriptions.js` files
- Use Apollo cache for state management over local state
- Implement proper error handling with Apollo's error policies
- Update cache after mutations when needed

### Authentication & Security
- **JWT Tokens**: Store using `store2` library, decode with `jwt-decode`
- **Role-Based Access**: Check user roles before rendering role-specific content
- **Route Protection**: Use `AgentRoute` and `CompanyRoute` wrappers
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
- Use Jest with React Testing Library
- Test file patterns: `__tests__/*.test.js` or `*.spec.js`
- Focus on behavior testing over implementation details
- Mock external dependencies (API calls, etc.)

## Technology Stack
- **React 18** with functional components and hooks
- **Apollo Client** for GraphQL operations
- **Tailwind CSS + DaisyUI** for styling
- **Formik** for forms with validation schemas
- **React Router v5** with role-based protection
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
- **Gemini Guidelines**: Follow `GEMINI.md` for spec-driven development
- **Kiro Steering**: Follow `.kiro/steering/` documents for tech and structure
- **Date Handling**: Always use `moment` library
- **HTTP Requests**: Use `axios` only for non-GraphQL API calls
