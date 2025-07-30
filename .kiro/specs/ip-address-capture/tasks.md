# Implementation Plan

- [x] 1. Create IP detection utility function
  - Implement `detectIPAddress` function in `src/utils.js` with 3-second timeout
  - Use `https://api.ipify.org?format=json` as the IP detection service
  - Add error handling for network failures, timeouts, and invalid responses
  - Return null on any failure to ensure non-blocking behavior
  - Include console logging for IP detection failures
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Update CREATE_CHAT GraphQL mutation
  - Modify the CREATE_CHAT mutation in `src/queries.js` to accept optional `ipAddress` parameter
  - Ensure the mutation remains backward compatible with existing functionality
  - _Requirements: 1.2, 1.3_

- [x] 3. Enhance CreateChat component with IP detection
  - Import and call `detectIPAddress` function in `src/CreateChat.js`
  - Integrate IP detection into the chat creation flow before mutation execution
  - Pass detected IP address to CREATE_CHAT mutation
  - Ensure chat creation proceeds regardless of IP detection success/failure
  - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2, 3.3, 3.4_
