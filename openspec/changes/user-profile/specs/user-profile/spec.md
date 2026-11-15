# Spec Delta

## Purpose

Lets the user see and change their own name and avatar photo in a profile dialog opened from the header avatar, so the people they share with in later phases know who they are.

## ADDED Requirements

### Requirement: The avatar opens the profile dialog
Tapping the header avatar SHALL close the keyboard if it is open and open the profile dialog over the whole screen. The dialog SHALL cover the header, the section content, the tab bar and the create button, dimmed by the overlay color. While it is open, nothing under it SHALL respond to touch or be reachable by a screen reader.

#### Scenario: Opening from Timeline
- **WHEN** the user taps the avatar on Timeline
- **THEN** the profile dialog opens, and the header, the feed, the tab bar and the `+` button are behind the overlay and do not respond to taps

#### Scenario: Opening while searching
- **WHEN** the title field is focused with the keyboard open and the user taps the avatar
- **THEN** the keyboard closes and the profile dialog opens

#### Scenario: Screen reader
- **WHEN** a screen reader user swipes through the open profile dialog
- **THEN** only the dialog's controls are announced, never the header, the feed or the tabs behind it

### Requirement: Closing returns to the previous section
Closing the profile dialog in any way SHALL leave the user on the section that was shown before it opened, with that section as it was: the same tab, scroll position, and creation box draft or open step.

#### Scenario: Back to Circles
- **WHEN** the user opens the profile dialog on Circles and closes it with Guardar
- **THEN** Circles is shown and its tab is active

#### Scenario: Timeline keeps its place
- **WHEN** the Timeline is scrolled down with a creation box draft pending, and the user opens and cancels the profile dialog
- **THEN** the Timeline is at the same scroll position and the creation box still shows the draft

### Requirement: Profile dialog appearance
The profile dialog SHALL look like the edit dialogs. It SHALL use the same box, border, corner radius, padding and placement near the top, spanning the current layout's content column and never the full width of a tablet. Its title SHALL be "Editar perfil:", with the close button at its right.

#### Scenario: Phone portrait
- **WHEN** the profile dialog is open in the phone portrait layout
- **THEN** it is a box with the creation background and a 2-point primary-blue border, as wide as the screen minus 16 points on each side, titled "Editar perfil:"

#### Scenario: Tablet in landscape
- **WHEN** the profile dialog is open in the tablet landscape layout
- **THEN** the box is at most 600 points wide and centered, not full screen

### Requirement: Profile form contents
The dialog SHALL show, from top to bottom:
- the title with the close button;
- a round avatar preview, centered;
- "Elegir foto" (or "Cambiar foto" when a photo is shown) and, when a photo is shown, "Quitar foto";
- the "Nombre" label with the hint "Tu nombre completo o cómo te llaman." and a single-line name field;
- "Cancelar" on the left and "Guardar" on the right;
- a 1-point divider;
- a full-width "Compartir por Bluetooth" button.

#### Scenario: Profile with no photo
- **WHEN** the dialog opens for a profile that has no photo
- **THEN** the preview shows `👵`, the photo button reads "Elegir foto" and there is no "Quitar foto"

#### Scenario: Profile with a photo
- **WHEN** the dialog opens for a profile that has a photo
- **THEN** the preview shows the photo cropped to the circle, the photo button reads "Cambiar foto" and "Quitar foto" is shown

### Requirement: Fields start from the saved profile
Each time the dialog opens, the name field SHALL hold the saved name (empty when there is none) and the preview SHALL show the saved photo or `👵`. The name field SHALL NOT open the keyboard by itself. Changes made in a dialog that was closed without saving SHALL NOT appear when it opens again.

#### Scenario: Reopening after cancelling
- **WHEN** the saved name is "Abuela Carmen", the user types "Carmen" in its place, discards the change, and opens the dialog again
- **THEN** the name field shows "Abuela Carmen"

### Requirement: Name field
The name field SHALL be a single-line field that accepts any full name or nickname of at most 60 characters and SHALL stop accepting characters beyond that. It SHALL look like the other single-line fields of the dialogs: card background, a 2-point strong-ink border, a 10-point corner radius and main-color text.

#### Scenario: Typing past the limit
- **WHEN** the name field holds 60 characters and the user types another one
- **THEN** the field still holds the same 60 characters

