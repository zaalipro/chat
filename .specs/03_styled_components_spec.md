# Styled Components Migration Specification

## 1. Requirements Document

### Introduction

This feature involves migrating the chat widget application from traditional CSS files to styled-components. This migration will improve maintainability by colocating styles with components, eliminate the separate CSS file in the build output, and enhance the widget's embeddability. The intended audience is developers who need to integrate the chat widget into their websites. The main goal is to produce a single JavaScript file that contains all necessary code for the widget to function, making it easier to embed in external websites.

### Requirements

#### Requirement 1
> As a developer, I want to migrate all CSS styles to styled-components, so that I can have a single JavaScript file output for easier widget embedding.

**Acceptance Criteria:**
1. WHEN the application is built THEN all CSS should be converted to styled-components.
2. WHEN the widget is embedded in a website THEN it should function exactly as before.
3. WHEN viewing the build output THEN there should be only one JavaScript file with no separate CSS file.
4. WHEN inspecting the widget in browser dev tools THEN all styles should still be applied correctly.

#### Requirement 2
> As a developer, I want to maintain the existing design system, so that the UI remains consistent.

**Acceptance Criteria:**
1. WHEN viewing the widget THEN all colors, spacing, and typography should remain unchanged.
2. WHEN resizing the browser window THEN responsive behavior should work exactly as before.
3. WHEN interacting with UI elements THEN hover states and transitions should work as before.

#### Requirement 3
> As a developer, I want to preserve dynamic styling capabilities, so that runtime customization still works.

**Acceptance Criteria:**
1. WHEN customizing widget colors at runtime THEN the UI should update accordingly.
2. WHEN switching between different widget states THEN appropriate styles should be applied.
3. WHEN using the widget in different themes THEN it should adapt correctly.

## 2. Plan Document

### Introduction

This plan outlines the migration of the chat widget from traditional CSS files to styled-components. The implementation will involve installing styled-components, creating styled components for all UI elements, replacing className usage with these components, and removing CSS imports. The approach will preserve all existing functionality while producing a single JavaScript file output.

### Planning

#### Plan 1

**Understanding:**
The user wants to migrate from traditional CSS files to styled-components to produce a single JavaScript file output for easier widget embedding. The project currently has 7 CSS files that need to be converted, and there are 34 JavaScript files that import these CSS files. All existing functionality and styling must be preserved.

**Key objectives:**
1. Replace all traditional CSS with styled-components
2. Eliminate separate CSS file in build output
3. Maintain all existing styling and functionality
4. Preserve dynamic styling capabilities
5. Keep widget embeddable in external websites

**Planning Phase:**
- **High-level approach**: Install styled-components, create styled components for each CSS class, replace className usage, remove CSS imports
- **Data flow & architecture**: Styled-components will be colocated with their respective React components, eliminating the need for separate CSS files
- **Step-by-step execution plan**:
  1. Install styled-components dependency
  2. Create styled components for design system variables
  3. Create styled components for each CSS class
  4. Replace className usage with styled components in React components
  5. Remove CSS imports from JavaScript files
  6. Delete original CSS files
  7. Test all functionality and responsive behavior
  8. Verify single JavaScript file output
- **Edge cases & failure handling**: Ensure dynamic color customization still works, verify all responsive breakpoints function correctly
- **Scalability & performance considerations**: Styled-components provides automatic critical CSS and vendor prefixing
- **Tools, libraries, and frameworks**: styled-components library, existing build tools (Vite)

**Implementation Phase:**
- Install styled-components: `npm install styled-components`
- Create styled components that mirror existing CSS classes
- Replace className usage with styled components in all React components
- Verify all styling is preserved including hover states, transitions, and responsive behavior
- Test dynamic color customization functionality
- Verify build produces single JavaScript file

#### Plan 2

**Understanding:**
The implementation must ensure that the existing widget functionality remains unchanged while migrating to styled-components. This includes handling dynamic styling through props, maintaining responsive design, and preserving all interactive elements.

**Key objectives:**
1. Maintain identical visual appearance
2. Preserve all interactive behaviors
3. Keep dynamic styling through props
4. Ensure responsive design works correctly
5. Verify build process produces single JS file

