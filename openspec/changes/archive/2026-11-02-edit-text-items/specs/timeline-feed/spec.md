# Spec Delta

## MODIFIED Requirements

### Requirement: Items newest first
The Timeline SHALL list every stored item that is not deleted, ordered by creation time with the newest first. Editing an item SHALL NOT change its position. The list SHALL scroll vertically between the header and the footer, with 16 points of padding. When the creation box is open, it SHALL be shown above the first item.

#### Scenario: Order of two texts
- **WHEN** the user creates the text "Primero" and then the text "Segundo"
- **THEN** the Timeline shows "Segundo" as the first card and "Primero" as the second

#### Scenario: Deleted items are hidden
- **WHEN** a stored item is marked as deleted
- **THEN** the Timeline does not show it

#### Scenario: An edited item keeps its place
- **WHEN** the Timeline shows "Segundo" and then "Primero", and the user edits "Primero" to "Primero editado"
- **THEN** the Timeline shows "Segundo" first and "Primero editado" second, also after the app restarts

## REMOVED Requirements

### Requirement: Card actions do nothing yet
**Reason**: "Editar" now opens the edit dialog. Only "Compartir" still has no effect.
**Migration**: See "Editar opens the edit dialog" in the item-editing capability and "Compartir does nothing yet" below.

## ADDED Requirements

### Requirement: Compartir does nothing yet
Pressing "Compartir" on a text card SHALL show press feedback and have no other effect: nothing is shared, and no error occurs.

#### Scenario: Pressing Compartir
- **WHEN** the user taps "Compartir" on a text card
- **THEN** the button shows press feedback and nothing else happens

### Requirement: Edits and deletions appear right away
A text saved or an item deleted from the edit dialog SHALL be reflected in the Timeline as soon as the dialog closes, with no restart, reload or pull-to-refresh.

#### Scenario: Card after editing
- **WHEN** the user saves a new text for a card
- **THEN** the card shows the new text immediately after the dialog closes

#### Scenario: Card after deleting
- **WHEN** the user deletes an item
- **THEN** its card is gone immediately after the dialog closes, and the other cards keep their order
