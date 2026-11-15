# timeline-feed Specification

## Purpose

Defines what the Timeline section shows: the user's items, newest first, how a text item is drawn as a card with its actions, and the empty, loading and error states of the feed.

## Requirements

### Requirement: Items newest first
The Timeline SHALL list every stored item that is not deleted, ordered by creation time with the newest first. Editing an item SHALL NOT change its position. The list SHALL scroll vertically in the space between the header and the tab bar (or the bottom safe area, when the tab bar is below the header), with the content padding of the current size set (16 points on phones), inside the content column of the current layout. When the creation box is open, it SHALL be shown above the first item.

#### Scenario: Order of two texts
- **WHEN** the user creates the text "Primero" and then the text "Segundo"
- **THEN** the Timeline shows "Segundo" as the first card and "Primero" as the second

#### Scenario: Deleted items are hidden
- **WHEN** a stored item is marked as deleted
- **THEN** the Timeline does not show it

#### Scenario: An edited item keeps its place
- **WHEN** the Timeline shows "Segundo" and then "Primero", and the user edits "Primero" to "Primero editado"
- **THEN** the Timeline shows "Segundo" first and "Primero editado" second, also after the app restarts

#### Scenario: Feed on a wide screen
- **WHEN** the Timeline is shown in a landscape or tablet layout
- **THEN** the cards are centered in the layout's content column, and the last card can be scrolled fully into view above the bottom bar or safe area

### Requirement: New items appear right away
An item created from the creation box SHALL appear at the top of the Timeline as soon as it is saved, with no restart, reload or pull-to-refresh.

#### Scenario: Card after creating
- **WHEN** the user creates a text item
- **THEN** its card is the first card of the Timeline immediately after the box closes

### Requirement: Text card appearance
A text item SHALL be drawn as a card with the card background, a 2-point border in the border color, a 16-point corner radius, 16 points of padding, a soft shadow and 16 points of space below it. The full text SHALL be shown in 15-point type, with a line height of 1.5 and the secondary text color, keeping its line breaks and without truncation.

#### Scenario: Card style
- **WHEN** a text item is shown in light or dark mode
- **THEN** its card uses the active palette's card background and border color, and its text is 15-point secondary-color text

#### Scenario: Line breaks and long text
- **WHEN** the stored text has several lines and is longer than the screen
- **THEN** the card shows every line in full, and the user scrolls the Timeline to read it

### Requirement: Text card actions
Below its text, each text card SHALL show an action row separated by a 1-point divider line, with "Editar" and then "Compartir" aligned to the right, 10 points apart. Each button SHALL be at least 44 points tall, with the muted surface background, a 1-point dark border, an 8-point corner radius and a 14-point bold label in the main text color. Each SHALL be announced as a button named by its label.

#### Scenario: Action buttons shown
- **WHEN** a text card is shown
- **THEN** it shows "Editar" and "Compartir" at the bottom right, each at least 44 points tall

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the card's action buttons
- **THEN** they are announced as buttons named "Editar" and "Compartir"

### Requirement: Empty timeline message
When there are no items to show and the creation box is closed, the Timeline SHALL show the message "Sin publicaciones todavía. Pulsa en el botón + para crear una." in the secondary text color. The message SHALL be hidden while the creation box is open.

#### Scenario: First launch
- **WHEN** the app is opened with no stored items
- **THEN** the Timeline shows "Sin publicaciones todavía. Pulsa en el botón + para crear una."

#### Scenario: Box open on an empty timeline
- **WHEN** the timeline is empty and the user opens the creation box
- **THEN** only the creation box is shown, without the empty message

### Requirement: Loading the timeline
While the stored items are being loaded, the Timeline SHALL show neither the empty message nor an error, so that a timeline with items never flashes the empty message on launch.

#### Scenario: Launch with stored items
- **WHEN** the app starts and stored items exist
- **THEN** the empty message is never shown before the cards appear

### Requirement: Loading error
If the stored items cannot be read, the Timeline SHALL show the message "⚠️ No se pudieron cargar las publicaciones." instead of the cards or the empty message. The header, footer and the other sections SHALL keep working.

#### Scenario: Storage cannot be read
- **WHEN** reading the stored items fails at launch
- **THEN** the Timeline shows "⚠️ No se pudieron cargar las publicaciones." and the user can still switch to Circles and Events

### Requirement: Compartir does nothing yet
Pressing "Compartir" on a text card, an image card or an event card SHALL show press feedback and have no other effect: nothing is shared, and no error occurs.

#### Scenario: Pressing Compartir
- **WHEN** the user taps "Compartir" on a text card
- **THEN** the button shows press feedback and nothing else happens

#### Scenario: Pressing Compartir on an image card
- **WHEN** the user taps "Compartir" on an image card
- **THEN** the button shows press feedback and nothing else happens

#### Scenario: Pressing Compartir on an event card
- **WHEN** the user taps "Compartir" on an event card
- **THEN** the button shows press feedback and nothing else happens

### Requirement: Edits and deletions appear right away
A change saved or an item deleted from the edit dialog SHALL be reflected in the Timeline as soon as the dialog closes, with no restart, reload or pull-to-refresh.

