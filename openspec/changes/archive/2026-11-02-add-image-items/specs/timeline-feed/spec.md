# Spec Delta

## MODIFIED Requirements

### Requirement: Compartir does nothing yet
Pressing "Compartir" on a text card or an image card SHALL show press feedback and have no other effect: nothing is shared, and no error occurs.

#### Scenario: Pressing Compartir
- **WHEN** the user taps "Compartir" on a text card
- **THEN** the button shows press feedback and nothing else happens

#### Scenario: Pressing Compartir on an image card
- **WHEN** the user taps "Compartir" on an image card
- **THEN** the button shows press feedback and nothing else happens

### Requirement: Edits and deletions appear right away
A change saved or an item deleted from the edit dialog SHALL be reflected in the Timeline as soon as the dialog closes, with no restart, reload or pull-to-refresh.

#### Scenario: Card after editing
- **WHEN** the user saves a new text for a card
- **THEN** the card shows the new text immediately after the dialog closes

#### Scenario: Image card after editing
- **WHEN** the user saves a new photo and caption for an image card
- **THEN** the card shows the new photo and caption immediately after the dialog closes, in the same position

#### Scenario: Card after deleting
- **WHEN** the user deletes an item
- **THEN** its card is gone immediately after the dialog closes, and the other cards keep their order

## ADDED Requirements

### Requirement: Image card appearance
An image item SHALL be drawn as a card with the same background, border, corner radius, padding, shadow and spacing as a text card. Its photo SHALL come first, spanning the card's content width, with a 12-point corner radius and 8 points of space below it.

#### Scenario: Card style
- **WHEN** an image item is shown in light or dark mode
- **THEN** its card uses the active palette's card background and border color, and its photo spans the card's inner width

### Requirement: Photo shown whole at its natural proportions
The card SHALL show the whole photo, never cropped or stretched, at its natural proportions. Its height SHALL be at most the layout's maximum image height: the smaller of 5/4 of the photo's width on screen and a height that leaves room for the caption and the actions within the visible content area. A photo taller than that SHALL be scaled down to the maximum height and centered, with the image backdrop color filling both sides.

#### Scenario: Landscape photo
- **WHEN** an image item holds a 4000×3000 pixel photo and the card's inner width is 300 points
- **THEN** the photo is shown 300 points wide and 225 points tall, with no backdrop visible

#### Scenario: Tall photo
- **WHEN** an image item holds a 1000×3000 pixel photo
- **THEN** the photo is shown at the maximum image height, whole and centered, with the backdrop color on both sides

#### Scenario: Whole card visible in phone landscape
- **WHEN** an image card with a tall photo is shown in the phone landscape layout
- **THEN** the photo, its caption line and the action row fit in the visible content area at the same time

### Requirement: Card space is kept while the photo loads
Before a photo has finished loading, its card SHALL already have the photo's final size, so that cards do not move as photos appear while the user scrolls.

#### Scenario: Scrolling a long timeline
- **WHEN** the Timeline holds many image items and the user scrolls quickly
- **THEN** the cards keep their positions while their photos load

### Requirement: Image caption
When an image item has a caption, the card SHALL show it below the photo in full, in italic type at the size set's caption size (14 points on phones), in the muted text color, without truncation. When it has no caption, nothing SHALL be shown between the photo and the action row.

#### Scenario: Caption shown
- **WHEN** an image item has the caption "Trabajos realizados en el taller de pintura de esta mañana."
- **THEN** the card shows the caption in full below the photo, in italic muted text

#### Scenario: No caption
- **WHEN** an image item has no caption
- **THEN** the action row follows the photo directly, with no empty line between them

### Requirement: Missing photo
If an image card's photo file cannot be found or read, the card SHALL show the photo area with the backdrop color and the message "⚠️ Imagen no disponible" in the muted text color, and keep its caption and actions. The rest of the Timeline SHALL keep working.

#### Scenario: Photo file missing
- **WHEN** an image item's photo file has been removed from the app's storage
- **THEN** its card shows "⚠️ Imagen no disponible" where the photo was, with its caption and its "Editar" and "Compartir" buttons

### Requirement: Image card accessibility
Screen readers SHALL announce an image card's photo as an image, named by its alternative text, or by its caption when it has no alternative text, or "Foto" when it has neither. The caption SHALL be read as text.

#### Scenario: With alternative text
- **WHEN** a screen reader focuses the photo of an image item with the alternative text "Cuatro personas pintando en una mesa"
- **THEN** it announces an image named "Cuatro personas pintando en una mesa"

#### Scenario: Caption only
- **WHEN** a screen reader focuses the photo of an image item with the caption "Paseo" and no alternative text
- **THEN** it announces an image named "Paseo"

#### Scenario: Neither
- **WHEN** a screen reader focuses the photo of an image item with no alternative text and no caption
- **THEN** it announces an image named "Foto"

### Requirement: Image card actions
Below its photo and caption, each image card SHALL show the same action row as a text card: a 1-point divider, then "Editar" and "Compartir" aligned to the right, with the same sizes, styles and screen reader names. "Editar" SHALL open the image item's edit dialog.

#### Scenario: Action buttons shown
- **WHEN** an image card is shown
- **THEN** it shows "Editar" and "Compartir" at the bottom right, each at least 44 points tall, announced as buttons with those names
