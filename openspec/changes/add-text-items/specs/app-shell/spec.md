# Spec Delta

## MODIFIED Requirements

### Requirement: Main sections as tabs
The app SHALL provide three main sections, Timeline, Circles and Events, reachable from the footer tab bar. The app SHALL open on Timeline. Each section SHALL show a vertically scrollable content area with the main background color and 16 points of padding. Circles and Events SHALL show a placeholder text naming the section. Timeline SHALL show the timeline feed.

#### Scenario: App opens on Timeline
- **WHEN** the user launches the app
- **THEN** the Timeline section is shown and the Timeline tab is active

#### Scenario: Placeholder content per section
- **WHEN** the user opens Circles or Events
- **THEN** the content area shows a placeholder text that identifies that section

#### Scenario: Timeline shows the feed
- **WHEN** the user opens Timeline
- **THEN** the content area shows the timeline feed (its cards, or its empty message) and no placeholder text

### Requirement: Shell stays fixed around content
The header SHALL stay at the top and the footer tab bar at the bottom of the screen on every main section. Section content SHALL be laid out and scroll only in the space between them, never under either one. The header, footer and create button SHALL stay in place, without re-mounting or flickering, when the user switches sections. The create button SHALL only show or hide as its own requirements state.

#### Scenario: Scrolling content
- **WHEN** the user scrolls a section whose content is taller than the space available
- **THEN** the header and footer do not move, and no content is drawn underneath them

#### Scenario: Switching sections
- **WHEN** the user switches from one section to another
- **THEN** only the content area changes. The header, footer and create button stay in place, and the create button shows or hides only as "Create button hidden while creating" requires.

### Requirement: Floating create button
On every main section, except Timeline while the creation box is open, the app SHALL show a 56×56 circular create button with a primary-blue background, a 3-point border, a blue shadow and a centered `+` in 28-point bold. It SHALL sit 20 points from the right edge and 10 points above the top of the footer, above the content. It SHALL be announced as a button labeled "Create".

#### Scenario: Placement
- **WHEN** any main section is shown
- **THEN** the create button floats 20 points from the right edge and 10 points above the footer, on top of the scrolling content

#### Scenario: Pressing the create button
- **WHEN** the user taps the create button
- **THEN** the button shows press feedback and does what "Create button action per section" defines for the current section: on Timeline the creation box opens, and on Circles and Events nothing else happens

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the create button
- **THEN** it is announced as a button named "Create"

## ADDED Requirements

### Requirement: Create button action per section
Pressing the create button SHALL start creating something for the current section. On Timeline it SHALL open the creation box. On Circles (pairing a new contact) and Events (creating an event) it SHALL have no effect yet: the button shows press feedback, the section stays the same, and no error occurs.

#### Scenario: Pressing on Timeline
- **WHEN** the user taps the create button on Timeline
- **THEN** the creation box opens at the top of the Timeline

#### Scenario: Pressing on Circles
- **WHEN** the user taps the create button on Circles
- **THEN** the button shows press feedback, Circles stays shown, and nothing else happens

#### Scenario: Pressing on Events
- **WHEN** the user taps the create button on Events
- **THEN** the button shows press feedback, Events stays shown, and nothing else happens

### Requirement: Create button hidden while creating
While Timeline is shown and its creation box is open, the create button SHALL be hidden and SHALL NOT be reachable by assistive technologies. It SHALL reappear when the box closes. On Circles and Events it SHALL show even while a creation box is pending on Timeline.

#### Scenario: Hidden after opening the box
- **WHEN** the user taps the create button on Timeline
- **THEN** the creation box opens and the create button is no longer shown

#### Scenario: Back after closing the box
- **WHEN** the creation box closes through "Crear", "Cancelar" or the Android back button
- **THEN** the create button is shown again

#### Scenario: Pending draft on another section
- **WHEN** the creation box is open on Timeline and the user switches to Events
- **THEN** the create button is shown on Events, and it is hidden again when the user returns to Timeline
