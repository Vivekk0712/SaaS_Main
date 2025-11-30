# Full Education Content Module Epic — School SAS

## Summary
Manage the complete academic content lifecycle: curriculum mapping, courses, units, lessons, media, assignments, quizzes, grading, and progress tracking with parent visibility.

## Vision & Objectives
- Centralize high-quality, aligned content to improve learning outcomes.
- Streamline teacher authoring and grading with consistent tools and structures.
- Provide students and parents a clear view of progress and upcoming work.

## Scope
- In: Curriculum → course mapping, lesson authoring, media, assignments, quizzes, submissions, grading, gradebook, progress, parent portal (read-only).
- Out (initial): External marketplace sales, advanced proctoring, complex plagiarism suites (basic checks only), SCORM/LTI (v2).

## Personas
- Academic Admin: Defines curriculum, standards, and mappings.
- Teacher: Creates lessons, assignments, and assessments; grades work.
- Student: Consumes content and submits assignments/quizzes.
- Parent: Views child’s progress and feedback.

## Assumptions
- Object storage + CDN for media; WYSIWYG editor for content; authentication and RBAC available.
- Standards mapping optional (CBSE/ICSE/local curricula).

## Functional Requirements
- MVP
  - Curriculum mapping (subjects, outcomes) to courses and units.
  - Lesson authoring with text, media, links, and embedded video.
  - Assignments with due dates; file upload; basic rubric; late rules.
  - Quizzes: MCQ, short answer; timed optional; auto-grading where possible.
  - Gradebook: per course/class; export CSV/PDF; draft vs. published.
  - Progress dashboard for students; parent read-only view.
- Next (v2+)
  - Question banks, randomization, advanced types (matrix, numeric, ordering).
  - Group projects, peer review, and regrade requests.
  - Outcomes mastery reports and content reuse/versioning.

## Detailed User Stories
- As an Academic Admin, I map outcomes to units so coverage is trackable.
  - Acceptance: Outcome tags and coverage reports by unit/course.
- As a Teacher, I create lessons with media and links so students access everything in one place.
  - Acceptance: Editor autosave; media upload with size/type validation; preview.
- As a Teacher, I assign homework with rubrics so grading is consistent.
  - Acceptance: Rubric creation; rubric scoring; late submission policy.
- As a Student, I submit assignments and see confirmation receipts.
  - Acceptance: File checks; receipts; resubmission rules.
- As a Teacher, I author quizzes with auto-graded questions.
  - Acceptance: Question bank; randomized order; timer (optional).
- As a Teacher, I publish grades and feedback when ready.
  - Acceptance: Draft vs. published; bulk release; comments.
- As a Parent, I view progress and upcoming work.
  - Acceptance: Read-only scope limited to my child; notification hooks.

## Workflows
1) Curriculum setup → Course → Units → Lessons → Assignments/Quizzes → Submissions → Grading → Reports.
2) Grade publishing: Draft grades → Review → Publish → Notify.

## Data Model (Overview)
- Curriculum(id, name, standards[])
- Outcome(id, code, description, gradeLevel)
- Course(id, subject, gradeLevel, outcomes[])
- Unit(id, courseId, title, outcomes[])
- Lesson(id, unitId, title, body, resources[], attachments[], version)
- Assignment(id, courseId, title, dueAt, rubricId, maxScore, latePolicy)
- Quiz(id, courseId, title, timeLimit, questions[])
- Question(id, type, stem, choices[], answerKey, points)
- Submission(id, userId, itemType, itemId, payloadRef, submittedAt, grade)
- Grade(id, submissionId, score, rubricScores[], status, publishedAt)
- Progress(id, userId, courseId, metrics)

## API Surface (Draft)
- POST /api/curriculum/outcomes
- POST /api/courses
- POST /api/courses/:id/units
- POST /api/units/:id/lessons
- POST /api/courses/:id/assignments
- POST /api/courses/:id/quizzes
- POST /api/submissions
- POST /api/grades/publish
- GET /api/gradebook/:courseId/export

## Integrations
- Storage/CDN for media; plagiarism check service (v2) for originality reports; Notification module for updates.

## Events & Notification Hooks
- content.assignment.posted, content.quiz.posted, content.grade.published, content.assignment.reminder.

## Security, Privacy & Compliance
- Fine-grained access (student/teacher/parent); private resource URLs; signed links with expiry.
- FERPA/GDPR-aware data minimization; audit logs for grade edits.

## Non-Functional Requirements
- Availability: 99.9% for authoring and student consumption flows.
- Performance: Lesson load p95 < 2s via CDN; editor autosave < 200ms.
- Reliability: Draft autosave; offline-safe uploads with resumable protocol.

## Operations & Runbook
- Media transcoding queues; virus scan on upload; CDN cache invalidation on publish.
- Backup and restore for course content and grades.

## Dependencies
- Notification module; Auth/RBAC; Storage and CDN.

## Risks & Mitigations
- Large media → Transcoding, bitrate ladders, upload limits.
- Academic integrity → Basic plagiarism checks; rubric transparency; AI assist v2.

## Migration & Rollout
- Seed demo course templates; onboard pilot teachers; capture feedback loops.

## Testing Strategy
- Editor autosave unit tests; quiz auto-grader tests; rubric scoring unit tests.
- Export/import round-trip tests for gradebook.

## Metrics & KPIs
- Weekly active teachers creating content; on-time submission rate; grade publish latency; parent portal weekly active users.

## Roadmap
- M0–M2: Curriculum, lessons, assignments, quizzes, gradebook basics.
- M2–M4: Question bank, randomization, progress reports.
- M4+: Group work, peer review, mastery analytics, versioning.

## Open Questions
- Cross-course content reuse permissions?
- Standardized outcomes mapping per region—single or multiple schemas?

## Glossary
- Rubric: Scoring guide with criteria and levels. Mastery: Outcome attainment measure.

