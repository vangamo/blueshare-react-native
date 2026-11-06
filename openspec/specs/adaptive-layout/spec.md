# adaptive-layout Specification

## Purpose

Adapts BlueShare's frame and sizes to the device and its orientation: one of four layouts chosen from the window size, a phone and a tablet size set, and the guarantee that rotating never loses what the user was doing.

## Requirements

### Requirement: Layout chosen from the window size
The app SHALL use one of four layouts: phone portrait, phone landscape, tablet portrait and tablet landscape. A window wider than tall SHALL use a landscape layout, any other a portrait one. A window whose shorter side is at least 600 points SHALL use a tablet layout, any other a phone one. The layout SHALL follow the window's current size, and SHALL change as soon as the size changes.

#### Scenario: Phone held upright
- **WHEN** the app window is 411 points wide and 866 tall
- **THEN** the app uses the phone portrait layout

#### Scenario: Phone turned sideways
- **WHEN** the app window is 914 points wide and 363 tall
- **THEN** the app uses the phone landscape layout

#### Scenario: Tablet in both orientations
- **WHEN** the app window is 800 by 1224 points, and later 1280 by 744 points
- **THEN** the app first uses the tablet portrait layout, and then the tablet landscape layout

#### Scenario: Threshold
- **WHEN** the window's shorter side is 599 points
- **THEN** the app uses a phone layout, and with 600 points a tablet layout

#### Scenario: Tablet in split screen
- **WHEN** the app shares a tablet screen and its window is 500 points wide and 744 tall
- **THEN** the app uses the phone portrait layout

#### Scenario: Rotating while the app is open
- **WHEN** the user rotates the phone from portrait to landscape
- **THEN** the shell switches to the phone landscape layout without restarting the app

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

#### Scenario: Event items on a tablet
- **WHEN** a tablet layout is used
- **THEN** event titles are 19 points, category badges are 15 points, the event title and category fields are at least 48 points tall with 17-point text, the category suggestions and photo remove buttons are at least 48 points tall, and the event step and dialog show four thumbnails per row instead of three

#### Scenario: Same sizes in both orientations
- **WHEN** the user rotates a phone, or a tablet
- **THEN** the card text, the title field and the create button keep the same size in both orientations

#### Scenario: Phone sizes unchanged
- **WHEN** the phone portrait layout is used
- **THEN** every size is the one the other capabilities state today, and the screen looks as it did before this change

### Requirement: Frame of each layout
Each layout SHALL have this frame, where both safe-area insets are added to the bar heights:

| Layout | Header | Tab bar | Tab width | Title field max width |
| --- | --- | --- | --- | --- |
| Phone portrait | 70 | 75, bottom | equal, stretched | none |
| Phone landscape | 56 | 56, top | 120, centered | 300 |
| Tablet portrait | 75 | 80, bottom | 150, centered | 350 |
| Tablet landscape | 75 | 64, top | 150, centered | 400 |

#### Scenario: Phone landscape frame
- **WHEN** the phone landscape layout is used
- **THEN** the header is 56 points tall plus the top inset, the tab bar sits right below the header and is 56 points tall, and there is no bar at the bottom

#### Scenario: Tablet portrait frame
- **WHEN** the tablet portrait layout is used
- **THEN** the header is 75 points tall plus the top inset, the tab bar is at the bottom and is 80 points tall plus the bottom inset, and its three tabs are 150 points wide and centered

#### Scenario: Title field on wide screens
- **WHEN** the tablet landscape layout is used
- **THEN** the title field is at most 400 points wide and centered between the menu button and the avatar

### Requirement: Tab bar position
In portrait layouts the tab bar SHALL sit at the bottom of the screen, with a top border. In landscape layouts it SHALL sit right below the header, with a bottom border in the border color. In both places it SHALL keep the same tabs, order, styles and behavior.

#### Scenario: Turning the phone
- **WHEN** the user turns the phone from portrait to landscape while Circles is shown
- **THEN** the tab bar moves from the bottom to below the header, and Circles is still the active tab

### Requirement: Header horizontal padding on tablets
In tablet layouts the header SHALL have 24 points of horizontal padding.

#### Scenario: Tablet header padding
- **WHEN** a tablet layout is used
- **THEN** the menu button starts 24 points from the left edge plus the left inset, and the avatar ends 24 points from the right edge plus the right inset

### Requirement: Create button position per layout
The create button SHALL sit 20 points from the right edge on phones and 28 points on tablets, plus the right inset. In portrait layouts it SHALL sit 10 points above the tab bar on phones and 16 points on tablets. In landscape layouts it SHALL sit 16 points above the bottom inset.

