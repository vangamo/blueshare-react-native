# Spec Delta

## Purpose

Defines where and how BlueShare runs: the supported platforms and orientation, the requirement to keep running in Expo Go, the startup splash behavior, and that the shipped app holds only BlueShare content, with no Expo starter leftovers.

## ADDED Requirements

### Requirement: Android and iOS in portrait only
The app SHALL target Android and iOS phones in portrait orientation. It SHALL NOT provide a web build, web-specific code paths or web configuration.

#### Scenario: Rotating the device
- **WHEN** the user rotates the phone to landscape
- **THEN** the app stays in portrait layout

#### Scenario: No web target
- **WHEN** a developer looks at the project's scripts and app configuration
- **THEN** there is no web start script and no web configuration block

### Requirement: Runs in Expo Go
The app SHALL run in Expo Go for the project's SDK version. It SHALL NOT need a development build or native modules beyond those bundled in Expo Go.

#### Scenario: Opening the app in Expo Go
- **WHEN** a developer starts the dev server and opens the project in Expo Go on Android
- **THEN** the app loads and shows the Timeline section without native-module errors

### Requirement: Native splash screen until first render
On launch, the app SHALL show the native splash screen configured in the app configuration, and hide it once the app shell has rendered. There SHALL be no extra animated splash overlay after it.

#### Scenario: Cold start
- **WHEN** the user launches the app
- **THEN** the native splash screen shows, then the app shell appears directly, with no animated Expo logo in between

#### Scenario: Splash never gets stuck
- **WHEN** the app shell finishes its first render
- **THEN** the splash screen is hidden and the shell is interactive

### Requirement: No starter demo content
The app SHALL NOT contain or reach Expo starter demo content: no "Welcome to Expo" or "Explore" screens, no Expo or React demo images, no project-reset script, and no links to Expo documentation in the UI.

#### Scenario: Old starter route
- **WHEN** the app is opened with a deep link to the old `/explore` route
- **THEN** the starter Explore screen is not shown

#### Scenario: Visible sections
- **WHEN** the user goes through every footer tab
- **THEN** only Timeline, Circles and Events appear, none with Expo starter content
