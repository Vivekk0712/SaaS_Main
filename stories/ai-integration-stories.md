# AI Integration - User Stories

User stories aligned to the site-wide chat assistant that makes work simple on every page. Implementation of advanced AI features is deferred.

---

## AI-001 Global Chat Launcher
- Story: As any User, I can open a chat on any page to ask “what can I do here?” and get relevant options.
- Acceptance Criteria:
  - Floating chat button is visible on every page; keyboard shortcut toggles it.
  - When opened, assistant shows page-relevant quick actions.
- Gherkin:
  - Given I am on any page
  - When I press the chat shortcut
  - Then the chat opens and lists helpful actions for this page

## AI-002 Contextual Help
- Story: As a User, I ask about the current page and receive guidance grounded in the page’s labels and help docs.
- Acceptance Criteria:
  - Assistant can reference visible labels and link to relevant help.
  - If context is insufficient, it asks a clarifying question.
- Gherkin:
  - Given I’m on the Assignments page
  - When I ask “how do I create an assignment?”
  - Then I see a short guide and a link to the create assignment form

## AI-003 Task Shortcuts
- Story: As a Teacher, I can request common actions (e.g., “create assignment for 8A”) and receive deep-links that preserve context.
- Acceptance Criteria:
  - Links carry parameters (e.g., classId) when available; safe fallback if not.
  - No action is executed automatically; user confirms by clicking the link.
- Gherkin:
  - Given I’m viewing Class 8A
  - When I ask “create an assignment”
  - Then I get a link to the create form with Class 8A preselected

## AI-004 Role-Aware Navigation
- Story: As a Student, I can ask for “my due assignments” and get a link filtered to me; as an Admin, I can ask for “fee reports” and get the right report view.
- Acceptance Criteria:
  - Links and filters respect role and permissions; no cross-tenant/data leaks.
  - If the user lacks permission, the assistant explains what’s required.
- Gherkin:
  - Given I am a Student
  - When I ask “show my due assignments”
  - Then I get a link to assignments filtered to my account

## AI-005 Privacy & Session Control
- Story: As a User, I can see what context the assistant uses and clear my chat history.
- Acceptance Criteria:
  - Clear indicator of captured context (route, role, entity id when present).
  - “Clear chat” erases session history and resets context.
- Gherkin:
  - Given I have an ongoing chat
  - When I click “Clear chat”
  - Then my prior turns are removed and the session resets

## AI-006 Availability & Degradation
- Story: As the System, when the assistant is unavailable, users see a graceful fallback with status and alternative navigation.
- Acceptance Criteria:
  - Chat button shows disabled state; help link and search remain available.
  - Status text communicates the outage without blocking primary flows.
- Gherkin:
  - Given the assistant backend is down
  - When a user opens the chat
  - Then they see a notice and links to manual help and navigation
