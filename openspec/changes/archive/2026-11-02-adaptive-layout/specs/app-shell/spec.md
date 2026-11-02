# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Safe-area aware header and footer`
- TO: `### Requirement: Safe-area aware header and tab bar`
- FROM: `### Requirement: Footer tab bar`
- TO: `### Requirement: Tab bar`

## MODIFIED Requirements

### Requirement: Main sections as tabs
The app SHALL provide three main sections, Timeline, Circles and Events, reachable from the tab bar. The app SHALL open on Timeline. Each section SHALL show a vertically scrollable content area with the main background color and the content padding of the current size set (16 points on phones). Circles and Events SHALL show a placeholder text naming the section. Timeline SHALL show the timeline feed.

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
The header SHALL stay at the top of the screen on every main section, and the tab bar SHALL stay where the current layout places it: at the bottom in portrait, right below the header in landscape. Section content SHALL be laid out and scroll only in the space left by them, never under either one. The header, tab bar and create button SHALL stay in place, without re-mounting or flickering, when the user switches sections. The create button SHALL only show or hide as its own requirements state.

#### Scenario: Scrolling content
- **WHEN** the user scrolls a section whose content is taller than the space available
- **THEN** the header and tab bar do not move, and no content is drawn underneath them

#### Scenario: Scrolling content in landscape
- **WHEN** the user scrolls the Timeline in a landscape layout
- **THEN** the cards scroll below the tab bar and are never drawn under it or under the header

#### Scenario: Switching sections
- **WHEN** the user switches from one section to another
- **THEN** only the content area changes. The header, tab bar and create button stay in place, and the create button shows or hides only as "Create button hidden while creating" requires.

### Requirement: Safe-area aware header and tab bar
The header SHALL be as tall as the current layout's header height plus the device's top safe-area inset, with its controls placed below the inset. A tab bar at the bottom SHALL be as tall as the layout's tab bar height plus the bottom safe-area inset, with its buttons placed above the inset. A tab bar below the header SHALL be as tall as the layout's tab bar height. The header and the tab bar SHALL keep their controls clear of the left and right safe-area insets. On phones in portrait the header is 70 points and the tab bar 75 points.

#### Scenario: Device with notch and gesture bar
- **WHEN** the app runs on a device with a status bar or notch at the top and a home indicator or gesture bar at the bottom
- **THEN** no header control is covered by the status bar or notch, and no tab bar button is covered by the home indicator or gesture bar

#### Scenario: Side insets in landscape
- **WHEN** the app runs in landscape with a camera cutout or navigation bar on one side
- **THEN** no header control and no tab is covered by it

### Requirement: Header layout
The header SHALL show a single row with the menu button on the left, the title/search field in the middle, and the avatar on the right. The title field SHALL fill the remaining width, up to the current layout's maximum title width, and be centered between the menu button and the avatar. The header SHALL have the card background color, a 2-point bottom border in the border color, and the horizontal padding of the current size set (16 points on phones).

#### Scenario: Header contents
- **WHEN** any main section is shown
- **THEN** the header shows the menu button, the title field reading "BlueShare", and the avatar, in that order from left to right

#### Scenario: Title field on a wide header
- **WHEN** the header is wider than the title field's maximum width plus the menu button and avatar
- **THEN** the title field is drawn at its maximum width, centered between the menu button and the avatar

### Requirement: Tab bar
The tab bar SHALL have the card background color, a 2-point border in the border color on the side facing the content, and 10 points of horizontal padding. It SHALL hold three buttons labeled Timeline, Circles and Events, in that order, of equal width. In the phone portrait layout they SHALL share the bar's width; in other layouts they SHALL have the layout's tab width and be centered. Each SHALL be as tall as the size set's tab height (44 points on phones), with 4 points of horizontal margin, a 10-point corner radius, a 2-point border and bold labels of the size set's tab label size (14 points on phones).

#### Scenario: Footer contents
- **WHEN** any main section is shown
- **THEN** the tab bar shows Timeline, Circles and Events buttons of equal width, in that order

#### Scenario: Centered tabs on a wide screen
- **WHEN** the tablet portrait layout is used
- **THEN** the three tabs are each 150 points wide and centered in the bar, instead of stretching across it

### Requirement: Tab switching
Pressing a tab bar button SHALL show its section and move the active style to that button. Pressing the button of the section already shown SHALL leave it shown.

#### Scenario: Switching to Events
- **WHEN** the user taps Events while on Timeline
- **THEN** the Events section is shown and the Events button becomes active

#### Scenario: Tapping the active tab
- **WHEN** the user taps Timeline while on Timeline
- **THEN** Timeline stays shown and no error occurs

#### Scenario: Switching from the top tab bar
- **WHEN** the user taps Circles in the tab bar below the header in a landscape layout
- **THEN** the Circles section is shown and the Circles button becomes active

### Requirement: Floating create button
On every main section, except Timeline while the creation box is open, the app SHALL show a circular create button with a primary-blue background, a 3-point border, a blue shadow and a centered bold `+`, sized by the current size set (56 points with a 28-point `+` on phones). It SHALL sit where the current layout places it (on phones in portrait, 20 points from the right edge and 10 points above the top of the tab bar), above the content. It SHALL be announced as a button labeled "Create".

#### Scenario: Placement
- **WHEN** any main section is shown in the phone portrait layout
- **THEN** the create button floats 20 points from the right edge and 10 points above the tab bar, on top of the scrolling content

#### Scenario: Placement in landscape
- **WHEN** any main section is shown in a landscape layout
- **THEN** the create button floats near the bottom right corner, clear of the safe-area insets, on top of the scrolling content

#### Scenario: Pressing the create button
- **WHEN** the user taps the create button
- **THEN** the button shows press feedback and does what "Create button action per section" defines for the current section: on Timeline the creation box opens, and on Circles and Events nothing else happens

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the create button
- **THEN** it is announced as a button named "Create"

### Requirement: Title field restores the app name on blur
When the title field loses focus and holds only whitespace or nothing, it SHALL return to its rest state showing "BlueShare". When it loses focus holding other text, it SHALL keep that text. Typing or submitting SHALL NOT start a search yet. Rotating the device SHALL NOT make the field lose focus, even if the keyboard briefly hides during the rotation.

#### Scenario: Leaving the field empty
- **WHEN** the user clears the field (or types only spaces) and dismisses the keyboard or taps elsewhere
- **THEN** the field shows "BlueShare" centered again with its rest style

#### Scenario: Leaving the field with text
- **WHEN** the user types "abuela" and then dismisses the keyboard
- **THEN** the field keeps showing "abuela" with its rest style

#### Scenario: Submitting
- **WHEN** the user presses the keyboard's submit key
- **THEN** no search runs, the section content stays the same, and no error occurs

#### Scenario: Rotating while typing
- **WHEN** the user is typing "nieta" in the title field and rotates the device
- **THEN** the field keeps its focus, its focused style and "nieta", and the keyboard is open again after the rotation
