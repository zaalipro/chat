---
inclusion: always
---

# Product Overview

This is an embeddable real-time chat widget that enables customer support conversations between website visitors and support agents. The widget connects customers to contract-based agents through a GraphQL backend with WebSocket subscriptions for real-time messaging.

## Core Product Concepts

### Contracts & Agents
- **Contracts**: Business entities that define agent groups and availability
- **Agents**: Support representatives assigned to specific contracts
- **Multi-contract Support**: Single widget can route to different agent pools based on configuration

### Chat Lifecycle
1. **Chat Creation**: Customer initiates chat through embedded widget
2. **Agent Assignment**: System routes to available agents based on contract and working hours
3. **Active Chat**: Real-time messaging with WebSocket subscriptions
4. **Chat Completion**: Agent or customer ends the conversation
5. **Rating**: Optional post-chat feedback collection

### Session Management
- **Working Hours**: Contract-specific availability windows
- **Offline Detection**: Automatic handling when agents are unavailable
- **Session Persistence**: Chat state maintained across page refreshes

## User Experience Principles

### Widget Behavior
- **Non-intrusive**: Minimal footprint when embedded on client websites
- **Responsive**: Adapts to mobile and desktop environments
- **Accessible**: Keyboard navigation and screen reader support
- **Fast Loading**: Optimized for quick initialization

### Chat Experience
- **Real-time**: Instant message delivery and typing indicators
- **Reliable**: Graceful handling of connection issues
- **Contextual**: Maintains conversation history and state
- **Professional**: Clean, branded interface suitable for business use

## Business Rules

### Availability Logic
- Respect contract-specific working hours
- Show offline state when no agents available
- Prevent chat creation outside business hours

### Message Handling
- All messages must be persisted to backend
- Support text messages and basic formatting
- Maintain message order and timestamps

### Rating System
- Optional post-chat rating (1-5 stars)
- Collect feedback only after chat completion
- Store ratings for analytics and agent performance

## Integration Considerations

### Embedding
- Widget must work across different websites and domains
- Minimal CSS conflicts with host site styles
- Configurable appearance and positioning
- Support for multiple instances per page

### Performance
- Lazy loading of chat interface
- Efficient WebSocket connection management
- Minimal bundle size for fast page loads
- Graceful degradation for older browsers