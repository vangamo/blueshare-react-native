# Spec Delta

## MODIFIED Requirements

### Requirement: Phone and tablet size sets
Component sizes and font sizes SHALL depend only on whether the layout is a phone or a tablet layout, never on the orientation. The sizes stated in the app-shell, timeline-feed, item-creation, item-editing and user-profile capabilities SHALL be the phone set. Tablet layouts SHALL use the tablet set, which replaces each phone value listed in the scenarios below.

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

#### Scenario: Profile dialog on a phone
- **WHEN** a phone layout is used
- **THEN** the profile dialog's avatar preview is a 112-point circle with a 56-point `👵`, and the name field is at least 44 points tall with 16-point text

#### Scenario: Profile dialog on a tablet
- **WHEN** a tablet layout is used
- **THEN** the profile dialog's avatar preview is a 136-point circle with a 64-point `👵`, the name field is at least 48 points tall with 17-point text, and the field label and hint are 15 points

#### Scenario: Same sizes in both orientations
- **WHEN** the user rotates a phone, or a tablet
- **THEN** the card text, the title field and the create button keep the same size in both orientations

#### Scenario: Phone sizes unchanged
- **WHEN** the phone portrait layout is used
- **THEN** every size is the one the other capabilities state today, and the screen looks as it did before this change

### Requirement: Centered content column
Outside phone portrait, the Timeline feed, its cards and creation box, the type list, the edit dialog and the profile dialog SHALL be centered in a column at most 550 points wide on phone landscape, 500 on tablet portrait and 600 on tablet landscape, never wider than the screen minus the content padding. On phone portrait they SHALL span the screen minus the content padding, as today.

#### Scenario: Cards on a tablet in portrait
- **WHEN** the Timeline shows cards on an 800-point-wide tablet in portrait
- **THEN** each card is 500 points wide and centered, with equal space on both sides

#### Scenario: Edit dialog on a phone in landscape
- **WHEN** the edit dialog is open in the phone landscape layout
- **THEN** the dialog is at most 550 points wide and centered

#### Scenario: Profile dialog on a tablet in portrait
- **WHEN** the profile dialog is open on an 800-point-wide tablet in portrait
- **THEN** the dialog is 500 points wide and centered, not full width

### Requirement: Rotation keeps the user's place
Rotating the device, or any other change of the window size, SHALL NOT reset what the user is doing. The current section, the feed's scroll position, the creation box with its step, type, text, chosen photos, alternative text, caption, title, category and description, the open edit dialog with its edited content and any newly picked or removed photos, the open profile dialog with its step, edited name and picked or removed photo, and the focused text field with its open keyboard SHALL be kept. Focus SHALL NOT move to another field.

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

#### Scenario: Profile dialog with unsaved changes
- **WHEN** the profile dialog shows a newly picked photo and a changed name, not yet saved, and the user rotates the device
- **THEN** the dialog is still open with the same photo and name, in its current step, and the section under it is the same

#### Scenario: Draft on another section
- **WHEN** a draft is pending on Timeline, the user rotates the device on Circles and returns to Timeline
- **THEN** the creation box shows the draft in the same step

#### Scenario: Scrolled feed
- **WHEN** the user has scrolled the Timeline down and rotates the device
- **THEN** the feed is not scrolled back to the top

### Requirement: Landscape keyboard on phones
In the phone landscape layout, the app SHALL let the system show its full-screen text editor while the user types in the title field, the creation box, the edit dialog or the profile dialog. Text typed there SHALL appear in the field. Closing the editor SHALL keep the text and the field's focus.

#### Scenario: Typing in the full-screen editor
- **WHEN** the user types "nunca" in the creation box through the full-screen editor in phone landscape and presses the editor's done key
- **THEN** the editor closes, the creation box shows the text with "nunca", and the text area keeps its focus

#### Scenario: Typing the profile name in the full-screen editor
- **WHEN** the user types "Carmen" in the profile dialog's name field through the full-screen editor in phone landscape and presses the editor's done key
- **THEN** the editor closes and the name field shows "Carmen"
