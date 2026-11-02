# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Android and iOS in portrait only`
- TO: `### Requirement: Android and iOS phones and tablets in any orientation`

## MODIFIED Requirements

### Requirement: Android and iOS phones and tablets in any orientation
The app SHALL target Android and iOS phones and tablets, and SHALL follow the device orientation, in portrait and in landscape. The iOS app SHALL support iPad screen sizes. It SHALL NOT provide a web build, web-specific code paths or web configuration.

#### Scenario: Rotating the device
- **WHEN** the user rotates the phone to landscape
- **THEN** the app turns with the device and shows the phone landscape layout

#### Scenario: Rotating back
- **WHEN** the user rotates the phone back to portrait
- **THEN** the app turns back and shows the phone portrait layout

#### Scenario: Tablet
- **WHEN** the app runs on an Android tablet or an iPad, in portrait or landscape
- **THEN** it fills the screen and shows the tablet layout

#### Scenario: No web target
- **WHEN** a developer looks at the project's scripts and app configuration
- **THEN** there is no web start script and no web configuration block
