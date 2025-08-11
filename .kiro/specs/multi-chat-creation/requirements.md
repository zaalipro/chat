# Requirements Document

## Introduction

This feature enhances the chat creation process by creating multiple chats simultaneously - one for each active contract in the current session - and connecting the customer to the first agent who responds. This approach significantly reduces wait times by leveraging all available agents in the customer's time zone rather than connecting to just one contract.

## Requirements

### Requirement 1

**User Story:** As a customer, I want the system to automatically create chats with all available agents in my time zone when I start a conversation, so that I get connected to the first agent who responds and minimize my wait time.

#### Acceptance Criteria

1. WHEN the "Start Conversation" button is clicked THEN the system SHALL fetch all active contracts for the current session
2. WHEN active contracts are found THEN the system SHALL create one chat for each active contract simultaneously
3. WHEN multiple chats are created THEN the system SHALL show a loading animation with "Waiting for agent response" text
4. WHEN any created chat status changes to "started" THEN the system SHALL immediately set that chat as the active chat
5. WHEN a chat becomes active THEN the system SHALL proceed with the normal conversation flow for that specific chat

### Requirement 2

**User Story:** As a customer, I want the system to monitor all my pending chat requests in real-time, so that I'm connected to the first available agent without delay.

#### Acceptance Criteria

1. WHEN multiple chats are created THEN the system SHALL subscribe to status changes for all created chats using GraphQL subscriptions
2. WHEN monitoring chat statuses THEN the system SHALL continuously check for status changes to "started"
3. WHEN the first chat status becomes "started" THEN the system SHALL stop monitoring other chats
4. WHEN a chat is selected THEN the system SHALL create the initial message for that specific chat
5. WHEN the conversation starts THEN the system SHALL hide the loading state and show the chat interface
6. WHEN waiting time exceeds contract.chatMissTime seconds THEN the system SHALL mark that chat as missed by updating chat.missed to true
7. WHEN a chat is marked as missed THEN the system SHALL continue processing that chat normally and agents SHALL still be able to respond

### Requirement 3

**User Story:** As a system administrator, I want the multi-chat creation to handle edge cases gracefully, so that the service remains reliable even when no agents are available or technical issues occur.

#### Acceptance Criteria

1. WHEN no active contracts exist for the current session THEN the system SHALL show the offline component
2. WHEN chat creation fails for some contracts THEN the system SHALL continue monitoring successfully created chats
3. WHEN all chat creations fail THEN the system SHALL show an appropriate error message
4. WHEN network issues occur during monitoring THEN the system SHALL implement retry logic with exponential backoff
5. WHEN the component unmounts during waiting THEN the system SHALL clean up all subscriptions and pending operations

### Requirement 4

**User Story:** As a developer, I want the multi-chat creation to integrate seamlessly with existing chat functionality, so that it maintains backward compatibility and doesn't disrupt current workflows.

#### Acceptance Criteria

1. WHEN a chat is selected from multi-chat creation THEN it SHALL work identically to single chat creation
2. WHEN the conversation starts THEN all existing chat features SHALL function normally
3. WHEN localStorage is updated THEN it SHALL maintain the same structure as single chat creation
4. WHEN the active chat is set THEN the existing App.js logic SHALL handle it without modifications
5. WHEN errors occur THEN the system SHALL fallback to single chat creation using the primary contract