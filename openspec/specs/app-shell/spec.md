# app-shell Specification

## Purpose

Defines the persistent frame that surrounds every main BlueShare screen: the sticky header, the footer tab navigation, the floating create button, and how screen content sits between them.

## Requirements

### Requirement: Main sections as tabs
The app SHALL provide three main sections, Timeline, Circles and Events, reachable from the footer tab bar. The app SHALL open on Timeline. Each section SHALL show a vertically scrollable content area with the main background color, 16 points of padding, and a placeholder text naming the section.

#### Scenario: App opens on Timeline
- **WHEN** the user launches the app
- **THEN** the Timeline section is shown and the Timeline tab is active

#### Scenario: Placeholder content per section
- **WHEN** the user opens any of the three sections
- **THEN** the content area shows a placeholder text that identifies that section

### Requirement: Shell stays fixed around content
The header SHALL stay at the top and the footer tab bar at the bottom of the screen on every main section. Section content SHALL be laid out and scroll only in the space between them, never under either one. The header, footer and create button SHALL stay in place, without re-mounting or flickering, when the user switches sections.

#### Scenario: Scrolling content
- **WHEN** the user scrolls a section whose content is taller than the space available
- **THEN** the header and footer do not move, and no content is drawn underneath them

#### Scenario: Switching sections
- **WHEN** the user switches from one section to another
- **THEN** only the content area changes. The header, footer and create button stay in place.

### Requirement: Safe-area aware header and footer
The header SHALL be 70 points tall plus the device's top safe-area inset, with its controls placed below the inset. The footer SHALL be 75 points tall plus the bottom safe-area inset, with its buttons placed above the inset.

#### Scenario: Device with notch and gesture bar
- **WHEN** the app runs on a device with a status bar or notch at the top and a home indicator or gesture bar at the bottom
- **THEN** no header control is covered by the status bar or notch, and no footer button is covered by the home indicator or gesture bar

### Requirement: Header layout
The header SHALL show a single row with the menu button on the left, the title/search field in the middle filling the remaining width, and the avatar on the right. It SHALL have the card background color, a 2-point bottom border in the border color, and 16 points of horizontal padding.

#### Scenario: Header contents
- **WHEN** any main section is shown
- **THEN** the header shows the menu button, the title field reading "BlueShare", and the avatar, in that order from left to right

### Requirement: Menu button
The header SHALL include a menu button showing the `≡` glyph, at least 44×44 points, with a primary-blue glyph and 2-point border, the creation background color and a 10-point corner radius. It SHALL be announced to assistive technologies as a button labeled "Menu". Pressing it SHALL have no effect yet.

#### Scenario: Pressing the menu button
- **WHEN** the user taps the menu button
- **THEN** the button shows press feedback and nothing else happens: no navigation, no error

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the menu button
- **THEN** it is announced as a button named "Menu"

### Requirement: Title field shows the app name at rest
The title field SHALL be an editable single-line text field, 42 points tall, with a 2-point border in the strong-ink color, a 12-point corner radius and the muted surface background. At rest it SHALL display the text "BlueShare" centered, in 16-point bold.

#### Scenario: Initial state
- **WHEN** the app opens
- **THEN** the title field shows "BlueShare" centered, in bold, with the strong-ink border

### Requirement: Title field becomes a search input on focus
When the title field gains focus, its border SHALL change to primary blue, its background to the card background, and its text alignment to left. If its text is "BlueShare", the text SHALL be cleared so the placeholder "Buscar..." shows.

#### Scenario: Focusing the field at rest
- **WHEN** the user taps the title field while it shows "BlueShare"
- **THEN** the field becomes empty, shows the placeholder "Buscar...", has a primary-blue border and card background, the keyboard opens, and typed text is left-aligned

#### Scenario: Focusing the field with typed text
- **WHEN** the user taps the title field while it holds text other than "BlueShare"
- **THEN** the text is kept and the field shows its focused style

### Requirement: Title field restores the app name on blur
When the title field loses focus and holds only whitespace or nothing, it SHALL return to its rest state showing "BlueShare". When it loses focus holding other text, it SHALL keep that text. Typing or submitting SHALL NOT start a search yet.

#### Scenario: Leaving the field empty
- **WHEN** the user clears the field (or types only spaces) and dismisses the keyboard or taps elsewhere
- **THEN** the field shows "BlueShare" centered again with its rest style

#### Scenario: Leaving the field with text
- **WHEN** the user types "abuela" and then dismisses the keyboard
- **THEN** the field keeps showing "abuela" with its rest style

#### Scenario: Submitting
- **WHEN** the user presses the keyboard's submit key
- **THEN** no search runs, the section content stays the same, and no error occurs

### Requirement: Avatar
The header SHALL show a 42×42 circular avatar with a 2-point strong-ink border, the avatar background color and a centered `👵` emoji. It SHALL be exposed to assistive technologies with the label "Profile". It SHALL be display-only and not respond to taps.

#### Scenario: Avatar display
- **WHEN** the header is shown
- **THEN** the avatar circle shows the `👵` emoji centered, and tapping it does nothing

### Requirement: Footer tab bar
The footer SHALL have the card background color, a 2-point top border in the border color and 10 points of horizontal padding. It SHALL hold three equal-width buttons labeled Timeline, Circles and Events, in that order, each 44 points tall with 4 points of horizontal margin, a 10-point corner radius, a 2-point border and 14-point bold labels.

#### Scenario: Footer contents
- **WHEN** any main section is shown
- **THEN** the footer shows Timeline, Circles and Events buttons of equal width, in that order

### Requirement: Active tab indication
The button for the current section SHALL show the active style: a primary-hover background, a 2-point border in the primary-deep color, the on-primary label color and a soft blue shadow. The label SHALL meet a 4.5:1 contrast ratio against that background. The other buttons SHALL show the inactive style: the muted surface background, a 2-point border in the dark border color, and the secondary text color. Assistive technologies SHALL get each button as a tab, with its selected state.

#### Scenario: Active state follows the section
- **WHEN** the current section is Circles
- **THEN** the Circles button has the active style and is reported as selected, and the Timeline and Events buttons have the inactive style

### Requirement: Tab switching
Pressing a footer button SHALL show its section and move the active style to that button. Pressing the button of the section already shown SHALL leave it shown.

#### Scenario: Switching to Events
- **WHEN** the user taps Events while on Timeline
- **THEN** the Events section is shown and the Events button becomes active

#### Scenario: Tapping the active tab
- **WHEN** the user taps Timeline while on Timeline
- **THEN** Timeline stays shown and no error occurs

### Requirement: Floating create button
On every main section, the app SHALL show a 56×56 circular create button with a primary-blue background, a 3-point border, a blue shadow and a centered `+` in 28-point bold. It SHALL sit 20 points from the right edge and 10 points above the top of the footer, above the content. It SHALL be announced as a button labeled "Create". Pressing it SHALL have no effect yet.

#### Scenario: Placement
- **WHEN** any main section is shown
- **THEN** the create button floats 20 points from the right edge and 10 points above the footer, on top of the scrolling content

#### Scenario: Pressing the create button
- **WHEN** the user taps the create button
- **THEN** the button shows press feedback and nothing else happens

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the create button
- **THEN** it is announced as a button named "Create"

### Requirement: Accessible touch targets
Every interactive control in the shell SHALL have a touch target of at least 44×44 points. The one exception is the title field: it follows the 42-point height of the design and is much wider than 44 points.

#### Scenario: Footer and header buttons
- **WHEN** the touch targets of the menu button, the footer buttons and the create button are measured
- **THEN** each is at least 44 points wide and 44 points tall
