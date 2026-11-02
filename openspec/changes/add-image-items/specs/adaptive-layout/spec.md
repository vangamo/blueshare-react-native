# Spec Delta

## MODIFIED Requirements

### Requirement: Phone and tablet size sets
Component sizes and font sizes SHALL depend only on whether the layout is a phone or a tablet layout, never on the orientation. The sizes stated in the app-shell, timeline-feed, item-creation and item-editing capabilities SHALL be the phone set. Tablet layouts SHALL use the tablet set, which replaces each phone value listed in the scenarios below.

#### Scenario: Shell controls on a tablet
- **WHEN** a tablet layout is used
- **THEN** the menu button is at least 48 by 48 points with a 20-point glyph, the title field is 46 points tall with 17-point text, the avatar is 46 points with a 22-point emoji, the tab buttons are 48 points tall with 15-point labels, and the create button is 60 points with a 30-point `+`

#### Scenario: Content on a tablet
- **WHEN** a tablet layout is used
- **THEN** the content padding, card padding, space below each card or box, and the padding of the creation box and edit dialog are 20 points, card, box and dialog corners are 18 points, card text is 16 points with a 24-point line height, and card action buttons are at least 48 points tall with 15-point labels

#### Scenario: Creation box and dialog controls on a tablet
- **WHEN** a tablet layout is used
- **THEN** the box and dialog titles are 15 points, the type select and text areas use 17-point text, the type select and the box and dialog buttons are at least 48 points tall with 16-point labels, and the type list rows are 60 points tall

#### Scenario: Image items on a tablet
- **WHEN** a tablet layout is used
- **THEN** image captions, field labels and the alternative text hint are 15 points, the caption field is at least 48 points tall with 17-point text, and the photo button is at least 48 points tall with a 16-point label

#### Scenario: Same sizes in both orientations
- **WHEN** the user rotates a phone, or a tablet
- **THEN** the card text, the title field and the create button keep the same size in both orientations

#### Scenario: Phone sizes unchanged
- **WHEN** the phone portrait layout is used
- **THEN** every size is the one the other capabilities state today, and the screen looks as it did before this change

### Requirement: Rotation keeps the user's place
Rotating the device, or any other change of the window size, SHALL NOT reset what the user is doing. The current section, the feed's scroll position, the creation box with its step, type, text, chosen photo, alternative text and caption, the open edit dialog with its edited content and any newly picked photo, and the focused text field with its open keyboard SHALL be kept. Focus SHALL NOT move to another field.

#### Scenario: Typing in the creation box
- **WHEN** the user is typing "Hola" in the creation box with the keyboard open and rotates the phone, then rotates it back
- **THEN** after each rotation the box still shows "Hola", the text area still has focus, the keyboard is open, and the title field does not get focus

#### Scenario: Edit dialog open
- **WHEN** the edit dialog is open with changed text and the user rotates the device
- **THEN** the dialog is still open with the changed text, in its current step

#### Scenario: Image step with a photo
- **WHEN** the image step shows a chosen photo and a typed caption, and the user rotates the device
- **THEN** the image step still shows the same photo and caption, with the preview resized to the new layout

#### Scenario: Image dialog with a new photo
- **WHEN** the image dialog shows a newly picked, unsaved photo and the user rotates the device
- **THEN** the dialog still shows the new photo and the edited fields, in its current step

#### Scenario: Draft on another section
- **WHEN** a draft is pending on Timeline, the user rotates the device on Circles and returns to Timeline
- **THEN** the creation box shows the draft in the same step

#### Scenario: Scrolled feed
- **WHEN** the user has scrolled the Timeline down and rotates the device
- **THEN** the feed is not scrolled back to the top

## ADDED Requirements

### Requirement: Maximum image height follows the layout
The maximum height of a photo on a card or in a preview SHALL be computed for the current layout and window, and SHALL be updated as soon as the layout or the window size changes, without changing which photo or item is shown.

#### Scenario: Rotating with a tall photo on screen
- **WHEN** a card with a tall photo is shown in phone portrait and the user rotates to phone landscape
- **THEN** the photo is shown smaller, whole, so that the photo, its caption line and its actions fit in the visible content area
