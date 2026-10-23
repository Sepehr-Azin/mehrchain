## ADDED Requirements

### Requirement: Platform-specific update discovery

The application SHALL offer only a newer stable Android release whose signed APK
manifest matches the trusted repository, application ID and pinned certificate.
Discovery SHALL use bounded, cacheable public requests without credentials.

#### Scenario: Eligible release

- **WHEN** an Android build discovers a higher semantic version and versionCode
- **THEN** it offers Update and Later, preserving the running session and drafts
- **AND** Update opens the validated HTTPS APK URL after explicit consent

#### Scenario: Ineligible or unavailable release

- **WHEN** metadata is invalid, older, draft, prerelease, unsigned or unavailable
- **THEN** no APK upgrade is offered and habit use remains available
- **AND** an explicit retry remains available without rapid background retries

#### Scenario: Web update

- **WHEN** the web service worker reports a ready version
- **THEN** the app offers a user-confirmed reload separately from Android updates
- **AND** opening release notes does not dismiss the update

### Requirement: Verifiable publication

Official publication SHALL require an aligned signed APK with the expected app ID,
certificate, versionName, strictly increasing versionCode and SHA-256 checksum.

#### Scenario: Missing signing material or invalid tag

- **WHEN** an official publication lacks signing configuration or has mismatched metadata
- **THEN** publication fails without substituting a debug or unsigned APK

#### Scenario: Release candidate

- **WHEN** the version contains a prerelease suffix
- **THEN** GitHub marks the release as prerelease and stable discovery excludes it
