# Implementation Plan

- [x] 1. Update App.js to use websiteId instead of contractId
  - Replace `store('contractId')` with `store('websiteId')` in App.js
  - Replace `GET_CONTRACT` query with `GET_WEBSITE_CONTRACTS` query
  - Update query variables to pass websiteId instead of contractId
  - _Requirements: 2.1, 2.2_

- [x] 2. Implement contract processing logic in App.js
  - Add state variables for `availableContracts` and `selectedContract`
  - Create `processContracts` function that uses `processContractsForCurrentSession()` utility
  - Implement contract selection logic using `selectContract()` utility
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 3. Update working hours validation logic
  - Modify `checkWorkingHours` function to handle multiple contracts instead of single contract
  - Replace single contract session check with multiple contract availability check
  - Update offline state logic to consider all contracts for current session
  - _Requirements: 1.3, 1.4, 3.3, 3.4_

- [x] 4. Update CreateChat component integration
  - Modify CreateChat component call to pass `selectedContract` instead of `data.contract`
  - Ensure contract object structure remains compatible with CreateChat expectations
  - Handle null/undefined selectedContract state gracefully
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 5. Add error handling for missing websiteId and empty contracts
  - Add validation check for websiteId existence before making GraphQL query
  - Handle empty contracts array scenario by showing offline state
  - Add error logging for debugging contract fetching issues
  - _Requirements: 2.3, 4.4_
