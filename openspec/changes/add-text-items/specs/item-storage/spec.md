# Spec Delta

## Purpose

Defines how timeline items are kept on the device: where they live, what every item records, how items are identified, timestamped and deleted, the limits on stored text, and how stored data survives restarts and app upgrades.

## ADDED Requirements

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
Deleting an item SHALL keep its record and set its deletion time, so that the deletion can later be passed on to contacts. Items with a deletion time SHALL NOT be listed in the Timeline. No user action deletes items in this version.

#### Scenario: A deleted record stays stored
- **WHEN** a stored item has a deletion time
- **THEN** its record is still in the database and the Timeline does not list it

### Requirement: Saving is all or nothing
Saving an item SHALL store its common record and its type-specific content together. If any part fails, nothing of that item SHALL remain stored.

#### Scenario: Failure while saving the text
- **WHEN** storing the text of a new text item fails after its common record was written
- **THEN** no record of that item remains, and the Timeline does not show it

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
