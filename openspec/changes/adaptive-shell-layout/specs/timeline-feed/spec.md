# Spec Delta

## MODIFIED Requirements

### Requirement: Items newest first
The Timeline SHALL list every stored item that is not deleted, ordered by creation time with the newest first. Editing an item SHALL NOT change its position. The list SHALL scroll vertically in the space between the header and the section tabs, laid out in the content column of the current layout (see the app-shell "Content column" requirement). When the creation box is open, it SHALL be shown above the first item.

#### Scenario: Order of two texts
- **WHEN** the user creates the text "Primero" and then the text "Segundo"
- **THEN** the Timeline shows "Segundo" as the first card and "Primero" as the second

#### Scenario: Deleted items are hidden
- **WHEN** a stored item is marked as deleted
- **THEN** the Timeline does not show it

#### Scenario: An edited item keeps its place
- **WHEN** the Timeline shows "Segundo" and then "Primero", and the user edits "Primero" to "Primero editado"
- **THEN** the Timeline shows "Segundo" first and "Primero editado" second, also after the app restarts

#### Scenario: Feed on a wide window
- **WHEN** the Timeline shows cards in the tablet layout on a window 1280 points wide
- **THEN** the cards are at most 500 points wide and centered, and swiping in the empty space beside them scrolls the feed

### Requirement: Text card appearance
A text item SHALL be drawn as a card with the card background, a 2-point border in the border color, a soft shadow and its full text in the secondary text color with a line height of 1.5, keeping its line breaks and without truncation. In the phone layouts the card SHALL have a 16-point corner radius, 16 points of padding, 16 points of space below it and 15-point text. In the tablet layout it SHALL have an 18-point corner radius, 20 points of padding, 20 points of space below it and 16-point text.

#### Scenario: Card style
- **WHEN** a text item is shown in light or dark mode
- **THEN** its card uses the active palette's card background and border color, and its text is 15-point secondary-color text

#### Scenario: Line breaks and long text
- **WHEN** the stored text has several lines and is longer than the screen
- **THEN** the card shows every line in full, and the user scrolls the Timeline to read it

#### Scenario: Card on a tablet
- **WHEN** a text item is shown in the tablet layout, in portrait or landscape
- **THEN** its card has an 18-point corner radius, 20 points of padding and 20 points of space below it, and its text is 16 points with a line height of 24 points

#### Scenario: Card in phone landscape
- **WHEN** a text item is shown in the phone landscape layout
- **THEN** its card has the phone sizes: a 16-point corner radius, 16 points of padding and 15-point text
