# Spec Delta

## ADDED Requirements

### Requirement: Layout follows the window size
The shell SHALL use the tablet layout when the shorter side of the app window is at least 600 points. Otherwise it SHALL use the phone landscape layout when the window is less than 500 points tall, and the phone portrait layout in every other case. The layout SHALL depend only on the window size, not on the device model or a fixed orientation, and SHALL update while the app is open.

#### Scenario: Phone held upright
- **WHEN** the app window is 411 points wide and 914 points tall
- **THEN** the shell uses the phone portrait layout

#### Scenario: Phone turned sideways
- **WHEN** the app window is 914 points wide and 411 points tall
- **THEN** the shell uses the phone landscape layout

#### Scenario: Tablet in portrait
- **WHEN** the app window is 800 points wide and 1280 points tall
- **THEN** the shell uses the tablet layout

#### Scenario: Tablet in landscape
- **WHEN** the app window is 1280 points wide and 800 points tall
- **THEN** the shell uses the tablet layout, with the tabs in the footer at the bottom

#### Scenario: Narrow window on a tablet
- **WHEN** the app runs in split screen in a window 400 points wide and 1280 points tall
- **THEN** the shell uses the phone portrait layout

#### Scenario: Rotating while the app is open
- **WHEN** the user rotates a phone from portrait to landscape and back
- **THEN** the shell switches to the phone landscape layout and then back to the phone portrait layout, without restarting the app

### Requirement: Tab row under the header on short windows
In the phone landscape layout, the section tabs SHALL be shown in a 56-point row directly under the header, and no footer SHALL be shown. The row SHALL have the card background and a 2-point bottom border in the border color. Its tabs SHALL be centered as a group with 12 points between them, each 44 points tall, as wide as its label plus 16 points of padding on each side, with a 10-point corner radius, a 2-point border and a 14-point bold label.

#### Scenario: Tabs move under the header
- **WHEN** the shell uses the phone landscape layout
- **THEN** Timeline, Circles and Events appear in that order in a row right under the header, centered, and there is no footer at the bottom of the screen

#### Scenario: Same tab behavior as the footer
- **WHEN** the user taps Circles in the row under the header
- **THEN** the Circles section is shown, the Circles tab gets the active style and is reported as selected, and the other tabs keep the inactive style

### Requirement: Tablet footer
In the tablet layout, the footer SHALL be 80 points tall plus the bottom safe-area inset, with the card background color and a 2-point top border in the border color. It SHALL hold the Timeline, Circles and Events tabs, in that order, centered as a group with 16 points between them. Each tab SHALL be 150 points wide and 48 points tall, with a 12-point corner radius, a 2-point border and a 15-point bold label.

#### Scenario: Footer on a tablet
- **WHEN** the shell uses the tablet layout, in portrait or landscape
- **THEN** the footer shows three 150-point tabs centered as a group, not stretched across the width

### Requirement: Header in the phone landscape and tablet layouts
In the phone landscape layout, the header SHALL be 55 points tall plus the top inset, with 16 points of horizontal padding, and the title field SHALL be at most 300 points wide. In the tablet layout, the header SHALL be 75 points tall plus the top inset, with 24 points of horizontal padding, and the title field SHALL be at most 350 points wide. In both layouts the title field SHALL be centered between the menu button and the avatar.

#### Scenario: Wide header
- **WHEN** the shell uses the phone landscape or the tablet layout on a window wider than the title field's maximum width plus the menu button and avatar
- **THEN** the title field stays at its maximum width, centered between the menu button and the avatar, with empty space on both sides

### Requirement: Create button in the phone landscape and tablet layouts
In the phone landscape layout, the create button SHALL be 48×48 points with a 24-point `+`, and sit 20 points from the right edge and 15 points above the bottom edge of the safe area. In the tablet layout, it SHALL be 60×60 points with a 30-point `+`, and sit 28 points from the right edge of the safe area and 15 points above the top of the footer. Its look, label and behavior SHALL stay the same as in the phone portrait layout.

