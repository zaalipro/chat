# Requirements & Design Document Generation Specification

## 1. Purpose

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
- The final output must be **self-contained**—a developer unfamiliar with the feature should be able to implement it without needing additional clarification.

### 1.1 General Guidelines
- On every user prompt, read the master prompt file, `.specs/spec.md`, and follow the instructions specified in this file.
- The project requires reading `.specs/spec.md` before proceeding with any user prompts. This file specifies that I must analyze the codebase, research best practices, and then generate a new `.specs/[NN]_[feature_name]_spec.md` file (where `[NN]` is a two-digit incremental number, e.g., `01_login_spec.md`, `02_payment_spec.md`) in the `.specs` directory, with all sections filled with content, and use this file as a template.
- Before generating the file, you have to analyze the code base, do research on the internet for best practices, and plan based on the analysis and research required changes.
- After generating `.specs/[NN]_[feature_name]_spec.md`, you have to stop writing code and wait until the user reads and approves the generated Markdown file.
- Use **Context7 mcp** to fetch context for GraphQL and React.
- Use **Sequential Thinking MCP** for complex prompts.

---

## 2. Document Structure
The AI must **always** output two main sections in this exact order:

1.  **Requirements Document**
2.  **Plan Document**
3.  **Design Document**
4.  **Task List Document**

---

## 3. Requirements Document
The Requirements Document must describe **what** the feature does from the end-user’s point of view.

It must contain:

### **Introduction**
- 2–4 sentences summarizing the feature.
- State the intended audience or user role, the main goal, and the business value.
- Avoid implementation details.

### **Requirements**
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

---

## 4. Plan Document
The Plan Document must describe **what** changes are going to be done to complete the user prompt from the developer’s point of view.

It must contain:

### **Introduction**
- 2–6 sentences of technical details of the core feature requests and objectives.
- Write implementation details.
- Technical requirements and constraints
- Expected outcomes and success criteria
- Integration points with existing systems
- Performance and scalability requirements
- Any specific technologies or frameworks mentioned

### **Planning**
Each plan must be labeled `Plan 1`, `Plan 2`, etc., and include:

1.  **Understanding**
    - Restate my request in your own words to confirm understanding.
    - Identify **key objectives**, requirements, and constraints.
    - Ask any clarifying questions if something is ambiguous.
2.  **Planning Phase**
    - Produce a **solution design** that includes:
      - **High-level approach**: What will be built and why this approach works best.
      - **Data flow & architecture**: How components/modules interact.
      - **Step-by-step execution plan**: An ordered list of actions.
      - **Edge cases & failure handling**: How the solution handles unexpected input or errors.
      - **Scalability & performance considerations**.
      - **Tools, libraries, and frameworks** you intend to use (with reasoning).
3.  **Implementation Phase**
    - Provide **usage examples** or a minimal runnable example when possible.
    - Detailed breakdown as described above.
    - Only after the plan is presented and confirmed.
    - Additional tips, considerations, or trade-offs.

### **Research**
Do a web Research (if applicable)

- Search for best practices for the requested features
- Look up documentation for any mentioned technologies
- Find similar implementations or case studies
- Research common patterns and architectures
- Investigate potential libraries or tools

### **Codebase Analysis**
If this is for an existing codebase:

**IMPORTANT: Use the `.specs/codebase-analyst.md` for deep pattern analysis**
- Launch the .specs/codebase-analyst.md file to perform comprehensive pattern discovery
- The agent will analyze: architecture patterns, coding conventions, testing approaches, and similar implementations
- Use the agent's findings to ensure your plan follows existing patterns and conventions

For quick searches you can also:
- Use Grep to find specific features or patterns
- Identify the project structure and conventions
- Locate relevant modules and components
- Understand existing architecture and design patterns
- Find integration points for new features
- Check for existing utilities or helpers to reuse
---

## 5. Design Document
The Design Document must explain **how** the feature will be implemented, including:

### **Overview**
- Restate the feature in technical terms.
- Mention key technologies, APIs, data sources, and UI components.
- Adhere to the **database-first architecture** where all business logic resides in PostgreSQL functions.
- Use **PostGraphile** to auto-generate GraphQL from schema changes.
- Use **Node.js + Express** for REST endpoints, specifically for non-GraphQL operations like **file uploads**, webhooks, or email verification.

### **Architecture**
- **Component Structure**: Tree diagram in a fenced code block showing existing and new components in context.
- **Data Flow**: Step-by-step description of how data moves from its source to the user interface.
- Ensure all business logic is implemented via a PostgreSQL function in the `/scripts/functions/` directory.
- All authentication must use the `extractUserClaims()` middleware to get `userId` and `userRole`.
- All access control must be handled via **Row Level Security (RLS)** policies in `/scripts/policies/`.

