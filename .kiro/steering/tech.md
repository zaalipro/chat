# Technology Stack

## Framework & Build System
- **React 18.2.0** - Main frontend framework
- **Create React App** - Build system and development server
- **Node.js** - Runtime environment

## Key Libraries
- **Apollo Client 3.7.2** - GraphQL client with caching and subscriptions
- **GraphQL** - API query language with WebSocket subscriptions
- **Semantic UI React** - Primary UI component library
- **Formik** - Form handling and validation
- **Moment.js** - Date/time manipulation
- **Axios** - HTTP client for REST API calls
- **React Router DOM** - Client-side routing
- **Store2** - Local storage management
- **Classnames** - Conditional CSS class handling

## Development Commands
```bash
# Start development server (runs on port 3006)
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (irreversible)
npm run eject
```

## Backend Integration
- **GraphQL Endpoint**: `http://localhost:5001/graphql`
- **WebSocket Endpoint**: `ws://localhost:5001/graphql`
- **REST API**: Uses `REACT_APP_API_URL` environment variable
- **Authentication**: Token-based auth stored in local storage