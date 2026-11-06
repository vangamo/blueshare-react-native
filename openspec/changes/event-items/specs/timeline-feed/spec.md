# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