### **Components and Interfaces**
For each main component:
- **Name**
- **File location in the codebase**
- **Props/parameters** (with types and purposes)
- **State variables** (with descriptions)
- **Technical description** (describe changes in more details)

### **API or GraphQL Queries**
- Include real code snippets for queries, mutations, or endpoints.
- Use correct syntax highlighting (`graphql`, `javascript`, etc.).
- **NEVER manually write GraphQL resolvers**; they are auto-generated from PostgreSQL functions.
- Use the `verb_noun` naming convention for PostgreSQL functions that will become GraphQL mutations.

### **Data Models**
- Describe the source database or API schema.
- Show the transformed format for frontend rendering.
- Tables must use **singular nouns** (e.g., `agent`, `contract`, `chat`).
- Columns must be `snake_case` (e.g., `created_at`, `user_id`).
- Use descriptive enums with the `_enum` suffix (e.g., `chat_status_enum`).

### **Error Handling**
- **Loading States**: How the UI behaves during data retrieval.
- **Error States**: Exact messages and fallback behavior for different error scenarios.
- **Fallback Behavior**: What happens if critical dependencies fail.
- All database-level errors must use `RAISE EXCEPTION` with user-friendly messages.
- REST API errors should return a `400` status with a user-friendly JSON error message.

### **Implementation Details**
- Libraries, frameworks, or packages to use.
- Styling approach (e.g., Tailwind, CSS modules).
- Performance considerations (e.g., caching, memoization).
- Accessibility requirements (e.g., ARIA labels, keyboard navigation).
- Use **parameterized queries** to prevent SQL injection.
- For file uploads, follow the specified pattern with a 5MB size limit and `image/jpeg`, `image/png`, `image/gif` as allowed types.

### **Dependencies**
- List new dependencies (with versions).
- List reused dependencies already in the codebase.

### **Integration Points**
- Show where in the code this feature will be added.
- Include a fenced code block with an integration snippet.

### **Theme/Styling Integration**
- Describe how colors, fonts, and spacing will match the existing UI.
- Reference design system variables or tokens where applicable.

---

## 6. Style & Formatting Rules
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

---

## 7. Output Guarantees
The AI must:
- **Always** produce both the Requirements, Planning, Design, and Task List sections, even with minimal input.
- **Never** omit acceptance criteria for any requirement.
- If details are missing, ask clarifying questions **before** generating.
- Mark any inferred information as an explicit assumption:  
  > **Assumption:** This feature will use [technology] because [reason].

---

## 8. Compliance Checklist for Generated Document
Before finalizing the output, the AI must verify:
- [ ] All sections exist (Requirements, Planning, Design, and Task List).
- [ ] All requirements have a User Story and numbered Acceptance Criteria.
- [ ] All plannings have all sub-sections.
- [ ] Design Document contains all subsections listed in 2.2.
- [ ] All code snippets are in fenced code blocks with correct syntax highlighting.
- [ ] No placeholders like “TBD” remain.
- [ ] Any assumptions are clearly labeled.

---

## 9. Implementation Task List Generation
After the `.specs/[NN]_[feature_name]_spec.md` file has been reviewed and **explicitly approved by the user**, your next and final step before coding is to generate a detailed implementation plan.

This plan must be a **Markdown checklist** of actionable tasks derived directly from the **Design Document** section you previously wrote. The purpose of this list is to serve as your step-by-step guide for writing the code.

### Task List Requirements

## Create a prioritized list of implementation tasks:
- Each task should be specific and actionable
- Tasks should be sized appropriately
- Include dependencies between tasks
- Order tasks logically for implementation flow

## Define the technical approach:
- Component structure and organization
- Data flow and state management
- API design (if applicable)
- Integration points with existing code
- Existing code files to reference or modify
- Documentation links for technologies used
- Code examples from research
- Patterns to follow from the codebase
- Libraries or dependencies to add


- **Format**: The output must be a Markdown checklist. Use `- [ ]` for each item.
- **Source**: Every task must correspond to a specific part of the **Design Document**.
- **Granularity**: Break down the work into small, concrete steps. Avoid high-level, vague tasks.
- **Content**: The list must include tasks for:
   - Creating new files and directories.
   - Modifying specific existing files (always include the file path).
   - List of code changes, including code examples.
   - Implementing each UI component defined in the **Components and Interfaces** section.
   - Adding the exact GraphQL queries, mutations, or API client code.
   - Installing any new dependencies listed in the **Dependencies** section.
   - Applying the integration code snippets from the **Integration Points** section.