### Requirement: Choosing an avatar photo
"Elegir foto" and "Cambiar foto" SHALL open the system photo library to pick one image, with no cropping and no permission prompt. A picked photo SHALL replace the preview at once and SHALL be stored only when the user saves. Cancelling the picker SHALL change nothing. If the library can't be opened or the photo can't be read, the dialog SHALL show "⚠️ No se pudo abrir la galería. Inténtalo de nuevo." and keep the previous preview.

#### Scenario: Picking a photo
- **WHEN** the user taps "Elegir foto" and picks a photo
- **THEN** the preview shows that photo cropped to the circle, the button reads "Cambiar foto", "Quitar foto" appears, and nothing is saved yet

#### Scenario: Cancelling the picker
- **WHEN** the user taps "Cambiar foto" and closes the library without picking
- **THEN** the preview and the buttons are unchanged

#### Scenario: Gallery failure
- **WHEN** the photo library fails to open
- **THEN** the dialog shows "⚠️ No se pudo abrir la galería. Inténtalo de nuevo.", announced to screen readers, and the preview is unchanged

### Requirement: Removing the avatar photo
"Quitar foto" SHALL remove the photo from the preview, so it shows `👵` and the photo button reads "Elegir foto". The removal SHALL take effect only when the user saves.

#### Scenario: Removing the saved photo
- **WHEN** the profile has a photo and the user taps "Quitar foto"
- **THEN** the preview shows `👵`, "Quitar foto" disappears, and the header avatar still shows the saved photo until the user saves

### Requirement: Guardar is enabled only for a real change
"Guardar" SHALL be disabled, faded and announced as disabled while the name, with leading and trailing whitespace removed, equals the saved name and the photo is the saved one. It SHALL be enabled as soon as the trimmed name differs from the saved name, a photo was picked, or the saved photo was removed.

#### Scenario: Only spaces added
- **WHEN** the saved name is "Carmen" and the user adds spaces after it
- **THEN** "Guardar" stays disabled

#### Scenario: New photo
- **WHEN** the user picks a photo and does not touch the name
- **THEN** "Guardar" is enabled

### Requirement: Guardar saves the profile
Pressing an enabled "Guardar" with a valid name SHALL save the trimmed name and the photo shown in the preview, or no photo. The dialog and the keyboard SHALL close, and the header avatar SHALL show the new photo or `👵` right away. "Guardar" SHALL NOT be pressable again while the save is in progress.

#### Scenario: Saving a name and a photo
- **WHEN** the user types "  Abuela Carmen " and picks a photo, then presses "Guardar"
- **THEN** the dialog closes, the saved name is "Abuela Carmen", and the header avatar shows the new photo

#### Scenario: Saving without a photo
- **WHEN** the user removes the saved photo and presses "Guardar"
- **THEN** the dialog closes and the header avatar shows `👵`

#### Scenario: Double tap
- **WHEN** the user taps "Guardar" twice quickly
- **THEN** the profile is saved once

### Requirement: The name is required
When "Guardar" is pressed and the name, with leading and trailing whitespace removed, is empty, the dialog SHALL stay open with every edit kept and SHALL show "⚠️ Escribe tu nombre.", announced to screen readers. Nothing SHALL be saved. The message SHALL disappear when the user edits the name or the photo.

#### Scenario: Photo picked, no name yet
- **WHEN** the profile has no name, the user picks a photo and presses "Guardar"
- **THEN** the dialog stays open with the picked photo, shows "⚠️ Escribe tu nombre.", and the header avatar still shows `👵`

#### Scenario: Name erased
- **WHEN** the saved name is "Carmen", the user erases it and presses "Guardar"
- **THEN** the dialog stays open with an empty name field and shows "⚠️ Escribe tu nombre."

### Requirement: An unusable photo blocks the save
When "Guardar" is pressed and the picked photo can't be used (it has no valid size or can't be copied into the app's storage), the dialog SHALL stay open with every edit kept and SHALL show "⚠️ No se pudo usar esa foto. Elige otra.", announced to screen readers. Nothing SHALL be saved. The message SHALL disappear when the user edits the name or the photo.

#### Scenario: Copy fails
- **WHEN** the user picks a photo whose file can't be copied and presses "Guardar"
- **THEN** the dialog stays open with the picked photo and the typed name, shows "⚠️ No se pudo usar esa foto. Elige otra.", and the saved profile is unchanged

