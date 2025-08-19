# spec.md — Relogin on Missing websiteId

## 1. Requirements Document

### Introduction
This document outlines the requirements for making the chat widget more resilient to cleared browser data. Currently, if the `localStorage` is cleared, the application shows an error and does not attempt to re-authenticate. The goal is to automatically re-run the `consumerLogin` mutation if the `websiteId` is missing, ensuring a seamless user experience even if the user clears their browsing data.

### Requirements

#### Requirement 1: Automatic Re-login
- **User Story**: As a user, if I clear my browser data, I want the chat widget to automatically re-authenticate so that I can continue using the chat without seeing an error.
- **Acceptance Criteria**:
  1.  WHEN the application loads and the `websiteId` is not found in `localStorage`, THEN the application must automatically trigger the `consumerLogin` mutation.
  2.  WHEN the `consumerLogin` mutation is successful, THEN the application should render the chat widget as normal.
  3.  WHEN the `consumerLogin` mutation fails, THEN the application should display the existing error state with a retry button.

## 2. Plan Document

### Introduction
The plan is to modify `src/App.js` to handle the case where `websiteId` is missing from `localStorage`. Instead of logging an error and showing a broken state, the component will trigger the login process again. This will be achieved by calling the `attemptLogin` function, which is already exposed on the `window` object.

### Planing

#### Plan 1: Implement Automatic Re-login in `App.js`
1.  **Understanding**: The request is to make the application automatically re-login when the `websiteId` is not found in `localStorage`. This will improve the user experience by making the application more resilient.
2.  **Planning Phase**:
    -   **High-level approach**: We will modify the `if (!websiteId)` block in `src/App.js`. Instead of logging an error, we will call `window.ChatApp.attemptLogin()` to re-trigger the login flow. We will also show a loading indicator while the login is in progress.
    -   **Data flow & architecture**: The `App` component will now have a side effect. When it detects a missing `websiteId`, it will call a function on the `window` object to re-initiate the application's authentication flow.
    -   **Step-by-step execution plan**:
        1.  In `src/App.js`, locate the `if (!websiteId)` block.
        2.  Inside this block, instead of logging an error, call `window.ChatApp.attemptLogin()`.
        3.  Return a loading indicator from this block to prevent the rest of the component from rendering while the login is in progress.
    -   **Edge cases & failure handling**: If the re-login attempt fails, the existing error handling mechanism (the `ErrorState` component) will be triggered, so no new failure handling is needed.
    -   **Scalability & performance considerations**: This change has a negligible impact on performance.
    -   **Tools, libraries, and frameworks**: We will use the existing React framework and the `window` object for communication.
3.  **Implementation Phase**:
    -   **Usage examples**: The user can test this by opening the application, clearing the `localStorage` in the browser's developer tools, and reloading the page.

## 3. Design Document

### Overview
This design document details the technical implementation for the automatic re-login feature. We will modify `src/App.js` to call the `attemptLogin` function when `websiteId` is not present in `localStorage`.

### Architecture
-   **Component Structure**: No new components are needed.

-   **Data Flow**:
    1.  The `App` component renders.
    2.  It checks for `websiteId` in `localStorage` via `store('websiteId')`.
    3.  **`websiteId` exists**: The component renders as normal.
    4.  **`websiteId` is missing**: The component calls `window.ChatApp.attemptLogin()` and renders a loading indicator.
    5.  The `attemptLogin` function in `src/index.js` or `src/widget.js` runs the `consumerLogin` mutation.
    6.  The application re-renders with either the chat interface (on success) or the `ErrorState` component (on failure).

### Components and Interfaces

#### **App.js**
-   **File location**: `src/App.js`
-   **Technical description**: The `if (!websiteId)` block will be modified. It will now call `window.ChatApp.attemptLogin()` and return a loading spinner.

### API or GraphQL Queries
No changes to GraphQL queries are needed.

### Data Models
No changes to data models are needed.

### Error Handling
-   The existing error handling for the `consumerLogin` mutation is sufficient.

### Implementation Details
-   We will use a `useEffect` hook in `App.js` to call `attemptLogin` to avoid side effects in the render function.

### Dependencies
-   No new dependencies are needed.

### Integration Points
-   The change is self-contained within `src/App.js`.

## 4. Task List Document

- [ ] In `src/App.js`, import the `useEffect` hook from React.
- [ ] In `src/App.js`, add a `useEffect` hook that checks for `websiteId`.
- [ ] If `websiteId` is missing, the `useEffect` hook should call `window.ChatApp.attemptLogin()`.
- [ ] The `if (!websiteId)` block should be modified to return a loading indicator.
