## ADDED Requirements

### Requirement: Stable mobile page scale

Mobile touch surfaces SHALL disable page pinch and double-tap scaling where the
browser honors touch policy, retain scrolling/selection and prevent small-form
focus zoom. Desktop browser zoom and OS accessibility controls SHALL remain usable.

#### Scenario: Mobile forms and gestures

- **WHEN** a user focuses a form, scrolls an overlay or uses an onboarding swipe
- **THEN** controls use at least 16 CSS px, scrolling remains available and pinch
  or cancelled gestures cannot navigate or submit
- **AND** viewport safe areas and keyboard resizing are preserved

#### Scenario: Readable text

- **WHEN** the user selects a text size through 200%
- **THEN** text and controls resize persistently with responsive reflow
- **AND** the control remains reachable during onboarding and in dialogs

#### Scenario: Browser override

- **WHEN** browser policy overrides scale restrictions
- **THEN** the exact tab/PWA/device outcome is documented as an acceptance limit
- **AND** successful automated checks do not claim physical-device acceptance
