# Universal Chat Assistant Epic - School SAS

## Summary
Introduce a simple, site-wide chat assistant available on every page to help users get things done faster. The assistant focuses on answering questions about the current page, guiding users to the right actions, and providing quick shortcuts. Detailed AI features (recommendations, grading assist, risk indicators) are out of scope for now and may be revisited later.

## Vision & Objectives
- Make work simple for all users by offering a consistent, contextual helper on every page.
- Reduce time-to-action via shortcuts (e.g., “create assignment”, “view dues”, “mark attendance”).
- Keep it safe and privacy-conscious with clear guardrails and minimal data exposure.

## Scope
- In (MVP):
  - Global chat launcher present across all pages and roles.
  - Context-aware answers using on-page context and existing help docs.
  - Suggest and deep-link to common actions relevant to the current page/role.
  - Basic history within a session; clear privacy notices and opt-out.
- Out (initial):
  - Personalized recommendations, grading assistance, risk scoring, or autonomous actions.
  - Content authoring aids, multilingual, or adaptive practice.

## Personas
- Teacher: Uses chat to find classes, start or grade assignments, and navigate quickly.
- Student: Uses chat to find assignments, deadlines, and get help understanding page elements.
- Admin/Accountant: Uses chat to jump to reports, invoices, and configuration.

## Assumptions
- Assistant responses prioritize deterministic guidance and internal help content over generation.
- Minimal context: page route, role, and selected entity identifiers (if available).
- Privacy-preserving data use; tenant isolation; explicit opt-in where required.

## Functional Requirements
- MVP
  - Global floating chat button + keyboard shortcut to open/close.
  - Context awareness: captures route, role, and primary entity (e.g., classId) when present.
  - Answers grounded in existing documentation and UI labels; avoids free-form hallucination.
  - Action shortcuts: deep-links to relevant pages or opens modals where supported.
  - Session privacy: clear indicator; easy session clear; no cross-tenant leakage.
- Next (future, not in scope now)
  - Deeper content grounding and Q&A, recommendations, grading assist.

## Detailed User Stories
- As any User, I can open a chat on any page to ask “what can I do here?” and receive relevant options.
  - Acceptance: Chat is visible on every page; shortcut works; options link correctly.
- As a Teacher, I ask “create an assignment for Class 8A” and receive a direct link to the create form with class preselected.
  - Acceptance: Link preserves class context; fallback guidance shown if context missing.
- As a Student, I ask “show my due assignments” and receive a link to the assignments view filtered to me.
  - Acceptance: Links respect my role; no access to other students’ data.
- As an Admin, I ask “open fee reports for last month” and get a deep-link to the reporting view.
  - Acceptance: Dates/filters applied when feasible; otherwise guidance provided.

## Workflows
1) User opens chat → Page context captured → Intent classification → Provide links/guidance → Optional follow-up.

## Data Model (Overview)
- ChatSession(id, userId, role, route, entityRef?, turns[], createdAt, clearedAt?)
- ChatTurn(id, sessionId, message, response, intents[], links[], safetyFlags[], createdAt)

## API Surface (Draft)
- POST /api/assistant/chat/sessions
- POST /api/assistant/chat/turns
- GET  /api/assistant/chat/sessions/:id
- DELETE /api/assistant/chat/sessions/:id

## Integrations
- Frontend (Next.js) to supply route/role context and render the chat widget.
- Auth for role and tenant; Logging/Analytics for usage metrics.

## Events & Notification Hooks
- assistant.chat.started, assistant.chat.link.clicked, assistant.chat.cleared.

## Security, Privacy & Compliance
- Tenant isolation; no cross-tenant visibility in chat.
- Minimal context capture; PII redaction in any stored transcripts; clear retention policy.
- Safety filters (toxicity, PII leak) and usage policy gates.

## Non-Functional Requirements
- Reliability: Graceful degradation when assistant unavailable; clear fallbacks.
- Performance: Open chat < 300ms; intent classification < 500ms p95.
- Observability: Usage metrics (open, intents, link clicks) with redaction.

## Operations & Runbook
- Health checks; rate limits; feature flagging for staged rollout.
- Transcript retention governance; export/delete workflows.

## Dependencies
- Auth/RBAC; Frontend shell; Logging/Analytics.

## Risks & Mitigations
- Misdirected actions → Provide links/guidance, not auto-execution.
- Privacy concerns → Data minimization, opt-in, role-scoped access.
- Overreach → Keep scope to navigation and help; defer advanced AI.

## Migration & Rollout
- Pilot the chat widget with Teachers and Admins; later expand to Students and Parents.

## Testing Strategy
- Intent detection unit tests; link routing tests; role/permission checks; latency and load tests.

## Metrics & KPIs
- Chat adoption rate (DAU/WAU), link click-through, time-to-action reduction, CSAT, incident rate.

## Roadmap
- M0–M2: Chat widget, context capture, intents, action links.
- M2–M4: Role-specific shortcuts; basic analytics; staged rollout.
- M4+: Evaluate deeper features based on feedback.

## Open Questions
- What minimal context is safe to include by default?
- Where should chat open links (new tab vs. in-place with modal)?

## Glossary
- RAG: Retrieval-Augmented Generation. CSAT: Customer Satisfaction.
