# spec.md — Requirements & Design Document Generation Specification

## 1\. Purpose

This specification defines exactly how an AI coding agent must create a **combined Requirements Document, Plan Document, Design Document and Task List Document** for any feature description provided by the user.

The AI’s goal is to produce:

  - A clear, professional, and comprehensive requirements section from a **user perspective**.
  - A detailed, technically accurate design section from a **developer perspective**.
  - A document that is structured identically for every feature, ensuring consistency and ease of reading.
  - Code must follow:
  - Readability and maintainability best practices.
  - Proper variable naming and code organization.
  - Inline comments explaining non-trivial logic.
  - Error handling where appropriate.

The final output must be **self-contained** — a developer unfamiliar with the feature should be able to implement it without needing additional clarification.

### 1.1 General Guidelines

  - On every user prompt read master prompt file in `.specs/spec.md` and follow instructions specified in this file.
  - The project requires reading `.specs/spec.md` before proceeding with any user prompts. This file specifies that I must analyze the codebase, research best practices, and then generate new `.specs/[NN]_[feature_name]_spec.md` file (where `[NN]` is a two-digit incremental number (e.g., `01_login_spec.md`, `02_payment_spec.md`). `[feature_name]` should be small as possible maximum 5 words) in `.specs` directory, with all sections filled with content and use this file as template.
  - Before generating file you have to analyze code base, do research in internet for best practices and plan based on analysis and research required changes.
  - After generating `.specs/[NN]_[feature_name]_spec.md` (where `[NN]` is a two-digit incremental number (e.g., `01_login_spec.md`, `02_payment_spec.md`).) you have to stop writing code and wait before user reads and approves generated Markdown file
  - Never use client-side filtering or sorting, use GraphQL query filtration and sorting
  - Use Context7 mcp to fetch context for graphql and react.
  - Use Sequential Thinking MCP for complex prompts
  - Keep in mind its a widget that can be rendered in any HTML website
  - Think deeply to avoid race condition when implementing issues
  - **Project-Specific Conventions**: Adhere strictly to the project's coding conventions defined in `structure.md`, `tech.md`, and `product.md`, including:
      - **React**: Use functional components and hooks only.
      - **Naming**: PascalCase for components, `use` prefix for hooks, UPPER\_SNAKE\_CASE for GraphQL queries/mutations and constants.
      - **Directory Structure**: Use the specific folder structure (e.g., `src/Components/`, `src/hooks/`, `src/queries.js`).
      - **Styling**: Use `styled-components` with transient props and a mobile-first approach.
      - **State Management**: Prioritize `useState` for local state, Apollo Client for GraphQL data, and `store2` for local storage persistence.
      - **Imports**: Follow the specified import order (external, then internal from `src/`).

-----

## 2\. Document Structure

The AI must **always** output two main sections in this exact order:

1.  **Requirements Document**
2.  **Plan Document**
3.  **Design Document**
4.  **Task List Document**

-----

### 3 Requirements Document

The Requirements Document must describe **what** the feature does from the end-user’s point of view.

It must contain:

#### **Introduction**

  - 2–4 sentences summarizing the feature.
  - State the intended audience or user role, the main goal, and the business value.
  - Avoid implementation details.

#### **Requirements**

Each requirement must be labeled `Requirement 1`, `Requirement 2`, etc., and include:

1.  **User Story**
      - Format:
        > As a [role], I want [goal], so that [benefit].
2.  **Acceptance Criteria**
      - Numbered list starting each item with `WHEN ... THEN ...`.
      - Criteria must be specific, measurable, and unambiguous.
      - Each criterion should describe:
          - The triggering condition (WHEN)
          - The expected behavior (THEN)

-----

### 4 Plan Document

The Plan Document must describe **what** changes are going to be done to complete user promp from the developer’s point of view.

It must contain:

#### **Introduction**

  - 2–6 sentences technical details of the feature.
  - Write implementation details.

#### **Planning**

Each plan must be labeled `Plan 1`, `Plan 2`, etc., and include:

1.  **Understanding**
      - Restate my request in your own words to confirm understanding.
      - Identify **key objectives**, requirements, and constraints.
      - Ask any clarifying questions if something is ambiguous.
2.  **Planning Phase**
    Produce a **solution design** that includes:
      - **High-level approach**: What will be built and why this approach works best, leveraging React hooks, Apollo Client, and the existing `src/` directory structure.
      - **Data flow & architecture**: How components/modules interact, referencing data flow from Apollo Client cache and local state.
      - **Step-by-step execution plan**: Ordered list of actions.
      - **Edge cases & failure handling**: How the solution handles unexpected input or errors, referencing the use of `try-catch` and React Error Boundaries.
      - **Scalability & performance considerations**: Including `useMemo`/`useCallback` for memoization and lazy loading.
      - **Tools, libraries, and frameworks** you intend to use (with reasoning).
3.  **Implementation Phase**
      - Provide **usage examples** or a minimal runnable example when possible.
      - Detailed breakdown as described above.
      - Only after the plan is presented and confirmed.
      - Additional tips, considerations, or trade-offs.

-----

### 5 Design Document

The Design Document must explain **how** the feature will be implemented, including:

#### **Overview**

  - Restate the feature in technical terms.
  - Mention key technologies like **React 18.2.0**, **Apollo Client 3.7.2**, and the use of the `src/` folder structure, APIs, data sources, and UI components from **Semantic UI React**.

#### **Architecture**

  - **Component Structure**: Tree diagram in a fenced code block showing existing and new components in context, using PascalCase for file names.
  - **Data Flow**: Step-by-step description of how data moves from its source (GraphQL endpoint `http://localhost:5001/graphql` or local storage via `store2`) to the Apollo Client cache, and then to the user interface via React components and custom hooks.

#### **Components and Interfaces**

For each main component:

  - **Name**: PascalCase
  - **File location in the codebase**: e.g., `src/Components/ChatContainer.js`
  - **Props/parameters**: (with types and purposes)
  - **State variables**: (with descriptions)
  - **Technical description**: (describe changes in more details)

#### **API or GraphQL Queries**

  - Include real code snippets for queries, mutations, or subscriptions.
  - Use **UPPER\_SNAKE\_CASE** for query names.
  - Ensure all queries are placed in `src/queries.js`.
  - Use correct syntax highlighting (`graphql`, `javascript`, etc.).

#### **Data Models**

  - Describe the source database or API schema based on the GraphQL endpoint.
  - Show the transformed format for frontend rendering.

#### **Error Handling**

  - **Loading States**: How the UI behaves during data retrieval (e.g., show a spinner or skeleton).
  - **Error States**: Exact messages and fallback behavior for different error scenarios (e.g., network failure, bad response from GraphQL).
  - **Fallback Behavior**: What happens if critical dependencies fail, such as gracefully degrading to an offline state if the WebSocket connection is lost.

#### **Implementation Details**

  - **Libraries/Packages**: Use the required libraries (`Apollo Client`, `Formik`, `Moment.js`, `store2`, `Classnames`).
  - **Styling**: Use the `styled-components` design system approach from `src/Components/styled/`, with theme-based styling via `props.theme` and transient props (`$`).
  - **Performance**: Reference the use of `useMemo` and `useCallback` for memoization and lazy loading for code splitting.
  - **Accessibility**: Mention how to ensure accessibility (e.g., keyboard navigation, ARIA labels).

#### **Dependencies**

  - List new dependencies (with versions).
  - List reused dependencies already in the codebase.

#### **Integration Points**

  - Show where in the code this feature will be added.
  - Include a fenced code block with an integration snippet, adhering to the specified import order and file paths.

#### **Theme/Styling Integration**

  - Describe how colors, fonts, and spacing will match the existing UI by accessing theme variables from `src/Components/styled/DesignSystem.js`.

-----

