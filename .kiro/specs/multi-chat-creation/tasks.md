# Implementation Plan

- [x] 1. Add UPDATE_CHAT_MISSED mutation to queries.js
  - Create GraphQL mutation to mark chats as missed
  - Include proper input parameters for chatId and missed status
  - _Requirements: 2.6, 2.7_

- [x] 2. Create utility functions for multi-chat management
  - Add getActiveContractsForCurrentSession function to utils.js
  - Create createMultipleChats helper function
  - Add timeout management utilities for chat miss handling
  - _Requirements: 1.1, 1.2_

- [x] 3. Create WaitingForAgent loading component
  - Build loading component with "Waiting for agent response" message
  - Add pending chat count display
  - Include cancel functionality for user to abort waiting
  - Style component to match existing design system
  - _Requirements: 1.3, 3.4_

- [x] 4. Create ChatStatusMonitor component for real-time monitoring
  - Build component that subscribes to CHAT_STATUS_SUBSCRIPTION for multiple chats
  - Implement logic to detect when any chat status changes to "started"
  - Add timeout handling to mark chats as missed after chatMissTime
  - Include cleanup logic for subscriptions and timeouts
  - _Requirements: 2.1, 2.2, 2.6, 2.7, 3.5_

- [x] 5. Enhance CreateChat component with multi-chat state management
  - Add new state variables for chatCreationState, pendingChats, activeContracts
  - Modify form submission to handle multi-chat creation flow
  - Integrate with contract fetching to get active contracts for current session
  - Add state transitions between form, creating, waiting, and connected states
  - _Requirements: 1.1, 1.2, 1.3, 4.3_

- [x] 6. Implement multi-chat creation logic in CreateChat
  - Modify onSubmit handler to create multiple chats simultaneously
  - Add error handling for partial chat creation failures
  - Implement Promise.allSettled pattern for robust chat creation
  - Add fallback to single chat creation when only one contract available
  - _Requirements: 1.2, 3.1, 3.2, 4.5_

- [x] 7. Integrate ChatStatusMonitor with CreateChat component
  - Add ChatStatusMonitor to CreateChat during waiting state
  - Implement onChatStarted callback to handle first agent response
  - Add onChatMissed callback to handle timeout scenarios
  - Ensure proper cleanup when component unmounts or chat is selected
  - _Requirements: 2.1, 2.2, 2.3, 3.5_

- [x] 8. Implement agent response handling and chat activation
  - Create logic to set activeChat when first agent responds
  - Add initial message creation for the selected chat
  - Implement transition from waiting state to normal chat interface
  - Add cleanup of pending chats and subscriptions when chat is activated
  - _Requirements: 1.4, 1.5, 2.3, 2.4_

- [x] 9. Add comprehensive error handling and edge cases
  - Handle scenario when no active contracts exist for current session
  - Add error handling for all chat creation failures
  - Implement retry logic for subscription failures
  - Add proper error messages and fallback to offline state when needed
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 10. Implement timeout and miss handling system
  - Add timeout creation for each chat based on contract.chatMissTime
  - Implement UPDATE_CHAT_MISSED mutation calls when timeouts expire
  - Ensure chats continue to be monitored even after being marked as missed
  - Add proper cleanup of timeouts when chats become active or component unmounts
  - _Requirements: 2.6, 2.7, 3.5_

- [x] 11. Add backward compatibility and integration testing
  - Ensure single contract scenarios work identically to current behavior
  - Test integration with existing App.js and ChatContainer components
  - Verify localStorage structure remains compatible with existing code
  - Test fallback mechanisms when contract fetching fails
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_