#### Scenario: Card after editing
- **WHEN** the user saves a new text for a card
- **THEN** the card shows the new text immediately after the dialog closes

#### Scenario: Image card after editing
- **WHEN** the user saves a new photo and caption for an image card
- **THEN** the card shows the new photo and caption immediately after the dialog closes, in the same position

#### Scenario: Event card after editing
- **WHEN** the user removes a photo and changes the category of an event card
- **THEN** the card shows the remaining photos and the new category immediately after the dialog closes, in the same position

#### Scenario: Card after deleting
- **WHEN** the user deletes an item
- **THEN** its card is gone immediately after the dialog closes, and the other cards keep their order

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

### Requirement: Event card appearance
An event item SHALL be drawn as a card with the same background, corner radius, padding, shadow and spacing as a text card, but with a 2-point border in the strong ink color and a 6-point deep-blue accent bar along its left edge that sets event cards apart from other cards, following the event card sketch.

#### Scenario: Event card style
- **WHEN** an event item is shown in light or dark mode
- **THEN** its card uses the active palette's card background, a strong-ink border and a deep-blue bar on its left edge

### Requirement: Event title and category
The event card SHALL start with the title in bold, in the main text color, at the size set's event title size (17 points on phones), shown in full and wrapping onto several lines. The category SHALL be shown at the right of the title's first line as a rounded badge with the badge background and badge text color, in bold at the size set's badge size (14 points on phones), never truncated.

#### Scenario: Title and badge
- **WHEN** an event item has the title "Tarde de juegos y café" and the category "Encuentro"
- **THEN** the card shows "Tarde de juegos y café" in bold and, to its right, a badge reading "Encuentro"

#### Scenario: Long title
- **WHEN** an event title is longer than the space left by the badge
- **THEN** the title wraps onto more lines in full, and the badge stays at the right of its first line

### Requirement: Event photo row
Below the title, the event card SHALL show its photos in their stored order as a single row of square tiles of equal size, 10 points apart, starting at the card's content edge. Each photo SHALL fill its tile, cropped around its center, with a 12-point corner radius. When the tiles are wider than the card's content, the row SHALL scroll sideways, with the tile size chosen so that part of the next tile shows. Tapping a tile SHALL do nothing.

#### Scenario: Five photos on a phone
- **WHEN** an event card with five photos is shown in the phone portrait layout
- **THEN** two tiles are shown whole and part of the third shows at the right edge, and swiping the row sideways reveals the others in order

#### Scenario: One photo
- **WHEN** an event item has one photo
- **THEN** the card shows one square tile at the start of the row, and the row does not scroll

#### Scenario: Portrait and landscape photos
- **WHEN** an event holds a portrait photo and a landscape photo
- **THEN** both tiles are squares of the same size, each showing the center of its photo

### Requirement: Event card space is kept while photos load
Each tile SHALL have its final size before its photo has loaded, shown on the image backdrop color, so that cards do not move as photos appear.

#### Scenario: Scrolling past event cards
- **WHEN** the Timeline holds many event items and the user scrolls quickly
- **THEN** the cards keep their positions while their photos load

### Requirement: Event description
When an event item has a description, the card SHALL show it below the photo row in full, at the size set's card text size with its line height, in the secondary text color, keeping its line breaks and without truncation. When it has none, the action row SHALL follow the photo row directly.

#### Scenario: Description shown
- **WHEN** an event item has the description "Nos reunimos en el salón principal para jugar al parchís."
- **THEN** the card shows the full description below the photos

#### Scenario: No description
- **WHEN** an event item has no description
- **THEN** the action row follows the photo row directly, with no empty line between them

### Requirement: Missing event photo
If the file of one of an event's photos cannot be found or read, its tile SHALL show the image backdrop color and the message "⚠️ Imagen no disponible" in the muted text color, and the other tiles, the texts and the actions SHALL be shown as usual.

#### Scenario: One file missing
- **WHEN** the second photo file of a three-photo event has been removed from the app's storage
- **THEN** the second tile shows "⚠️ Imagen no disponible", and the first and third tiles show their photos

### Requirement: Event card accessibility
Screen readers SHALL announce the event title as a heading, the badge as "Categoría: " followed by the category, each tile as an image named "Foto N de M de " followed by the title, and the description as text. Every tile SHALL be reachable by the screen reader, scrolling the row when needed.

#### Scenario: Reading an event card
- **WHEN** a screen reader moves through an event card titled "Viaje a Cádiz", with the category "Familia" and two photos
- **THEN** it announces the heading "Viaje a Cádiz", "Categoría: Familia", the images "Foto 1 de 2 de Viaje a Cádiz" and "Foto 2 de 2 de Viaje a Cádiz", the description, and the buttons "Editar" and "Compartir"

### Requirement: Event card actions
Below its photos and description, each event card SHALL show the same action row as a text card: a 1-point divider, then "Editar" and "Compartir" aligned to the right, with the same sizes, styles and screen reader names. "Editar" SHALL open the event item's edit dialog.

#### Scenario: Event action buttons shown
- **WHEN** an event card is shown
- **THEN** it shows "Editar" and "Compartir" at the bottom right, each at least 44 points tall, announced as buttons with those names