**Planning Phase:**
- **High-level approach**: Create a comprehensive mapping of CSS classes to styled components, ensuring all styling logic is preserved
- **Data flow & architecture**: Styled components will be organized by component hierarchy, with design system variables centralized
- **Step-by-step execution plan**:
  1. Analyze all CSS files to identify classes and their relationships
  2. Create a design system theme using styled-components theme provider
  3. Create styled components for each UI element
  4. Implement dynamic styling using props for customizable elements
  5. Replace all className attributes with styled components
  6. Remove CSS file imports and delete CSS files
  7. Test all widget states and interactions
  8. Verify build output
- **Edge cases & failure handling**: Handle browser-specific styling issues, ensure fallbacks for dynamic styling
- **Scalability & performance considerations**: Use component memoization where appropriate, optimize bundle size
- **Tools, libraries, and frameworks**: styled-components, existing React testing tools

**Implementation Phase:**
- Create a theme object for design system variables
- Implement styled components with proper prop handling for dynamic styles
- Ensure responsive design is maintained through media queries in styled components
- Test all widget states (chat open/closed, form states, error states, etc.)
- Verify embedding functionality works with single JS file

## 3. Design Document

### Overview

This feature migrates the chat widget from traditional CSS files to styled-components. The implementation will replace the 7 existing CSS files with styled components that are colocated with their respective React components. Key technologies include styled-components library, React, and the existing Vite build system. The migration will maintain all UI components and their styling while producing a single JavaScript file output.

### Architecture

```tree
src/
├── components/
│   ├── styled/
│   │   ├── design-system/
│   │   │   ├── theme.js
│   │   │   └── GlobalStyles.js
│   │   ├── ChatWidget.js
│   │   ├── ChatContainer.js
│   │   ├── ChatMessage.js
│   │   ├── MessageForm.js
│   │   ├── ToggleButton.js
│   │   └── ...
│   └── ...
├── App.js (styled)
├── index.js (updated imports)
└── ...
```

### Data Flow

1. Theme and global styles are defined in design system files
2. Styled components are created for each UI element
3. React components import and use styled components instead of CSS classes
4. Dynamic styles are passed as props to styled components
5. Build process bundles all styles into single JavaScript file

### Components and Interfaces

#### StyledThemeProvider
- **File location**: `src/components/styled/design-system/ThemeProvider.js`
- **Props**: `children` (React nodes to wrap with theme)
- **State variables**: None
- **Technical description**: Provides theme context for all styled components, enabling access to design system variables

#### GlobalStyles
- **File location**: `src/components/styled/design-system/GlobalStyles.js`
- **Props**: None
- **State variables**: None
- **Technical description**: Defines global CSS resets and base styles using createGlobalStyle

#### ChatContainer
- **File location**: `src/components/styled/ChatContainer.js`
- **Props**: `isOpen` (boolean for animation state)
- **State variables**: None
- **Technical description**: Styled container for the main chat panel with responsive behavior and animations

#### ChatMessage
- **File location**: `src/components/styled/ChatMessage.js`
- **Props**: `isAgent` (boolean), `userSpeechBubbleColor` (string), `shouldRenderTimestamp` (boolean)
- **State variables**: None
- **Technical description**: Styled component for individual chat messages with dynamic styling based on sender

#### MessageForm
- **File location**: `src/components/styled/MessageForm.js`
- **Props**: `inputHasFocus` (boolean)
- **State variables**: None
- **Technical description**: Styled component for the message input area with focus states

#### ToggleButton
- **File location**: `src/components/styled/ToggleButton.js`
- **Props**: `isOpen` (boolean), `mainColor` (string)
- **State variables**: None
- **Technical description**: Styled component for the toggle button with dynamic background color and icon

### API or GraphQL Queries

This migration does not affect GraphQL queries or API interactions as it only concerns styling.

### Data Models

This migration does not change any data models as it only concerns styling.

### Error Handling

#### Loading States
The widget will maintain existing loading states with styled-components replacing CSS classes.

#### Error States
Error message styling will be implemented using styled-components while maintaining identical visual appearance.

#### Fallback Behavior
If styled-components fails to load (extremely unlikely), the widget will fall back to default browser styling but maintain functionality.

### Implementation Details

#### Libraries and Frameworks
- **styled-components**: Primary library for CSS-in-JS implementation
- **React**: Existing component framework
- **Vite**: Existing build system

#### Styling Approach
- All existing CSS classes will be converted to styled components
- Design system variables will be centralized in a theme object
- Dynamic styling will be implemented using component props
- Media queries will be maintained for responsive design
- Pseudo-selectors and animations will be converted to styled-components syntax

