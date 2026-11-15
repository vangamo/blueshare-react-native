# item-storage Specification

## Purpose

Defines how timeline items are kept on the device: where they live, what every item records, how items are identified, timestamped and deleted, the limits on stored text, and how stored data survives restarts and app upgrades.

## Requirements

### Requirement: Items are stored on the device
Items SHALL be stored in a local database on the phone. Creating and listing items SHALL NOT need a network connection, a server or an account.

#### Scenario: Creating offline
- **WHEN** the phone has no network connection and the user creates a text item
- **THEN** the item is saved and shown in the Timeline

### Requirement: Items survive restarts
Saved items SHALL still be there, unchanged and in the same order, after the app is closed completely and opened again.

#### Scenario: Force-close and reopen
- **WHEN** the user creates the texts "Uno" and "Dos", force-closes the app and opens it again
- **THEN** the Timeline shows "Dos" and then "Uno"

### Requirement: Common item record
Every item SHALL record:
- a unique identifier: a random version 4 UUID generated on the phone
- its type: `text`, `image` or `event`
- its creation time and last update time
- its deletion time, empty unless the item is deleted

Times SHALL be UTC milliseconds since the Unix epoch. A new item SHALL have its update time equal to its creation time.

#### Scenario: A new text item
- **WHEN** a text item is created
- **THEN** its record has a version 4 UUID that no other stored item has, type `text`, equal creation and update times in UTC milliseconds, and an empty deletion time

#### Scenario: Identifiers from different phones
- **WHEN** two phones create items independently
- **THEN** their identifiers come from random version 4 UUIDs, so they can later be combined without clashes

### Requirement: Text item content
A text item SHALL also store its text. The stored text SHALL have leading and trailing whitespace removed, keep its inner line breaks, and be between 1 character and the configured maximum text length, which is 8192 characters by default. Text outside these limits SHALL be rejected without storing anything, whatever its source.

#### Scenario: Whitespace is trimmed
- **WHEN** a text item is created from "\n  Hola\nabuela  \n"
- **THEN** the stored text is "Hola\nabuela"

#### Scenario: Blank text is rejected
- **WHEN** a text item is created from text that holds only whitespace
- **THEN** the creation fails and nothing is stored

#### Scenario: Too long
- **WHEN** a text item is created from 8193 characters
- **THEN** the creation fails and nothing is stored, while 8192 characters are accepted

### Requirement: Soft deletion
Deleting an item SHALL remove it from the items the Timeline lists and keep a record of it, with its last content and its deletion time, in the item history, so that the deletion can later be passed on to contacts. A deleted item SHALL NOT be listed in the Timeline, and its identifier SHALL NOT be reused. Deleting an item is a user action ("Sí, borrar" in the edit dialog).

#### Scenario: A deleted record stays stored
- **WHEN** the text item "Hola" is deleted
- **THEN** the history holds a record of that item with the text "Hola" and the deletion time, and the Timeline does not list it

#### Scenario: Deleting an item that no longer exists
- **WHEN** a deletion is requested for an identifier that is not among the listed items
- **THEN** the deletion fails and nothing is stored or changed

### Requirement: Saving is all or nothing
Saving an item SHALL store its common record and its type-specific content together. If any part fails, nothing of that item SHALL remain stored. For an image item or an event item, the copies of its photos SHALL also be removed when saving fails.

#### Scenario: Failure while saving the text
- **WHEN** storing the text of a new text item fails after its common record was written
- **THEN** no record of that item remains, and the Timeline does not show it

#### Scenario: Failure while saving an image item
- **WHEN** the photo of a new image item was copied and storing its content fails
- **THEN** no record of that item remains, the copied photo file is removed, and the Timeline does not show it

#### Scenario: Failure while copying the photos of an event
- **WHEN** a new event item has three photos, and copying the third one fails after the first two were copied
- **THEN** no record of that item remains, the two copied files are removed, and the Timeline does not show it

#### Scenario: Failure while saving an event item
- **WHEN** every photo of a new event item was copied and storing its photo list fails
- **THEN** no record of that item remains, every copied file is removed, and the Timeline does not show it

### Requirement: Schema upgrades keep data
The database SHALL record its schema version. On launch, the app SHALL apply any missing upgrade steps in order, each one completely or not at all, and keep every stored item. A fresh install SHALL create the current schema. A database already at the current version SHALL be left unchanged.

#### Scenario: Fresh install
- **WHEN** the app starts for the first time
- **THEN** the database is created at the current schema version with no items

#### Scenario: Upgrade with existing items
- **WHEN** a newer app version with an extra upgrade step starts on a database that holds items
- **THEN** the step is applied once, the schema version is raised, and every existing item is still listed

#### Scenario: Already up to date
- **WHEN** the app starts on a database at the current schema version
- **THEN** no upgrade step runs and the stored items are unchanged

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
Before an item is edited or deleted, its current record and content SHALL be added to the item history as a new version. Versions of one item SHALL be numbered 1, 2, 3, … in the order they were added, even when several are added in the same millisecond. History versions SHALL never be changed or removed by editing or deleting. For an event item, a version SHALL hold its whole photo list in its order.

#### Scenario: Two edits and a deletion
- **WHEN** the text item "A" is edited to "B", then to "C", and then deleted
- **THEN** its history holds version 1 with "A", version 2 with "B" and version 3 with "C" and the deletion time, and only versions 1 and 2 have an empty deletion time

#### Scenario: Each version keeps its times
- **WHEN** the text item "A", created and last updated at T1, is edited at T2
- **THEN** history version 1 has the creation time T1, the update time T1 and the text "A"

