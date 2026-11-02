# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Android and iOS in portrait only`
- TO: `### Requirement: Android and iOS phones and tablets in any orientation`

## MODIFIED Requirements

### Requirement: Android and iOS phones and tablets in any orientation
The app SHALL target Android and iOS phones and tablets, in portrait and landscape. It SHALL rotate with the device and adapt its layout as the adaptive-layout capability defines. It SHALL NOT provide a web build, web-specific code paths or web configuration.

#### Scenario: Rotating the device
- **WHEN** the user rotates the phone to landscape
- **THEN** the app rotates with it and shows the phone landscape layout

#### Scenario: Opening on a tablet
- **WHEN** the app is opened on a tablet
- **THEN** it fills the tablet screen with the tablet layout for the current orientation, not a scaled-up phone screen

#### Scenario: No web target
- **WHEN** a developer looks at the project's scripts and app configuration
- **THEN** there is no web start script and no web configuration block