## 6\. Style & Formatting Rules

  - **Headings**: Use `#` for main sections, `##` for subsections, `###` for sub-subsections.
  - **Bold**: Use for component names, file paths, variables, and important terms.
  - **Lists**:
      - Numbered lists for acceptance criteria and ordered steps.
      - Bullet lists for unordered items.
  - **Code blocks**:
      - Use fenced code blocks with correct language identifiers (`javascript`, `graphql`, `json`, etc.).
      - All example queries, structures, and integration snippets must be syntactically correct.
  - Avoid vague terms like “etc.” or “and so on”.
  - Maintain a **clear, professional tone** throughout.

-----

## 7\. Output Guarantees

The AI must:

  - **Always** produce both the Requirements, Planning, Design and Task List sections, even with minimal input.
  - **Never** omit acceptance criteria for any requirement.
  - If details are missing, ask clarifying questions **before** generating.
  - Mark any inferred information as an explicit assumption:
    > **Assumption:** This feature will use [technology] because [reason].

-----

## 8\. Compliance Checklist for Generated Document

Before finalizing the output, the AI must verify:

  - [ ] All sections exist (Requirements, Planning, Design and Task List).
  - [ ] All requirements have a User Story and numbered Acceptance Criteria.
  - [ ] All plannings have all sub-sections.
  - [ ] Design Document contains all subsections listed in 2.2.
  - [ ] All code snippets are in fenced code blocks with correct syntax highlighting.
  - [ ] No placeholders like “TBD” remain.
  - [ ] Any assumptions are clearly labeled.

-----

## 9\. Implementation Task List Generation

After the `.specs/[NN]_[feature_name]_spec.md` (where `[NN]` is a two-digit incremental number (e.g., `01_login_spec.md`, `02_payment_spec.md`).) file has been reviewed and **explicitly approved by the user**, your next and final step before coding is to generate a detailed implementation plan.

This plan must be a **Markdown checklist** of actionable tasks derived directly from the **Design Document** section you previously wrote. The purpose of this list is to serve as your step-by-step guide for writing the code.

### Task List Requirements:

  - **Format**: The output must be a Markdown checklist. Use `- [ ]` for each item.
  - **Source**: Every task must correspond to a specific part of the **Design Document**.
  - **Granularity**: Break down the work into small, concrete steps. Avoid high-level, vague tasks.
  - **Content**: The list must include tasks for:
      - Creating new files and directories, following the conventions from `structure.md`.
      - Modifying specific existing files (always include the file path).
      - List of code changes, including code examples.
      - Implementing each UI component defined in the **Components and Interfaces** section, using the specified technologies (`Semantic UI React`, `styled-components`).
      - Adding the exact GraphQL queries, mutations, or API client code to `src/queries.js`.
      - Installing any new dependencies listed in the **Dependencies** section.
      - Applying the integration code snippets from the **Integration Points** section, ensuring correct import order.

### Example Task List Output:

Your generated task list should look similar to this:

```markdown
Based on the approved design for the "User Avatar Upload" feature, here is the implementation plan:

**Phase 1: Setup & Scaffolding**
- [ ] Create new file: `src/components/features/profile/AvatarUploader.jsx`
- [ ] Create new file: `src/hooks/useAvatarUpload.js`
- [ ] Add new dependency by running `npm install react-dropzone`.

**Phase 2: API & Data Logic**
- [ ] Add the `UPLOAD_AVATAR` mutation to `src/queries.js`.
- [ ] Implement the `useAvatarUpload` hook to call the mutation and handle loading/error states.

**Phase 3: Component Implementation**
- [ ] Build the UI for the **AvatarUploader** component using Semantic UI React components.
- [ ] Implement the drag-and-drop functionality using `react-dropzone`.
- [ ] Connect the component's state to the `useAvatarUpload` hook.
- [ ] Display loading indicators and error messages as defined in the **Error Handling** section of the design doc.

**Phase 4: Integration**
- [ ] Import and render the **AvatarUploader** component within `src/App.js` or the appropriate container component.
- [ ] Pass the required `userId` prop to the component.
```