# Spec Delta

## Purpose

Defines what the Timeline section shows: the user's items, newest first, how a text item is drawn as a card with its actions, and the empty, loading and error states of the feed.

## ADDED Requirements

### Requirement: Items newest first
The Timeline SHALL list every stored item that is not deleted, ordered by creation time with the newest first. The list SHALL scroll vertically between the header and the footer, with 16 points of padding. When the creation box is open, it SHALL be shown above the first item.

#### Scenario: Order of two texts
- **WHEN** the user creates the text "Primero" and then the text "Segundo"
- **THEN** the Timeline shows "Segundo" as the first card and "Primero" as the second

#### Scenario: Deleted items are hidden
- **WHEN** a stored item is marked as deleted
- **THEN** the Timeline does not show it

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

### Requirement: Card actions do nothing yet
Pressing "Editar" or "Compartir" on a text card SHALL show press feedback and have no other effect: the text is not changed, nothing is shared, and no error occurs.

#### Scenario: Pressing Editar
- **WHEN** the user taps "Editar" on a text card
- **THEN** the button shows press feedback, the card stays the same, and nothing else happens

#### Scenario: Pressing Compartir
- **WHEN** the user taps "Compartir" on a text card
- **THEN** the button shows press feedback and nothing else happens

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