#### Performance Considerations
- Styled components will be defined outside render methods to prevent re-creation
- Component memoization will be used where appropriate
- Critical CSS will be automatically included in the bundle

#### Accessibility Requirements
- All existing accessibility features will be maintained
- ARIA labels and semantic HTML structure will be preserved
- Keyboard navigation will continue to work as before

### Dependencies

#### New Dependencies
- `styled-components`: "^5.3.6" (CSS-in-JS library)

#### Reused Dependencies
- `react`: "^18.2.0" (existing)
- `react-dom`: "^18.2.0" (existing)
- `vite`: "^7.1.2" (existing build tool)

### Integration Points

The styled-components will be integrated at the component level, replacing className attributes with styled component instances.

```javascript
// Before (with CSS classes)
import './css/ChatMessage.css'

const ChatMessage = ({ message }) => (
  <div className='message-padding'>
    <div className='flex flex-bottom'>
      <div className='message-container message-container-padding-right flex-right'>
        <div className='white padding-20 radius background-blue'>
          <p>{message.text}</p>
        </div>
      </div>
    </div>
  </div>
)

// After (with styled-components)
import { MessagePadding, MessageContainer, MessageBubble } from './styled/ChatMessage'

const ChatMessage = ({ message }) => (
  <MessagePadding>
    <MessageContainer>
      <MessageBubble isAgent={false}>
        <p>{message.text}</p>
      </MessageBubble>
    </MessageContainer>
  </MessagePadding>
)
```

### Theme/Styling Integration

The existing design system CSS custom properties will be converted to a JavaScript theme object:

```javascript
// Before (CSS custom properties)
:root {
  --primary-color: rgba(39, 175, 96, 1);
  --font-size-base: 1rem;
  --spacing-md: 1rem;
}

// After (styled-components theme)
export const theme = {
  colors: {
    primary: 'rgba(39, 175, 96, 1)',
    // ... other colors
  },
  fontSize: {
    base: '1rem',
    // ... other font sizes
  },
  spacing: {
    md: '1rem',
    // ... other spacing values
  }
}
```

## 4. Task List Document

Based on the approved design for the "Styled Components Migration" feature, here is the implementation plan:

**Phase 1: Setup & Dependencies**
- [ ] Install styled-components by running `npm install styled-components`
- [ ] Create directory structure: `src/components/styled/`
- [ ] Create design system directory: `src/components/styled/design-system/`

**Phase 2: Theme & Global Styles**
- [ ] Create theme object: `src/components/styled/design-system/theme.js`
- [ ] Create global styles: `src/components/styled/design-system/GlobalStyles.js`
- [ ] Create ThemeProvider component: `src/components/styled/design-system/ThemeProvider.js`

**Phase 3: Create Styled Components**
- [ ] Create styled components for App.css:
  - [ ] Container, Panel, Header, etc.
- [ ] Create styled components for Chat.css:
  - [ ] ChatContainer
- [ ] Create styled components for ChatInput.css:
  - [ ] ChatInput, InputField
- [ ] Create styled components for ChatMessage.css:
  - [ ] MessageContainer, MessageBubble, etc.
- [ ] Create styled components for ChatMessages.css:
  - [ ] ChatMessagesContainer
- [ ] Create styled components for design-system.css:
  - [ ] All design system components (Button, Form, etc.)

**Phase 4: Component Migration**
- [ ] Update App.js to use styled components instead of CSS classes
- [ ] Update Chat.js to use styled components instead of CSS classes
- [ ] Update ChatMessage.js to use styled components instead of CSS classes
- [ ] Update MessageBox.js to use styled components instead of CSS classes
- [ ] Update MessageForm.js to use styled components instead of CSS classes
- [ ] Update ToggleOpeningStateButton.js to use styled components instead of CSS classes
- [ ] Update CreateChat.js to use styled components instead of CSS classes

**Phase 5: Cleanup**
- [ ] Remove all CSS imports from JavaScript files
- [ ] Delete all CSS files in src/css/
- [ ] Update index.js to remove CSS imports and add ThemeProvider

**Phase 6: Testing & Verification**
- [ ] Test all widget states and interactions
- [ ] Verify responsive design works correctly
- [ ] Test dynamic color customization
- [ ] Run build process and verify single JavaScript file output
- [ ] Test widget embedding functionality