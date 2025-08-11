# Requirements Document

## Introduction

This feature modifies the chat application's contract handling logic to support multiple active contracts per website. Instead of fetching a single contract by contractId, the system will fetch all active contracts associated with a websiteId and determine availability based on current working hours across all contracts. This enables more flexible contract management and better availability detection for websites with multiple contract sessions.

## Requirements

### Requirement 1

**User Story:** As a website visitor, I want the chat widget to be available when any of the website's contracts are active during current working hours, so that I can always access support when it should be available.

#### Acceptance Criteria

1. WHEN the chat widget loads THEN the system SHALL fetch all active contracts for the current websiteId
2. WHEN multiple contracts exist for a website THEN the system SHALL evaluate working hours for each contract
3. WHEN at least one contract has active working hours THEN the system SHALL show the chat creation interface
4. WHEN no contracts have active working hours THEN the system SHALL show the offline interface

### Requirement 2

**User Story:** As a system administrator, I want the contract selection logic to be based on websiteId instead of contractId, so that websites can have multiple contract configurations.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL retrieve websiteId from local storage instead of contractId
2. WHEN querying contracts THEN the system SHALL use GET_CONTRACTS_BY_WEBSITE query instead of GET_CONTRACT
3. WHEN no websiteId is available THEN the system SHALL handle the error gracefully
4. WHEN the contracts query fails THEN the system SHALL show appropriate error handling

### Requirement 3

**User Story:** As a website visitor, I want the working hours validation to consider all available contracts, so that I get accurate availability status.

#### Acceptance Criteria

1. WHEN checking working hours THEN the system SHALL iterate through all active contracts
2. WHEN any contract is within working hours THEN the system SHALL consider the service available
3. WHEN all contracts are outside working hours THEN the system SHALL show offline status
4. WHEN working hours check fails THEN the system SHALL fallback to showing offline status

### Requirement 4

**User Story:** As a developer, I want the contract data structure to remain compatible with existing components, so that downstream components continue to work without modification.

#### Acceptance Criteria

1. WHEN passing contract data to child components THEN the system SHALL maintain the existing contract object structure
2. WHEN multiple contracts are available THEN the system SHALL select the most appropriate active contract
3. WHEN CreateChat component receives contract data THEN it SHALL work with the same interface as before
4. WHEN no active contracts are found THEN the system SHALL handle the null/undefined state gracefully