# Spec Delta

## Purpose

Keeps the user's own profile (a stable identity, a name and an avatar photo) on the phone, with every earlier version kept, so later phases can share it with other people and attribute items to the user.

## ADDED Requirements

### Requirement: One stable identity per installation
The first time the app reads the profile on an installation, it SHALL create the user's own profile with a new random UUID (version 4), no name and no photo, and store it. Afterwards the identity SHALL never change: saving the name or the photo, restarting the app or rotating the device SHALL keep the same UUID. There SHALL be exactly one own profile.

#### Scenario: First launch
- **WHEN** the app starts on an installation with no stored profile
- **THEN** one own profile is stored with a new version 4 UUID, no name and no photo

#### Scenario: Later launches
- **WHEN** the app is closed and opened again, after the name and photo were changed several times
- **THEN** the own profile still has the UUID created on the first launch, and there is still only one own profile

### Requirement: Profile content
The stored profile SHALL hold its UUID, the name (or none), the avatar photo (or none) and its creation and last update times in UTC milliseconds. A stored photo SHALL keep the name of its file in the app's photo storage, relative to that storage, and its upright width and height in pixels.

#### Scenario: Reading a saved profile
- **WHEN** the profile was saved with the name "Carmen" and a 1200 by 1600 photo
- **THEN** reading it gives the UUID, "Carmen", a relative file name and the size 1200 by 1600

### Requirement: Name rules
Before storing, the name SHALL have leading and trailing whitespace removed. A saved name SHALL NOT be empty and SHALL be at most 60 UTF-16 code units long. An empty or over-long name SHALL be rejected before anything is copied or written, naming the rule it broke.

#### Scenario: Trimmed name
- **WHEN** the profile is saved with the name "  Abuela Carmen\n"
- **THEN** the stored name is "Abuela Carmen"

#### Scenario: Empty name
- **WHEN** the profile is saved with the name "   "
- **THEN** the save is rejected as an empty name and the stored profile is unchanged

#### Scenario: Over-long name
- **WHEN** the profile is saved with a 61-character name
- **THEN** the save is rejected as too long and the stored profile is unchanged

### Requirement: Avatar photo rules
A newly chosen photo SHALL have a positive width and height. It SHALL be copied into the app's own document storage under a new random file name that keeps its image extension, so the original in the gallery can be deleted without losing the avatar. A photo that has no valid size, or whose copy fails, SHALL be rejected as unusable and nothing SHALL be written.

#### Scenario: Gallery photo deleted later
- **WHEN** the user saves a photo as the avatar and later deletes it from the gallery
- **THEN** the avatar still shows the photo, read from the app's own copy

#### Scenario: Copy failure
- **WHEN** copying the chosen photo fails
- **THEN** the save is rejected as an unusable photo and the stored profile is unchanged

### Requirement: Saving is all or nothing
Saving the profile SHALL store the name, the photo reference and the update time together or not at all. If the save fails after the photo was copied, the copy SHALL be removed. Saving the same trimmed name and the same photo SHALL write nothing and keep the update time.

#### Scenario: Database failure after copying
- **WHEN** the new photo is copied and the database write then fails
- **THEN** the stored profile is unchanged and the new copy is removed

#### Scenario: Unchanged save
- **WHEN** the profile is saved with its current name plus surrounding spaces and its current photo
- **THEN** nothing is written and the update time is unchanged

### Requirement: Earlier versions are kept
Before a save changes the profile, the version being replaced SHALL be copied into an append-only history, in the same transaction, with a counter that increases by one for each version. Photo files referenced by any version SHALL NOT be removed, including a photo the user replaced or removed.

#### Scenario: Two changes
- **WHEN** the user saves the name "Carmen", then the name "Abuela Carmen" with a photo
- **THEN** the history holds the empty first version (counter 1) and the "Carmen" version (counter 2), and the live profile is "Abuela Carmen" with the photo

#### Scenario: Photo removed
- **WHEN** the user removes the saved photo and saves
- **THEN** the live profile has no photo and the earlier photo's file still exists

### Requirement: The profile persists
The profile SHALL be stored in the app's local database on the device and SHALL survive closing and reopening the app. Adding the profile storage to a database that already holds items SHALL keep every item unchanged.

#### Scenario: Restart
- **WHEN** the user saves the name "Carmen", closes the app and opens it again
- **THEN** the profile dialog shows "Carmen"

#### Scenario: Upgrade with items
- **WHEN** an installation with text, image and event items is updated to this version
- **THEN** every item is still on the Timeline, unchanged, and an own profile with a new UUID is created