#### Scenario: Image item history
- **WHEN** an image item with photo P1 and caption "Uno" has its photo replaced by P2 and is then deleted
- **THEN** its history holds version 1 with P1 and "Uno", and version 2 with P2, "Uno" and the deletion time

#### Scenario: Event item history
- **WHEN** an event item with the title "Viaje" and photos P1 and P2 has P1 removed and P3 added, and is then deleted
- **THEN** its history holds version 1 with "Viaje" and P1, P2 in that order, and version 2 with "Viaje", P2, P3 in that order and the deletion time

### Requirement: Editing and deleting are all or nothing
Adding the history version and changing or removing the item SHALL happen together. If any part fails, the item, its content and its history SHALL stay as they were.

#### Scenario: Failure while updating the text
- **WHEN** storing the new text fails after the history version was written
- **THEN** no new history version remains, and the item keeps its previous text and update time

#### Scenario: Failure while deleting
- **WHEN** removing the item fails after the history version was written
- **THEN** no new history version remains, and the Timeline still lists the item

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
When an image item or an event item is saved with newly chosen photos, the app SHALL store a copy of each photo in its own private storage, under a new unique name, and the item SHALL refer to those copies. The item SHALL keep showing its photos after the app restarts and after the originals are removed from the device's gallery or cache. Photos SHALL be stored and read without a network connection.

#### Scenario: Original removed from the gallery
- **WHEN** the user creates an image item and then deletes the original photo from the device's gallery
- **THEN** the image card still shows the photo, also after the app restarts

#### Scenario: Two items with the same photo
- **WHEN** the user creates two image items from the same gallery photo
- **THEN** each item refers to its own copy

#### Scenario: The same photo twice in one event
- **WHEN** the user picks the same gallery photo twice for one event
- **THEN** the event refers to two different copies, one per position

### Requirement: Photo files are kept for the history
A stored photo file SHALL never be overwritten. Replacing, adding or removing an item's photos SHALL store each new photo as a new file and keep the old ones. Deleting an image item or an event item SHALL keep its photo files, because history versions refer to them.

#### Scenario: Replacing a photo keeps the old file
- **WHEN** the photo of an image item is replaced
- **THEN** the item refers to a new file, and the file of the previous version still exists

#### Scenario: Removing an event photo keeps its file
- **WHEN** a photo is removed from an event item
- **THEN** the item no longer refers to it, and its file still exists

#### Scenario: Deleting keeps the files
- **WHEN** an image item or an event item is deleted
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

### Requirement: Event item content
An event item SHALL also store a title, a category, an optional description, and an ordered list of photos, each with its width and height in pixels. An event item SHALL hold at least one photo and at most the configured maximum number of photos, 10 by default. An event item outside these bounds SHALL be rejected without storing anything.

#### Scenario: No photo
- **WHEN** an event item is created with a title and a category but no photo
- **THEN** the creation fails and nothing is stored

#### Scenario: Too many photos
- **WHEN** an event item is created with 11 photos
- **THEN** the creation fails, nothing is stored and no photo is copied, while 10 photos are accepted

### Requirement: Event photo order is kept
The photos of an event item SHALL be stored and listed in the order they were given, and that order SHALL survive restarts.

#### Scenario: Order after a restart
- **WHEN** an event item is saved with photos A, B and C and the app restarts
- **THEN** the item lists A, B and C in that order

### Requirement: Event texts are trimmed
The title, category and description of an event item SHALL have leading and trailing whitespace removed. A title or category that is empty after trimming SHALL be rejected without storing anything. A description that is empty after trimming SHALL be stored as absent.

#### Scenario: Optional description
- **WHEN** an event item is created with the title "  Viaje  ", the category " Familia " and the description "   "
- **THEN** the stored item has the title "Viaje", the category "Familia" and no description

#### Scenario: Blank category
- **WHEN** an event item is created with the category "   "
- **THEN** the creation fails and nothing is stored

### Requirement: Event text limits
The title SHALL be at most the configured maximum event title length, 120 characters by default, the category at most the configured maximum category length, 24 characters by default, and the description at most the configured maximum event description length, 2000 characters by default. An event item with a text over its limit SHALL be rejected without storing anything, whatever its source.

#### Scenario: Title too long
- **WHEN** an event item is created with a title of 121 characters
- **THEN** the creation fails and nothing is stored, while 120 characters are accepted

#### Scenario: Category too long
- **WHEN** an event item is created with a category of 25 characters
- **THEN** the creation fails and nothing is stored, while 24 characters are accepted

#### Scenario: Description too long
- **WHEN** an event item is created with a description of 2001 characters
- **THEN** the creation fails and nothing is stored, while 2000 characters are accepted

### Requirement: Editing an event item
Editing an event item SHALL replace any of its photo list, title, category and description, and set its update time to the current time. Its identifier, type and creation time SHALL stay the same. The new content SHALL follow the same rules as a new event item; otherwise the edit SHALL be rejected without storing anything. Editing an identifier that is not among the listed items SHALL fail without changes.

#### Scenario: Editing keeps the identity
- **WHEN** an event item created at T1 has its category changed at T2
- **THEN** the item keeps its identifier, its creation time T1, its title and its photos, its update time is T2, and its category is the new one

#### Scenario: Removing the last photo
- **WHEN** an event item is edited to hold no photo
- **THEN** the edit fails, and the item and its history are unchanged

### Requirement: Unchanged event edits are ignored
An event item edit that keeps the same photos in the same order, and whose trimmed title, category and description equal the stored ones, SHALL store nothing: the update time and the history SHALL stay unchanged, and no photo SHALL be copied.

#### Scenario: Same title with extra spaces
- **WHEN** an event item titled "Viaje" is edited with the same photos, category and description and the title "Viaje  "
- **THEN** the item's update time is unchanged and no history record is added