#### Scenario: Placement without a footer
- **WHEN** the shell uses the phone landscape layout
- **THEN** the create button floats in the bottom-right corner, 20 points from the right edge and 15 points above the bottom of the safe area, on top of the content

#### Scenario: Placement on a tablet
- **WHEN** the shell uses the tablet layout
- **THEN** the 60-point create button floats 28 points from the right edge and 15 points above the footer

### Requirement: Content column
Section content SHALL sit in a column centered horizontally inside the content area. The column SHALL be at most 550 points wide in the phone layouts and at most 500 points wide in the tablet layout. The content area SHALL have 16 points of padding in the phone layouts and 24 points in the tablet layout. The space beside the column SHALL show the main background color and scroll with the content.

#### Scenario: Wide window
- **WHEN** a section is shown in the tablet layout on a window 1280 points wide
- **THEN** the section content is at most 500 points wide and centered, with the main background on both sides

#### Scenario: Narrow window
- **WHEN** a section is shown in the phone portrait layout on a window 411 points wide
- **THEN** the section content fills the width minus 16 points of padding on each side

### Requirement: Layout changes keep the app state
When the layout changes while the app is open, the shell SHALL keep the current section and the text in the title field. It SHALL NOT restart the app or return to Timeline.

#### Scenario: Rotating on Circles with text typed
- **WHEN** the user is on Circles, has typed "abuela" in the title field, and rotates the phone to landscape
- **THEN** the Circles tab is still active in the row under the header, Circles is still shown, and the title field still holds "abuela"

## MODIFIED Requirements

### Requirement: Main sections as tabs
The app SHALL provide three main sections, Timeline, Circles and Events, reachable from the section tabs (in the footer, or in the row under the header in the phone landscape layout). The app SHALL open on Timeline. Each section SHALL show a vertically scrollable content area with the main background color, laid out as described in "Content column", and a placeholder text naming the section.

#### Scenario: App opens on Timeline
- **WHEN** the user launches the app
- **THEN** the Timeline section is shown and the Timeline tab is active

#### Scenario: Placeholder content per section
- **WHEN** the user opens any of the three sections
- **THEN** the content area shows a placeholder text that identifies that section

### Requirement: Shell stays fixed around content
The header SHALL stay at the top of the screen on every main section. The section tabs SHALL stay at the bottom in the footer, or directly under the header in the phone landscape layout. Section content SHALL be laid out and scroll only in the remaining space, never under the header or the tabs. The header, tabs and create button SHALL stay in place, without re-mounting or flickering, when the user switches sections.

#### Scenario: Scrolling content
- **WHEN** the user scrolls a section whose content is taller than the space available
- **THEN** the header and footer do not move, and no content is drawn underneath them

#### Scenario: Scrolling content in landscape
- **WHEN** the user scrolls a section in the phone landscape layout
- **THEN** the header and the tab row under it do not move, and no content is drawn underneath them

#### Scenario: Switching sections
- **WHEN** the user switches from one section to another
- **THEN** only the content area changes. The header, tabs and create button stay in place.

### Requirement: Safe-area aware header and footer
The header SHALL be its layout's header height (70 points in the phone portrait layout) plus the device's top safe-area inset, with its controls placed below the inset. The footer, where shown, SHALL be its layout's footer height (75 points in the phone portrait layout) plus the bottom safe-area inset, with its buttons placed above the inset. The header, the tab row and the footer SHALL keep their controls clear of the left and right safe-area insets.

#### Scenario: Device with notch and gesture bar
- **WHEN** the app runs on a device with a status bar or notch at the top and a home indicator or gesture bar at the bottom
- **THEN** no header control is covered by the status bar or notch, and no footer button is covered by the home indicator or gesture bar

#### Scenario: Camera cutout on the side in landscape
- **WHEN** the app runs in landscape on a device whose camera cutout or navigation buttons sit on the left or right edge
- **THEN** the menu button, the avatar, the tabs and the create button are not covered by the cutout or the navigation buttons