#### Scenario: Phone landscape
- **WHEN** the phone landscape layout is used
- **THEN** the create button is 56 points, 20 points from the right edge plus the right inset, and 16 points above the bottom inset

#### Scenario: Tablet portrait
- **WHEN** the tablet portrait layout is used
- **THEN** the create button is 60 points, 28 points from the right edge plus the right inset, and 16 points above the tab bar

### Requirement: Centered content column
Outside phone portrait, the Timeline feed, its cards and creation box, the type list and the edit dialog SHALL be centered in a column at most 550 points wide on phone landscape, 500 on tablet portrait and 600 on tablet landscape, never wider than the screen minus the content padding. On phone portrait they SHALL span the screen minus the content padding, as today.

#### Scenario: Cards on a tablet in portrait
- **WHEN** the Timeline shows cards on an 800-point-wide tablet in portrait
- **THEN** each card is 500 points wide and centered, with equal space on both sides

#### Scenario: Edit dialog on a phone in landscape
- **WHEN** the edit dialog is open in the phone landscape layout
- **THEN** the dialog is at most 550 points wide and centered

### Requirement: Safe areas on every side
The header, the tab bar, the create button and the section content SHALL stay clear of the left and right safe-area insets. In landscape layouts, where no bar sits at the bottom, the section content and the create button SHALL stay clear of the bottom inset.

#### Scenario: Camera cutout on the left
- **WHEN** the phone is in landscape with its camera cutout on the left
- **THEN** the menu button, the first tab and the cards are not covered by the cutout

#### Scenario: Gesture bar in landscape
- **WHEN** the creation box is open at the end of the visible feed in phone landscape
- **THEN** its "Cancelar" and "Crear" buttons can be scrolled fully above the gesture bar

### Requirement: Rotation keeps the user's place
Rotating the device, or any other change of the window size, SHALL NOT reset what the user is doing. The current section, the feed's scroll position, the creation box with its step, type, text, chosen photos, alternative text, caption, title, category and description, the open edit dialog with its edited content and any newly picked or removed photos, and the focused text field with its open keyboard SHALL be kept. Focus SHALL NOT move to another field.

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

#### Scenario: Event step with photos
- **WHEN** the event step shows three chosen photos, a typed title and a category, and the user rotates the device
- **THEN** the event step still shows the same three photos in the same order and the same fields, with the thumbnails resized to the new layout

#### Scenario: Event dialog with removed photos
- **WHEN** the event dialog shows an event with one photo removed and one added, not yet saved, and the user rotates the device
- **THEN** the dialog still shows the same photos in the same order and the edited fields, in its current step

#### Scenario: Draft on another section
- **WHEN** a draft is pending on Timeline, the user rotates the device on Circles and returns to Timeline
- **THEN** the creation box shows the draft in the same step

#### Scenario: Scrolled feed
- **WHEN** the user has scrolled the Timeline down and rotates the device
- **THEN** the feed is not scrolled back to the top

### Requirement: Landscape keyboard on phones
In the phone landscape layout, the app SHALL let the system show its full-screen text editor while the user types in the title field, the creation box or the edit dialog. Text typed there SHALL appear in the field. Closing the editor SHALL keep the text and the field's focus.

#### Scenario: Typing in the full-screen editor
- **WHEN** the user types "nunca" in the creation box through the full-screen editor in phone landscape and presses the editor's done key
- **THEN** the editor closes, the creation box shows the text with "nunca", and the text area keeps its focus

### Requirement: Maximum image height follows the layout
The maximum height of a photo on a card or in a preview SHALL be computed for the current layout and window, and SHALL be updated as soon as the layout or the window size changes, without changing which photo or item is shown.

#### Scenario: Rotating with a tall photo on screen
- **WHEN** a card with a tall photo is shown in phone portrait and the user rotates to phone landscape
- **THEN** the photo is shown smaller, whole, so that the photo, its caption line and its actions fit in the visible content area

### Requirement: Event photo tile size follows the layout
The side of an event card's photo tiles SHALL be computed for the current layout and window, so that two tiles and part of a third fit in the card's content width. When that side is larger than the layout's maximum image height, the side SHALL be the maximum image height instead. It SHALL be updated as soon as the layout or the window size changes, without changing which photos or items are shown.

#### Scenario: Rotating with an event on screen
- **WHEN** an event card with five photos is shown in phone portrait and the user rotates to phone landscape
- **THEN** the tiles are resized for the new card width, still square, still no taller than the maximum image height, and the same photos are shown in the same order
