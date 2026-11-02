# Spec Delta

## MODIFIED Requirements

### Requirement: Saving is all or nothing
Saving an item SHALL store its common record and its type-specific content together. If any part fails, nothing of that item SHALL remain stored. For an image item, the copy of its photo SHALL also be removed when saving fails.

#### Scenario: Failure while saving the text
- **WHEN** storing the text of a new text item fails after its common record was written
- **THEN** no record of that item remains, and the Timeline does not show it

#### Scenario: Failure while saving an image item
- **WHEN** the photo of a new image item was copied and storing its content fails
- **THEN** no record of that item remains, the copied photo file is removed, and the Timeline does not show it

### Requirement: Edit history
Before an item is edited or deleted, its current record and content SHALL be added to the item history as a new version. Versions of one item SHALL be numbered 1, 2, 3, … in the order they were added, even when several are added in the same millisecond. History versions SHALL never be changed or removed by editing or deleting.

#### Scenario: Two edits and a deletion
- **WHEN** the text item "A" is edited to "B", then to "C", and then deleted
- **THEN** its history holds version 1 with "A", version 2 with "B" and version 3 with "C" and the deletion time, and only versions 1 and 2 have an empty deletion time

#### Scenario: Each version keeps its times
- **WHEN** the text item "A", created and last updated at T1, is edited at T2
- **THEN** history version 1 has the creation time T1, the update time T1 and the text "A"

#### Scenario: Image item history
- **WHEN** an image item with photo P1 and caption "Uno" has its photo replaced by P2 and is then deleted
- **THEN** its history holds version 1 with P1 and "Uno", and version 2 with P2, "Uno" and the deletion time

## ADDED Requirements

### Requirement: Image item content
An image item SHALL also store its photo, the photo's width and height in pixels, an optional alternative text and an optional caption. An image item without a photo SHALL be rejected without storing anything.

#### Scenario: No photo
- **WHEN** an image item is created without a photo
- **THEN** the creation fails and nothing is stored

### Requirement: Image texts are trimmed and optional
The alternative text and the caption of an image item SHALL have leading and trailing whitespace removed, and a text that is empty after trimming SHALL be stored as absent.

#### Scenario: Optional texts
- **WHEN** an image item is created with a photo, the alternative text "   " and the caption "  Paseo  "
- **THEN** the stored item has no alternative text and the caption "Paseo"

### Requirement: Image text limits
The alternative text SHALL be at most the configured maximum alternative text length, 1000 characters by default, and the caption at most the configured maximum caption length, 500 characters by default. An image item with a text over its limit SHALL be rejected without storing anything, whatever its source.

#### Scenario: Alternative text too long
- **WHEN** an image item is created with an alternative text of 1001 characters
- **THEN** the creation fails and nothing is stored, while 1000 characters are accepted

#### Scenario: Caption too long
- **WHEN** an image item is created with a caption of 501 characters
- **THEN** the creation fails and nothing is stored, while 500 characters are accepted

### Requirement: Photos are copied into app storage
When an image item is saved with a newly chosen photo, the app SHALL store a copy of the photo in its own private storage, under a new unique name, and the item SHALL refer to that copy. The item SHALL keep showing its photo after the app restarts and after the original is removed from the device's gallery or cache. Photos SHALL be stored and read without a network connection.

#### Scenario: Original removed from the gallery
- **WHEN** the user creates an image item and then deletes the original photo from the device's gallery
- **THEN** the image card still shows the photo, also after the app restarts

#### Scenario: Two items with the same photo
- **WHEN** the user creates two image items from the same gallery photo
- **THEN** each item refers to its own copy

### Requirement: Photo files are kept for the history
A stored photo file SHALL never be overwritten. Replacing an item's photo SHALL store the new photo as a new file and keep the old one. Deleting an image item SHALL keep its photo files, because history versions refer to them.

#### Scenario: Replacing a photo keeps the old file
- **WHEN** the photo of an image item is replaced
- **THEN** the item refers to a new file, and the file of the previous version still exists

#### Scenario: Deleting keeps the files
- **WHEN** an image item is deleted
- **THEN** the photo files its history versions refer to still exist

### Requirement: Editing an image item
Editing an image item SHALL replace any of its photo, alternative text and caption, and set its update time to the current time. Its identifier, type and creation time SHALL stay the same. The new content SHALL follow the same rules as a new image item; otherwise the edit SHALL be rejected without storing anything. Editing an identifier that is not among the listed items SHALL fail without changes.

#### Scenario: Editing keeps the identity
- **WHEN** an image item created at T1 has its caption changed at T2
- **THEN** the item keeps its identifier, its creation time T1 and its photo, its update time is T2, and its caption is the new one

#### Scenario: Too long alternative text
- **WHEN** an image item is edited to an alternative text of 1001 characters
- **THEN** the edit fails, and the item and its history are unchanged

### Requirement: Unchanged image edits are ignored
An image item edit that keeps the same photo, and whose trimmed alternative text and trimmed caption equal the stored ones, SHALL store nothing: the update time and the history SHALL stay unchanged.

#### Scenario: Same caption with extra spaces
- **WHEN** an image item with the caption "Paseo" is edited with the same photo, the same alternative text and the caption "Paseo  "
- **THEN** the item's update time is unchanged and no history record is added