### Requirement: Header layout
The header SHALL show a single row with the menu button on the left, the title/search field in the middle and the avatar on the right. It SHALL have the card background color and a 2-point bottom border in the border color. In the phone portrait layout, the title field SHALL fill the remaining width and the header SHALL have 16 points of horizontal padding.

#### Scenario: Header contents
- **WHEN** any main section is shown
- **THEN** the header shows the menu button, the title field reading "BlueShare", and the avatar, in that order from left to right

### Requirement: Title field shows the app name at rest
The title field SHALL be an editable single-line text field with a 2-point border in the strong-ink color, a 12-point corner radius and the muted surface background. It SHALL be 42 points tall with 16-point text in the phone layouts, and 46 points tall with 17-point text in the tablet layout. At rest it SHALL display the text "BlueShare" centered, in bold.

#### Scenario: Initial state
- **WHEN** the app opens
- **THEN** the title field shows "BlueShare" centered, in bold, with the strong-ink border

#### Scenario: Tablet size
- **WHEN** the shell uses the tablet layout
- **THEN** the title field is 46 points tall and its text is 17 points

### Requirement: Avatar
The header SHALL show a circular avatar with a 2-point strong-ink border, the avatar background color and a centered `👵` emoji. It SHALL be 42×42 points in the phone layouts and 46×46 points in the tablet layout. It SHALL be exposed to assistive technologies with the label "Profile". It SHALL be display-only and not respond to taps.

#### Scenario: Avatar display
- **WHEN** the header is shown
- **THEN** the avatar circle shows the `👵` emoji centered, and tapping it does nothing

#### Scenario: Tablet size
- **WHEN** the shell uses the tablet layout
- **THEN** the avatar is 46×46 points

### Requirement: Footer tab bar
In the phone portrait layout, the footer SHALL have the card background color, a 2-point top border in the border color and 10 points of horizontal padding. It SHALL hold three equal-width buttons labeled Timeline, Circles and Events, in that order, each 44 points tall with 4 points of horizontal margin, a 10-point corner radius, a 2-point border and 14-point bold labels.

#### Scenario: Footer contents
- **WHEN** any main section is shown in the phone portrait layout
- **THEN** the footer shows Timeline, Circles and Events buttons of equal width, in that order

### Requirement: Tab switching
Pressing a section tab, in the footer or in the row under the header, SHALL show its section and move the active style to that tab. Pressing the tab of the section already shown SHALL leave it shown.

#### Scenario: Switching to Events
- **WHEN** the user taps Events while on Timeline
- **THEN** the Events section is shown and the Events button becomes active

#### Scenario: Tapping the active tab
- **WHEN** the user taps Timeline while on Timeline
- **THEN** Timeline stays shown and no error occurs

### Requirement: Floating create button
On every main section, the app SHALL show a circular create button with a primary-blue background, a 3-point border, a blue shadow and a centered bold `+`, above the content. In the phone portrait layout it SHALL be 56×56 points with a 28-point `+`, and sit 20 points from the right edge of the safe area and 10 points above the top of the footer. It SHALL be announced as a button labeled "Create". Pressing it SHALL have no effect yet.

#### Scenario: Placement
- **WHEN** any main section is shown in the phone portrait layout
- **THEN** the create button floats 20 points from the right edge and 10 points above the footer, on top of the scrolling content

#### Scenario: Pressing the create button
- **WHEN** the user taps the create button
- **THEN** the button shows press feedback and nothing else happens

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the create button
- **THEN** it is announced as a button named "Create"

### Requirement: Accessible touch targets
Every interactive control in the shell SHALL have a touch target of at least 44×44 points in every layout, even where a design mock draws it smaller. The one exception is the title field: it follows the 42-point height of the design and is much wider than 44 points.

#### Scenario: Footer and header buttons
- **WHEN** the touch targets of the menu button, the footer buttons and the create button are measured
- **THEN** each is at least 44 points wide and 44 points tall

#### Scenario: Tabs under the header
- **WHEN** the touch targets of the tabs in the phone landscape layout's tab row are measured
- **THEN** each is at least 44 points wide and 44 points tall