### Requirement: Failed save keeps the edit
If saving fails for any other reason, the dialog SHALL stay open with every edit kept and SHALL show "⚠️ No se pudo guardar. Inténtalo de nuevo.", announced to screen readers. The header avatar SHALL keep showing the saved profile, and "Guardar" SHALL remain usable to try again.

#### Scenario: Storage error
- **WHEN** the database rejects the save
- **THEN** the dialog stays open with the edits, shows "⚠️ No se pudo guardar. Inténtalo de nuevo.", and a second "Guardar" can succeed

### Requirement: Closing without changes
When nothing has changed (as "Guardar is enabled only for a real change" defines), "Cancelar", the close button and the Android back button SHALL close the dialog at once, saving nothing. Tapping the overlay SHALL do nothing.

#### Scenario: Back with no changes
- **WHEN** the dialog is open with no changes and the user presses Android back
- **THEN** the dialog closes and nothing is saved

#### Scenario: Tapping outside
- **WHEN** the user taps the dimmed overlay outside the box
- **THEN** the dialog stays open

### Requirement: Confirmation before discarding changes
When something has changed, "Cancelar", the close button and the Android back button SHALL switch the dialog to a confirmation step instead of closing it. The step SHALL show the title "¿Descartar los cambios?", the text "Los cambios que no has guardado se perderán.", "No, volver" on the left and "Sí, descartar" on the right, the latter with the solid danger style.

#### Scenario: Cancel after typing
- **WHEN** the user changes the name and presses "Cancelar"
- **THEN** the dialog shows "¿Descartar los cambios?" with "No, volver" and "Sí, descartar"

### Requirement: Answering the discard confirmation
In the confirmation step, "Sí, descartar" SHALL close the dialog and save nothing. "No, volver" and the Android back button SHALL return to the form with every edit kept.

#### Scenario: Discarding
- **WHEN** the confirmation step is shown and the user presses "Sí, descartar"
- **THEN** the dialog closes, the saved profile is unchanged, and the header avatar shows the saved photo or `👵`

#### Scenario: Going back to the form
- **WHEN** the confirmation step is shown and the user presses Android back
- **THEN** the form is shown again with the changed name and the picked photo

### Requirement: Bluetooth sharing placeholder
The form SHALL show a full-width "Compartir por Bluetooth" button with the secondary style. Pressing it SHALL do nothing yet: no navigation, no message, no error, and the dialog's edits SHALL be kept.

#### Scenario: Pressing it
- **WHEN** the user presses "Compartir por Bluetooth"
- **THEN** the button shows press feedback and the dialog stays as it was

### Requirement: Profile that can't be loaded
If the saved profile can't be read, the dialog SHALL open with only the title, the close button, the message "⚠️ No se pudo cargar tu perfil." and "Cancelar", which closes it. Until the profile is read, the header avatar SHALL show `👵`.

#### Scenario: Database failure at start
- **WHEN** the profile could not be read and the user taps the avatar
- **THEN** the dialog shows "⚠️ No se pudo cargar tu perfil." and "Cancelar", with no form, and "Cancelar" closes it

### Requirement: Header avatar shows the profile photo
The header avatar SHALL show the saved photo filling the circle, cropped and centered, inside its 2-point strong-ink border. It SHALL show `👵` on the avatar background color when there is no saved photo, before the profile is read, or when the photo file can't be read.

#### Scenario: After a restart
- **WHEN** the user saved a photo, closes the app and opens it again
- **THEN** the header avatar shows the saved photo

#### Scenario: Missing file
- **WHEN** the saved photo's file can't be read
- **THEN** the header avatar shows `👵`

### Requirement: Profile dialog accessibility
Every control in the dialog SHALL have a touch target of at least 44×44 points, a button or text-field role, and an accessibility label equal to its visible text. The name field SHALL be labelled "Nombre", with the hint read as its description. The preview SHALL be announced as an image named "Foto de perfil" when it shows a photo and "Sin foto de perfil" when it shows `👵`. The close button SHALL be labelled "Cerrar".

#### Scenario: Screen reader reads the preview
- **WHEN** a screen reader focuses the preview of a profile with a photo
- **THEN** it announces an image named "Foto de perfil"

#### Scenario: Disabled Guardar
- **WHEN** a screen reader focuses "Guardar" with no changes made
- **THEN** it is announced as a disabled button named "Guardar"
