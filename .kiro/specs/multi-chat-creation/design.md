# Design Document

## Overview

The multi-chat creation feature transforms the single chat creation process into a multi-agent approach that creates simultaneous chats with all available agents in the current session and connects the customer to the first agent who responds. This design leverages the existing dynamic contract switching infrastructure to fetch active contracts and creates a race condition between agents to provide the fastest response time.

## Architecture

The feature will be implemented by enhancing the existing `CreateChat.js` component with new states and logic while maintaining backward compatibility. The implementation will use:

1. **Multi-Chat Creation Manager**: Logic to create multiple chats simultaneously
2. **Chat Status Monitor**: Real-time monitoring of all created chats using GraphQL subscriptions
3. **Agent Response Handler**: Logic to handle the first agent response and activate that chat
4. **Timeout Manager**: System to mark chats as missed after chatMissTime expires
5. **Loading State Component**: UI to show waiting state with appropriate messaging

## Components and Interfaces

### Enhanced CreateChat Component States
```javascript
const [chatCreationState, setChatCreationState] = useState('form') // 'form', 'creating', 'waiting', 'connected'
const [pendingChats, setPendingChats] = useState([])
const [activeContracts, setActiveContracts] = useState([])
const [chatTimeouts, setChatTimeouts] = useState({})
```

### New GraphQL Mutations
```graphql
mutation UpdateChatMissed($chatId: UUID!) {
  updateChat(input: {
    id: $chatId
    patch: {
      missed: true
    }
  }) {
    chat {
      id
      missed
    }
  }
}
```

### Multi-Chat Creation Service
```javascript
const createMultipleChats = async (contracts, formData, ipAddress) => {
  const chatPromises = contracts.map(contract => 
    createChat({
      variables: {
        customerName: formData.customerName,
        headline: formData.headline,
        contractId: contract.id,
        ipAddress: ipAddress
      }
    })
  )
  
  return Promise.allSettled(chatPromises)
}
```

### Chat Status Monitor
```javascript
const ChatStatusMonitor = ({ chatIds, onChatStarted, onChatMissed }) => {
  // Uses CHAT_STATUS_SUBSCRIPTION for each chat
  // Monitors for status changes to "started"
  // Handles timeout logic for chatMissTime
}
```

## Data Models

### Enhanced Chat Creation Flow
```typescript
interface ChatCreationState {
  state: 'form' | 'creating' | 'waiting' | 'connected'
  pendingChats: PendingChat[]
  activeContracts: Contract[]
  selectedChat?: Chat
}

interface PendingChat {
  id: string
  contractId: string
  status: string
  createdAt: Date
  timeoutId?: NodeJS.Timeout
}

interface Contract {
  id: string
  session: number
  status: string
  color: string
  chatMissTime: number
}
```

### Chat Timeout Management
```typescript
interface ChatTimeout {
  chatId: string
  contractId: string
  timeoutId: NodeJS.Timeout
  missTime: number
}
```

## User Interface Design

### Loading State Component
```jsx
const WaitingForAgent = ({ pendingChatsCount, onCancel }) => (
  <div className="waiting-for-agent">
    <Dimmer active>
      <Loader>Waiting for agent response</Loader>
    </Dimmer>
    <div className="waiting-info">
      <p>Connecting to {pendingChatsCount} available agents...</p>
      <Button onClick={onCancel}>Cancel</Button>
    </div>
  </div>
)
```

### Enhanced Form Submission Flow
1. **Form State**: Normal form with customer name and headline
2. **Creating State**: Brief loading while creating multiple chats
3. **Waiting State**: "Waiting for agent response" with chat count and cancel option
4. **Connected State**: Transition to normal chat interface

## Implementation Flow

### Phase 1: Multi-Chat Creation
1. On form submission, fetch active contracts for current session
2. Create multiple chats simultaneously using Promise.allSettled
3. Handle partial failures gracefully
4. Transition to waiting state

### Phase 2: Real-time Monitoring
1. Subscribe to CHAT_STATUS_SUBSCRIPTION for each created chat
2. Monitor for status changes to "started"
3. Set up timeout handlers for each chat based on contract.chatMissTime
4. Handle the first "started" status by setting activeChat

### Phase 3: Timeout and Miss Handling
1. Start timeout for each chat based on contract.chatMissTime
2. When timeout expires, call UPDATE_CHAT_MISSED mutation
3. Continue monitoring even after marking as missed
4. Clean up timeouts when chat becomes active or component unmounts

### Phase 4: Agent Response Handling
1. When first chat status becomes "started", immediately:
   - Set that chat as activeChat in localStorage
   - Create initial message for that chat
   - Clean up all subscriptions and timeouts
   - Transition to normal chat interface
   - Call setCreate(false) to hide create form

## Error Handling

### Network Failures
- **Partial Chat Creation Failures**: Continue with successfully created chats
- **Subscription Failures**: Implement retry logic with exponential backoff
- **Timeout Mutation Failures**: Log error but continue monitoring

### Edge Cases
- **No Active Contracts**: Show offline component
- **All Chat Creations Fail**: Show error message with retry option
- **Component Unmount During Waiting**: Clean up all subscriptions and timeouts
- **Multiple Agents Respond Simultaneously**: Use first response, ignore others

### Fallback Mechanisms
- **Single Contract Available**: Behave like current single chat creation
- **Contract Fetching Fails**: Fall back to current contractId from localStorage
- **Subscription Failures**: Implement polling fallback every 2 seconds

## Performance Considerations

### Subscription Management
- Use single subscription per chat to avoid overwhelming the client
- Clean up subscriptions immediately when no longer needed
- Implement subscription pooling if many chats are created

### Memory Management
- Clear timeout handlers when chats become active
- Remove event listeners on component unmount
- Avoid memory leaks from pending promises

### Network Optimization
- Batch chat creation requests when possible
- Use efficient GraphQL subscription patterns
- Implement connection retry logic for reliability

## Integration Points

### Existing Components
- **App.js**: No changes required, will receive activeChat as usual
- **ChatContainer**: Works normally once activeChat is set
- **Offline Component**: Used when no active contracts available

### localStorage Integration
- Maintains same structure: `activeChat`, `customerName`
- Temporary storage for `pendingChats` during waiting state
- Clean up temporary data when chat is selected

### Dynamic Contract Switching
- Leverages existing contract fetching infrastructure
- Uses `getCurrentSession()` and contract filtering functions
- Integrates with existing session-based contract management

The implementation maintains full backward compatibility while providing significant user experience improvements through faster agent connection times.