# Onboarding Form — Sections & Fields

This document enumerates the exact fields and UI hints to mirror the physical form, based on the screenshots provided. Use this as the single source of truth for the form schema and validations.

## Section 1 — Admission Details
- `admissionNumber` text (readonly for parent if generated)
- `dateOfAdmission` date
- `academicYear` select (e.g., 2025–2026)
- `gradeAppliedFor` select
- `sectionIfAllotted` select (optional)

## Section 2 — Student Personal Information
- `fullName` text (title-case helper)
- `dob` date (age validation)
- `gender` select (Male/Female/Other)
- `nationality` text
- `religion` text
- `casteCommunity` text
- `languagesKnown` chips [text]

## Section 3 — Address Details
- `permanentAddress` textarea
- `correspondenceSameAsPermanent` checkbox
- `correspondenceAddress` textarea (auto-copies when checked)
- `city`, `state`, `country` text
- `pin` text (PIN/ZIP validation)

## Section 4 — Parent/Guardian Information
- Father: `name`, `occupation`, `phone`, `email`
- Mother: `name`, `occupation`, `phone`, `email`
- Optional Guardian: `name`, `relation`, `phone`, `email`

## Section 5 — Previous School Details
- `schoolName` text
- `board` select (CBSE/ICSE/State/Other)
- `lastGradeCompleted` text/select
- `yearOfCompletion` year
- `reasonForTransfer` textarea

## Section 6 — Health & Emergency Information
- `bloodGroup` select
- `knownAllergies` textarea
- `medicalConditions` textarea
- Emergency: `contactName`, `contactNumber`, `relationship`

## Section 7 — Transport & Fee Information
- `modeOfTransport` select (School Bus/Own)
- `busRouteStop` text (required if School Bus)

## Section 8 — Technology & Consent
- `technologyConsent` checkbox (required) + display of consent text

## Section 9 — Documents Submitted
- Upload controls: `transferCertificate`, `reportCard`, `aadhaar`, `passportPhotos`, `otherDocument(label+file)`
- All uploads via signed URLs; progress bar; 10MB limit each.

## Section 10 — Declarations
- Render declaration paragraph
- E-sign captures: `parentSignatureName`, `studentSignatureName`, `signatureDate`

## Uploads
- `studentPhoto` image upload (mandatory)

## UI Guidelines
- Mobile-first layout, sectioned wizard with completion ticks
- Autosave on field blur; save indicator; discard/continue dialog
- Review page: printable preview that looks like the paper form

