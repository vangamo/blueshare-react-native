# Spec Delta

## MODIFIED Requirements

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
