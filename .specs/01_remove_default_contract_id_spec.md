# spec.md — Remove Default Contract ID

## 1. Requirements Document

### Introduction
This document outlines the requirements for removing the hardcoded `DEFAULT_CONTRACT_ID` from the chat widget. The goal is to make the widget rely solely on the provided `PUBLIC_KEY` for initialization, making the system more robust and removing a potential source of configuration errors. This change is intended to improve the developer experience and the reliability of the widget's initialization process.

### Requirements

#### Requirement 1: Remove `DEFAULT_CONTRACT_ID`
- **User Story**: As a developer, I want the chat widget to initialize using only the `PUBLIC_KEY`, so that I don't have to manage a separate `DEFAULT_CONTRACT_ID` and the widget is not tied to a specific contract by default.
- **Acceptance Criteria**:
  1.  WHEN the application starts, THEN it must not rely on `VITE_DEFAULT_CONTRACT_ID` for initialization.
  2.  WHEN the `consumerLogin` mutation fails, THEN the application must display a clear error message and a retry button instead of falling back to a default contract.
  3.  WHEN the application is running without an authentication token, THEN it should not render a chat window with a default contract, but rather an error state or a disabled state.

## 2. Plan Document

### Introduction
The plan is to refactor the application to remove the dependency on `VITE_DEFAULT_CONTRACT_ID`. This involves modifying the application's initialization and error handling logic in `src/index.js` and `src/widget.js`. We will introduce a more robust error handling mechanism for cases where the initial login mutation fails, and we will remove all fallback logic that currently uses the default contract ID.

### Planing

#### Plan 1: Refactor Initialization and Error Handling
1.  **Understanding**: The request is to remove the `VITE_DEFAULT_CONTRACT_ID` from the application. This variable is currently used as a fallback mechanism during initialization and error handling. The new approach should rely entirely on the `PUBLIC_KEY` to initialize the application. If the initialization fails, the application should enter a clear error state.
2.  **Planning Phase**:
    -   **High-level approach**: We will remove all references to `VITE_DEFAULT_CONTRACT_ID` from the codebase. We will then implement a new error state component that will be displayed if the `consumerLogin` mutation fails. This component will show an error message and a "Retry" button.
    -   **Data flow & architecture**: The `renderApp` function will be modified to handle a new error state. If the `consumerLogin` mutation fails, `renderApp` will be called with an error object. The `App` component will be updated to render the new error component when it receives an error prop.
    -   **Step-by-step execution plan**:
        1.  Create a new component `src/components/ErrorState.js` that displays an error message and a retry button.
        2.  In `src/index.js` and `src/widget.js`, modify the `loginClient` mutation's `.catch` block to call `renderApp` with an error object.
        3.  Modify the `renderApp` function to pass the error object to the `ClientApp` component.
        4.  Modify the `ClientApp` and `App` components to render the `ErrorState` component when an error is present.
        5.  Remove all code that references `VITE_DEFAULT_CONTRACT_ID`.
    -   **Edge cases & failure handling**: The primary failure case is the `consumerLogin` mutation failing. This will be handled by the new error state component.
    -   **Scalability & performance considerations**: This change will have a minor positive impact on performance by removing unnecessary fallback logic.
    -   **Tools, libraries, and frameworks**: We will use the existing React and Apollo Client libraries.
3.  **Implementation Phase**:
    -   **Usage examples**: The widget will be initialized as before, but without the need for `VITE_DEFAULT_CONTRACT_ID` in the `.env` file.

## 3. Design Document

### Overview
This design document details the technical implementation for removing the `VITE_DEFAULT_CONTRACT_ID`. We will modify `src/index.js` and `src/widget.js` to change the application's initialization flow and error handling. A new `ErrorState` component will be created to handle initialization failures gracefully.

### Architecture
-   **Component Structure**:
    ```
    src/
    ├── App.js
    ├── components/
    │   └── ErrorState.js (new)
    ├── index.js
    └── widget.js
    ```

-   **Data Flow**:
    1.  The application starts in `src/index.js` or `src/widget.js`.
    2.  The `loginClient` attempts the `consumerLogin` mutation with the `VITE_PUBLIC_KEY`.
    3.  **Success**: The mutation returns a `jwtToken`, and the application renders as normal.
    4.  **Failure**: The mutation fails, and the `.catch` block calls `renderApp` with an error object.
    5.  The `App` component receives the error object as a prop and renders the `ErrorState` component.

### Components and Interfaces

#### **ErrorState**
-   **File location**: `src/components/ErrorState.js`
-   **Props**:
    -   `message` (string): The error message to display.
    -   `onRetry` (function): A callback function to be called when the "Retry" button is clicked.
-   **State variables**: None.
-   **Technical description**: A simple presentational component that displays an error message and a button.

#### **App.js**
-   **File location**: `src/App.js`
-   **Props**:
    -   `error` (object, optional): The error object from the failed login mutation.
-   **Technical description**: The `App` component will be modified to check for the `error` prop. If it exists, it will render the `ErrorState` component instead of the main chat interface.

### API or GraphQL Queries
No changes to GraphQL queries are needed.

### Data Models
No changes to data models are needed.

### Error Handling
-   **Loading States**: The initial loading state will be handled by the existing loader.
-   **Error States**: If the `consumerLogin` mutation fails, the `ErrorState` component will be displayed with the message "Failed to initialize chat. Please try again." and a "Retry" button.
-   **Fallback Behavior**: The fallback to `DEFAULT_CONTRACT_ID` will be removed. The new fallback is the `ErrorState` component.

### Implementation Details
-   **Styling**: The `ErrorState` component will use the existing design system for styling.

### Dependencies
-   No new dependencies are needed.

### Integration Points
-   The main integration point is the `loginClient`'s `.catch` block in `src/index.js` and `src/widget.js`.

## 4. Task List Document

- [ ] Create new file: `src/components/ErrorState.js`
- [ ] Implement the `ErrorState` component to display an error message and a retry button.
- [ ] In `src/index.js`, modify the `loginClient` mutation's `.catch` block to call `renderApp` with an error object.
- [ ] In `src/widget.js`, modify the `loginClient` mutation's `.catch` block to call `renderApp` with an error object.
- [ ] Modify the `renderApp` function in both `src/index.js` and `src/widget.js` to pass the error to the `App` component.
- [ ] Update the `App` component to accept an `error` prop and render the `ErrorState` component if the prop is present.
- [ ] Remove all references to `VITE_DEFAULT_CONTRACT_ID` from `src/index.js`.
- [ ] Remove all references to `VITE_DEFAULT_CONTRACT_ID` from `src/widget.js`.
- [ ] Remove the line for `REACT_APP_DEFAULT_CONTRACT_ID` from `vite.config.js`.
- [ ] Remove `VITE_DEFAULT_CONTRACT_ID` from the `.env` file.
