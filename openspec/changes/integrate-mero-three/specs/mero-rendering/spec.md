## ADDED Requirements

### Requirement: Shared procedural mascot

The frontend SHALL display all existing Mero appearances using the approved procedural Three.js model without requesting a raster mascot.

#### Scenario: Onboarding and profile

- **WHEN** the onboarding or profile page displays Mero
- **THEN** the shared component displays the model with the relevant reference, happy, or sad expression
- **AND** the same component replaces Mero in dashboard, chain, journey, banners, and dialogs.

### Requirement: Bounded rendering work

The frontend SHALL share one WebGL renderer and limit rendering according to visibility, avatar size, motion preferences, and device capability.

#### Scenario: Small or hidden avatar

- **WHEN** an avatar is small, outside the viewport, or the document is hidden
- **THEN** continuous animation SHALL stop
- **AND** visible static avatars SHALL update only when their presentation changes.

#### Scenario: Constrained device or reduced motion

- **WHEN** device hints indicate constrained resources or the user requests reduced motion
- **THEN** animation SHALL be disabled
- **AND** constrained devices SHALL also use reduced geometry and resolution.

#### Scenario: Renderer lifetime ends

- **WHEN** the final Mero component is destroyed
- **THEN** the animation callback, GPU model, environment, and renderer SHALL be released.

### Requirement: Graceful rendering fallback

The frontend SHALL show a procedural CSS character when Three.js cannot render.

#### Scenario: WebGL unavailable or context lost

- **WHEN** WebGL2 is unavailable, initialization fails, or the rendering context is lost
- **THEN** Mero SHALL remain visible without a raster image or blocking the application.
