# Full Education Content — User Stories

User stories for the Content epic with acceptance criteria and concise Gherkin scenarios.

---

## CONT-001 Map Outcomes to Courses
- Story: As an Academic Admin, I map curriculum outcomes to courses/units so alignment is trackable.
- Acceptance Criteria:
  - Outcome tags attach to units; coverage reports by course.
- Gherkin:
  - Given outcomes for Grade 8 Science
  - When I tag Unit 2 with outcomes O1 and O3
  - Then the coverage report shows O1 and O3 covered in Unit 2

## CONT-002 Lesson Authoring with Media
- Story: As a Teacher, I create lessons with text, media, and links.
- Acceptance Criteria:
  - Editor autosave; media upload with size/type validation; preview.
- Gherkin:
  - Given a new lesson draft
  - When I add images and a YouTube link
  - Then the preview renders media and the draft autosaves

## CONT-003 Assignment with Rubric
- Story: As a Teacher, I assign homework with a rubric for consistent grading.
- Acceptance Criteria:
  - Rubric creation; rubric scoring; late submission rules.
- Gherkin:
  - Given an assignment with a 3-criterion rubric
  - When students submit
  - Then I can score per criterion and publish grades

## CONT-004 Quiz Authoring & Auto-grading
- Story: As a Teacher, I build quizzes with auto-graded questions.
- Acceptance Criteria:
  - MCQ/short answer; randomized order; optional timer; auto-grade.
- Gherkin:
  - Given a quiz with 10 MCQs
  - When a student submits
  - Then the system auto-grades and records the score

## CONT-005 Student Submission Flow
- Story: As a Student, I submit assignments and receive confirmation.
- Acceptance Criteria:
  - File size/type checks; receipts; resubmission policy enforced.
- Gherkin:
  - Given my PDF homework
  - When I upload before the due time
  - Then I see a submission receipt and can view my file

## CONT-006 Grade Publishing & Feedback
- Story: As a Teacher, I publish grades and feedback when ready.
- Acceptance Criteria:
  - Draft vs published; bulk release; comments; audit logs of changes.
- Gherkin:
  - Given draft grades for Assignment 1
  - When I click Publish
  - Then students and parents can view grades and feedback

## CONT-007 Parent Progress View
- Story: As a Parent, I view my child’s progress and upcoming work.
- Acceptance Criteria:
  - Read-only; privacy scoping per child; notification hooks.
- Gherkin:
  - Given I’m linked to Student S1
  - When I open the progress dashboard
  - Then I see S1’s grades and due assignments only

## CONT-008 Gradebook Export
- Story: As a Teacher, I export the gradebook to CSV/PDF for records.
- Acceptance Criteria:
  - Filters by date/assignment; CSV/PDF formats; totals included.
- Gherkin:
  - Given my course gradebook
  - When I export to CSV
  - Then the file includes student rows, scores, and totals

## CONT-009 Question Bank & Randomization (v2)
- Story: As a Teacher, I build a question bank and randomize quizzes.
- Acceptance Criteria:
  - Tagged questions; random sets per student; integrity settings.
- Gherkin:
  - Given a bank of 100 questions tagged Algebra
  - When I create a quiz of 20 random questions
  - Then each student gets a unique set with equivalent difficulty

## CONT-010 Group Project & Peer Review (v2)
- Story: As a Teacher, I assign a group project with peer review.
- Acceptance Criteria:
  - Group formation; shared submission; peer review rubric; moderation.
- Gherkin:
  - Given groups of 4 students
  - When submissions are in and peer reviews complete
  - Then I can view peer scores and finalize moderated grades

