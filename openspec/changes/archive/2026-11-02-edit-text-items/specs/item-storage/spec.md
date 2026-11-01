# Spec Delta

## MODIFIED Requirements

### Requirement: Soft deletion
Deleting an item SHALL remove it from the items the Timeline lists and keep a record of it, with its last content and its deletion time, in the item history, so that the deletion can later be passed on to contacts. A deleted item SHALL NOT be listed in the Timeline, and its identifier SHALL NOT be reused. Deleting an item is a user action ("Sí, borrar" in the edit dialog).

#### Scenario: A deleted record stays stored
- **WHEN** the text item "Hola" is deleted
- **THEN** the history holds a record of that item with the text "Hola" and the deletion time, and the Timeline does not list it

#### Scenario: Deleting an item that no longer exists
- **WHEN** a deletion is requested for an identifier that is not among the listed items
- **THEN** the deletion fails and nothing is stored or changed

## ADDED Requirements

### Requirement: Editing a text item
Editing a text item SHALL replace its text and set its update time to the current time. Its identifier, type and creation time SHALL stay the same. The new text SHALL follow the same rules as a new text item: trimmed, with inner line breaks kept, between 1 character and the configured maximum length; otherwise the edit SHALL be rejected without storing anything.

#### Scenario: Editing keeps the identity
- **WHEN** the text item "Hola" created at time T1 is edited to "Hola, abuela" at time T2
- **THEN** the item keeps its identifier and its creation time T1, its update time is T2, and its text is "Hola, abuela"

#### Scenario: Blank edit is rejected
- **WHEN** a text item is edited to text that holds only whitespace
- **THEN** the edit fails and the item and its history are unchanged

#### Scenario: Too long
- **WHEN** a text item is edited to 8193 characters
- **THEN** the edit fails and nothing is stored

#### Scenario: Editing an item that no longer exists
- **WHEN** an edit is requested for an identifier that is not among the listed items
- **THEN** the edit fails and nothing is stored or changed

### Requirement: Unchanged edits are ignored
An edit whose trimmed text equals the item's current text SHALL store nothing: the update time and the history SHALL stay unchanged.

#### Scenario: Same text with extra spaces
- **WHEN** the text item "Hola" is edited to "  Hola \n"
- **THEN** the item's update time is unchanged and no history record is added

### Requirement: Edit history
Before an item is edited or deleted, its current record and content SHALL be added to the item history as a new version. Versions of one item SHALL be numbered 1, 2, 3, … in the order they were added, even when several are added in the same millisecond. History versions SHALL never be changed or removed by editing or deleting.

#### Scenario: Two edits and a deletion
- **WHEN** the text item "A" is edited to "B", then to "C", and then deleted
- **THEN** its history holds version 1 with "A", version 2 with "B" and version 3 with "C" and the deletion time, and only versions 1 and 2 have an empty deletion time

#### Scenario: Each version keeps its times
- **WHEN** the text item "A", created and last updated at T1, is edited at T2
- **THEN** history version 1 has the creation time T1, the update time T1 and the text "A"

### Requirement: Editing and deleting are all or nothing
Adding the history version and changing or removing the item SHALL happen together. If any part fails, the item, its content and its history SHALL stay as they were.

#### Scenario: Failure while updating the text
- **WHEN** storing the new text fails after the history version was written
- **THEN** no new history version remains, and the item keeps its previous text and update time

#### Scenario: Failure while deleting
- **WHEN** removing the item fails after the history version was written
- **THEN** no new history version remains, and the Timeline still lists the item
