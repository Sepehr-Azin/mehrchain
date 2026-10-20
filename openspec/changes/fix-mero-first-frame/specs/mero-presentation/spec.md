## ADDED Requirements

### Requirement: Stable first-frame presentation

The shared Mero component SHALL reserve its layout while loading and SHALL reveal only a valid Three.js frame, with its glow, without displaying an alternate character.

#### Scenario: First launch

- **WHEN** the scene is loading or its first frame is rendering
- **THEN** the mascot area SHALL retain its dimensions without a substitute character or isolated glow
- **AND** the first successful copied model frame SHALL reveal the character and glow together, respecting reduced motion.

### Requirement: Bounded model-frame reuse

The renderer SHALL retain at most eight in-memory model frames matching the expression, glow strength, and color, and SHALL share one bounded WebGL scene.

#### Scenario: Route navigation

- **WHEN** another Mero component attaches with matching visual options
- **THEN** an available matching model frame SHALL be copied immediately
- **AND** attachment within 1.5 seconds of the last target leaving SHALL cancel GPU release.

#### Scenario: Rendering unavailable

- **WHEN** initialization fails or the WebGL context is lost
- **THEN** matching valid model frames SHALL remain visible
- **AND** a component without a valid matching frame SHALL show a neutral accessible unavailable presentation without blocking the page.

#### Scenario: Teardown during initialization

- **WHEN** the application is destroyed while the scene module is loading
- **THEN** all owned resources SHALL be released and completion SHALL NOT restart rendering.
