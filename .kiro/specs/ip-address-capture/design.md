# IP Address Capture Design Document

## Overview

This feature implements automatic IP address detection and capture during chat creation. The system will detect the client's IP address on the frontend using a third-party service, include it in the CREATE_CHAT GraphQL mutation, and store it in the existing PostgreSQL database column. The design prioritizes reliability and non-blocking behavior to ensure chat functionality remains unaffected if IP detection fails.

## Architecture

### High-Level Flow
1. User initiates chat creation through the CreateChat component
2. IP address detection service is called asynchronously with a 3-second timeout
3. CREATE_CHAT mutation is executed with or without the detected IP address
4. Backend stores the IP address in the existing `ipAddress` column
5. Chat creation proceeds normally regardless of IP detection success/failure

### Design Decisions

**Third-Party IP Detection Service**: Using `https://api.ipify.org?format=json` for IP detection because:
- Reliable and widely used service
- Simple JSON response format
- HTTPS support for security
- No API key required for basic usage

**Non-Blocking Implementation**: IP detection runs with a timeout to ensure:
- Chat creation is never delayed beyond 3 seconds
- User experience remains seamless
- System remains functional if IP service is unavailable

**Frontend Detection**: IP detection occurs on the frontend rather than backend because:
- Captures the actual client IP address (not proxy/load balancer IP)
- Reduces backend complexity
- Allows for graceful fallback handling

## Components and Interfaces

### Frontend Components

#### CreateChat Component Enhancement
- **Location**: `src/CreateChat.js`
- **Modifications**: 
  - Add IP detection service call
  - Implement timeout mechanism
  - Update CREATE_CHAT mutation to include IP address
  - Handle IP detection errors gracefully

#### IP Detection Service
- **Location**: `src/utils.js` (new function)
- **Interface**:
  ```javascript
  async function detectIPAddress(timeout = 3000): Promise<string | null>
  ```
- **Behavior**:
  - Makes HTTP request to IP detection service
  - Returns IP address string on success
  - Returns null on failure or timeout
  - Implements proper error handling

### Backend Integration

#### GraphQL Mutation Update
- **Mutation**: `CREATE_CHAT`
- **Location**: Backend GraphQL schema (referenced in `src/queries.js`)
- **Enhancement**: Accept optional `ipAddress` parameter
- **Database**: Store in existing `ipAddress` column in PostgreSQL

## Data Models

### Chat Creation Request
```javascript
{
  // existing fields...
  ipAddress?: string | null  // Optional IP address field
}
```

### IP Detection Response
```javascript
{
  ip: string  // IPv4 or IPv6 address
}
```

## Error Handling

### IP Detection Failures
1. **Network Timeout**: After 3 seconds, proceed with null IP address
2. **Service Unavailable**: Catch HTTP errors and proceed with null IP address
3. **Invalid Response**: Handle malformed JSON responses gracefully
4. **Network Errors**: Handle connection failures without blocking chat creation

### User Experience
- No error messages shown to users for IP detection failures
- Chat creation proceeds normally in all failure scenarios
- Loading states remain unchanged (no additional loading indicators)

### Logging
- Log IP detection failures for monitoring purposes
- Do not expose IP detection errors to the user interface

## Testing Strategy

### No Unit Testing
- We dont follow testing approach, so no need to write any tests at all