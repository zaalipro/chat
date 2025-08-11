# Design Document

## Overview

This design modifies the App.js component to support dynamic contract switching based on websiteId instead of contractId. The system will fetch all active contracts for a website and determine availability based on current working hours across multiple contracts. This enables more flexible contract management where websites can have multiple contract sessions running simultaneously.

## Architecture

### Current State
- App.js fetches a single contract using `GET_CONTRACT` query with `contractId` from local storage
- Working hours validation is performed on a single contract's session
- Offline status is determined by one contract's availability

### New State
- App.js fetches all active contracts using `GET_WEBSITE_CONTRACTS` query with `websiteId` from local storage
- Working hours validation considers all active contracts for the current session
- Offline status is determined by whether any contract is available for the current time

### Data Flow Changes
1. **Initialization**: Use existing `websiteId` from local storage instead of `contractId`
2. **Contract Fetching**: Use `GET_WEBSITE_CONTRACTS` to get all active contracts for the website
3. **Session Analysis**: Determine current session using existing `getCurrentSession()` utility
4. **Contract Filtering**: Filter contracts by current session using `getContractsForSession()`
5. **Availability Check**: Show online if any contracts are available, offline if none
6. **Contract Selection**: Select appropriate contract for CreateChat component using `selectContract()`

## Components and Interfaces

### Modified Components

#### App.js
**Changes:**
- Replace `contractId` with `websiteId` from local storage
- Replace `GET_CONTRACT` query with `GET_WEBSITE_CONTRACTS`
- Add contract processing logic using existing utility functions
- Modify `checkWorkingHours` function to handle multiple contracts

**New State Variables:**
```javascript
const [availableContracts, setAvailableContracts] = useState([])
const [selectedContract, setSelectedContract] = useState(null)
```

**New Functions:**
```javascript
const processContracts = async (allContracts) => {
  const sessionContracts = await processContractsForCurrentSession(allContracts)
  setAvailableContracts(sessionContracts)
  setSelectedContract(selectContract(sessionContracts))
  return sessionContracts.length > 0
}

const checkWorkingHours = async (allContracts) => {
  const hasAvailableContracts = await processContracts(allContracts)
  setOffline(!hasAvailableContracts)
}
```

### Existing Components (No Changes Required)
- **CreateChat**: Will receive `selectedContract` instead of `data.contract`
- **ChatContainer**: No changes needed
- **Rate**: No changes needed
- **Offline**: No changes needed

### Query Interface

#### GET_WEBSITE_CONTRACTS (Already Exists)
```graphql
query GetWebsiteContracts($websiteId: UUID!) {
  website(id: $websiteId) {
    contracts(condition: {status: "active"}) {
      id
      session
      status
      color
      chatMissTime
    }
  }
}
```

**Note:** The query already includes `condition: {status: "active"}` which filters contracts at the GraphQL level, ensuring only active contracts are returned. This eliminates the need for client-side filtering by status.

**Response Structure:**
```javascript
{
  website: {
    contracts: [
      {
        id: "uuid",
        session: 1|2|3,
        status: "active", // Always "active" due to GraphQL filtering
        color: "string",
        chatMissTime: number
      }
    ]
  }
}
```

## Data Models

### Contract Model (Unchanged)
```javascript
{
  id: UUID,
  session: number, // 1, 2, or 3
  status: string,  // Always "active" due to GraphQL filtering
  color: string,
  chatMissTime: number
}
```

### Local Storage Usage
**Current:**
```javascript
store('contractId') // UUID of single contract (currently used)
store('websiteId')  // UUID of website (already available, set at line 105)
```

**Change:**
- Replace usage of `store('contractId')` with `store('websiteId')` in App.js
- No changes needed to local storage setup since `websiteId` is already available

## Error Handling

### Missing websiteId
- **Scenario**: No websiteId in local storage
- **Handling**: Show error message or fallback to offline state
- **Implementation**: Check for websiteId existence before making query

### Query Failures
- **Scenario**: GET_WEBSITE_CONTRACTS query fails
- **Handling**: Show offline state with error indication
- **Implementation**: Use Query component's error handling

### No Active Contracts
- **Scenario**: Website has no active contracts
- **Handling**: Show offline state
- **Implementation**: Check if contracts array is empty

### Time API Failures
- **Scenario**: getCurrentTime() API call fails
- **Handling**: Fallback to local browser time
- **Implementation**: Already handled in existing getCurrentSession() utility

## Testing Strategy

### Unit Tests
1. **Contract Processing Logic**
   - Test `processContractsForCurrentSession()` with various contract arrays
   - Test session filtering with different time scenarios
   - Test contract selection logic

2. **Working Hours Validation**
   - Test availability detection with multiple contracts
   - Test edge cases (no contracts, all inactive, mixed sessions)

3. **Error Handling**
   - Test missing websiteId scenarios
   - Test query failure handling
   - Test empty contract responses

### Integration Tests
1. **App Component Behavior**
   - Test contract fetching and processing flow
   - Test offline/online state transitions
   - Test CreateChat component integration

2. **GraphQL Integration**
   - Test GET_WEBSITE_CONTRACTS query execution
   - Test query variable passing
   - Test response data processing

### Manual Testing Scenarios
1. **Multiple Active Contracts**
   - Website with contracts in different sessions
   - Verify correct availability detection

2. **Session Transitions**
   - Test behavior during session boundary times
   - Verify smooth transitions between availability states

3. **Error Conditions**
   - Test with invalid websiteId
   - Test with network failures
   - Test with malformed contract data

## Implementation Considerations

### Backward Compatibility
- Maintain existing contract object structure for child components
- Ensure CreateChat receives contract in expected format
- Preserve existing error handling patterns

### Performance
- Minimize re-renders by using appropriate state management
- Cache contract processing results when possible
- Avoid unnecessary API calls during component updates

### User Experience
- Smooth transitions between online/offline states
- Clear error messages for failure scenarios
- Consistent behavior across different contract configurations

### Future Extensibility
- Design allows for additional contract filtering criteria
- Structure supports future multi-contract features
- Utility functions can be reused for other components