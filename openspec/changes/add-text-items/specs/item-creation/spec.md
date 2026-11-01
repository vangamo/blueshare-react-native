# Spec Delta

## Purpose

Lets the user create new timeline items from an inline creation box at the top of the Timeline, choosing the item type first. Text items are created in this version. Event and image items are listed but not yet active.

## ADDED Requirements

### Requirement: Creation box opens at the top of the Timeline
When the create button is pressed on Timeline, the app SHALL show the creation box as the first element of the Timeline feed, above every item, in its choose step with no type selected. If the feed is scrolled down, it SHALL scroll to the top so the box is visible.

#### Scenario: Opening the box
- **WHEN** the user taps the create button on Timeline
- **THEN** the creation box appears above the first timeline item, showing "Crear nuevo elemento:", the type select with "Selecciona una opción", and the "Cancelar" and "Guardar" buttons

#### Scenario: Opening while scrolled down
- **WHEN** the user has scrolled the Timeline down and taps the create button
- **THEN** the feed scrolls to the top and the creation box is fully visible below the header

### Requirement: Creation box appearance
The creation box SHALL have a 2-point dashed border in primary blue, the creation background color, a 16-point corner radius, 16 points of padding and 16 points of space below it. Its title ("Crear nuevo elemento:" or "Crear nuevo elemento de texto:") SHALL be 14-point bold in the main text color.

#### Scenario: Box style in both palettes
- **WHEN** the creation box is open in light or dark mode
- **THEN** it shows a dashed primary-blue border on the creation background of the active palette, and its title is bold main-color text

### Requirement: Type select shows the chosen type
The choose step SHALL show a type select field that fills the box width, at least 44 points tall, with a 2-point strong-ink border, a 10-point corner radius, the card background and 16-point semibold main-color text. It SHALL read "Selecciona una opción" until a type is chosen, then the chosen option, followed by a down-pointing chevron.

#### Scenario: Initial value
- **WHEN** the creation box opens
- **THEN** the type select reads "Selecciona una opción"

#### Scenario: After choosing
- **WHEN** the user has chosen "📝 Texto"
- **THEN** the type select reads "📝 Texto"

### Requirement: Choosing a type
Tapping the type select SHALL open a list with the options "📅 Evento", "📝 Texto" and "📷 Imagen", in that order, each at least 44 points tall. "Selecciona una opción" SHALL NOT be in the list and SHALL NOT be choosable. Tapping an option SHALL close the list and make that option the selected type.

#### Scenario: Options in the list
- **WHEN** the user taps the type select
- **THEN** a list opens with exactly "📅 Evento", "📝 Texto" and "📷 Imagen", in that order

#### Scenario: Picking an option
- **WHEN** the list is open and the user taps "📷 Imagen"
- **THEN** the list closes and the type select reads "📷 Imagen"

### Requirement: Dismissing the type list
Closing the type list without picking an option, by tapping outside it or pressing the Android back button, SHALL close only the list and keep the previous selection. The creation box SHALL stay open.

#### Scenario: Tapping outside the list
- **WHEN** the type list is open with "📝 Texto" already selected and the user taps outside the list
- **THEN** the list closes, the type select still reads "📝 Texto" and the creation box stays open

#### Scenario: Android back with the list open
- **WHEN** the type list is open and the user presses the Android back button
- **THEN** only the list closes, and the creation box stays open in its choose step

### Requirement: Type select accessibility
The type select SHALL be announced as a button labeled "Crear nuevo elemento", with the current selection or "Selecciona una opción" as its value. Each option in the list SHALL be announced with its visible text and whether it is selected.

#### Scenario: Screen reader on the select
- **WHEN** a screen reader focuses the type select after "📝 Texto" was chosen
- **THEN** it announces a button named "Crear nuevo elemento" with the value "📝 Texto"

### Requirement: Guardar is enabled only after choosing a type
In the choose step, "Guardar" SHALL be disabled while no type is selected: it looks faded, is announced as disabled, and tapping it does nothing. Choosing any of the three types SHALL enable it.

#### Scenario: Nothing chosen
- **WHEN** the creation box has just opened
- **THEN** "Guardar" looks faded, is announced as disabled, and tapping it does nothing

#### Scenario: A type is chosen
- **WHEN** the user chooses "📅 Evento", "📝 Texto" or "📷 Imagen"
- **THEN** "Guardar" shows its enabled style and is announced as enabled

### Requirement: Guardar with Texto opens the text step
Pressing "Guardar" with "📝 Texto" selected SHALL replace the choose step with the text step in the same place. The text area SHALL receive focus and the keyboard SHALL open, ready to type.

#### Scenario: Going to the text step
- **WHEN** the user selects "📝 Texto" and taps "Guardar"
- **THEN** the box shows "Crear nuevo elemento de texto:", an empty text area with focus and the keyboard open, and the "Cancelar" and "Crear" buttons

### Requirement: Guardar with Evento or Imagen does nothing yet
Pressing "Guardar" with "📅 Evento" or "📷 Imagen" selected SHALL have no effect yet: the box stays in its choose step with the same selection, and no error occurs.

#### Scenario: Guardar with Evento
- **WHEN** the user selects "📅 Evento" and taps "Guardar"
- **THEN** the box stays in its choose step, the select still reads "📅 Evento", and nothing else happens

### Requirement: Text step input
The text step SHALL show a multi-line text area that fills the box width, with a 2-point strong-ink border, a 10-point corner radius, the card background and 16-point main-color text. It SHALL be at least three lines tall, grow with the text up to a maximum height, and then scroll inside. It SHALL accept line breaks.

#### Scenario: Typing several lines
- **WHEN** the user types a text with line breaks that is longer than the maximum height
- **THEN** the text area keeps its maximum height, scrolls inside, and the line breaks are kept

### Requirement: Text length limit
The text area SHALL accept at most the configured maximum text length, which is 8192 characters by default. Further typing or pasting SHALL NOT add characters beyond the limit.

#### Scenario: Reaching the limit
- **WHEN** the text area holds 8192 characters and the user types or pastes more
- **THEN** the text stays at 8192 characters

### Requirement: Crear is enabled only with some text
"Crear" SHALL be disabled, faded and announced as disabled while the text area is empty or holds only whitespace. It SHALL be enabled as soon as the text has a non-whitespace character.

#### Scenario: Only spaces and line breaks
- **WHEN** the text area holds only spaces and line breaks
- **THEN** "Crear" is disabled and tapping it does nothing

#### Scenario: Some text
- **WHEN** the user types "Hola"
- **THEN** "Crear" is enabled

### Requirement: Crear saves the text item
Pressing "Crear" SHALL save the text, with leading and trailing whitespace removed, as a new text item. The item SHALL appear as the first card of the Timeline. The creation box SHALL close, the keyboard SHALL close and the create button SHALL show again. "Crear" SHALL NOT be pressable again while the save is in progress.

#### Scenario: Creating a text
- **WHEN** the user types "  Hoy hemos jugado al parchís.  " and taps "Crear"
- **THEN** the box closes, the keyboard closes, the create button reappears, and the first card of the Timeline reads "Hoy hemos jugado al parchís."

#### Scenario: Double tap
- **WHEN** the user taps "Crear" twice quickly
- **THEN** exactly one new text item is created

### Requirement: Failed save keeps the text
If saving fails, the creation box SHALL stay open in its text step with the typed text unchanged and SHALL show the message "⚠️ No se pudo guardar. Inténtalo de nuevo.", announced to screen readers. "Crear" SHALL remain usable to try again.

#### Scenario: Storage error
- **WHEN** the user taps "Crear" and the item cannot be saved
- **THEN** the box stays open with the same text, the error message is shown and announced, no new card appears, and tapping "Crear" again retries

### Requirement: Cancelar discards the creation
Both steps SHALL show a "Cancelar" button to the left of "Guardar" or "Crear". Pressing it SHALL close the creation box, discard the selected type and any typed text, close the keyboard and show the create button again. The next time the box opens, it SHALL start at the choose step with nothing selected.

#### Scenario: Cancelling the text step
- **WHEN** the user has typed text in the text step and taps "Cancelar"
- **THEN** the box closes, no item is created, and the create button reappears

#### Scenario: Reopening after cancelling
- **WHEN** the user cancels and then taps the create button again
- **THEN** the box opens in its choose step showing "Selecciona una opción", and the earlier text is gone

### Requirement: Android back button cancels the visible box
While the creation box is on screen (Timeline shown and box open, with no type list open), pressing the Android back button SHALL behave exactly like "Cancelar". When the box is not on screen, the back button SHALL keep its usual behavior.

#### Scenario: Back while typing
- **WHEN** the text step is on screen with typed text and the user presses the Android back button
- **THEN** the box closes, the text is discarded, the app stays open on Timeline, and the create button reappears

#### Scenario: Back with no box
- **WHEN** the creation box is closed, Timeline is shown and the user presses the Android back button
- **THEN** the app behaves as before this change and leaves the app

#### Scenario: Back from another tab while a draft is pending
- **WHEN** the box is open on Timeline, the user switches to Events and presses the Android back button
- **THEN** the app returns to Timeline as usual, and the box is shown with its draft, not cancelled

### Requirement: Draft survives tab switches
Switching to Circles or Events while the creation box is open SHALL hide the box without cancelling it. When the user returns to Timeline, the box SHALL show again in the same step, with the same selected type and the same text. Returning SHALL NOT open the keyboard by itself. The draft SHALL be kept only while the app is running.

#### Scenario: Leaving and returning
- **WHEN** the user has typed "Mañana hay bingo" in the text step, switches to Circles, and then back to Timeline
- **THEN** the text step is shown with "Mañana hay bingo" in the text area, and the keyboard stays closed until the user taps the text area

#### Scenario: App restarted with a draft
- **WHEN** the app is closed completely while a draft is pending and launched again
- **THEN** Timeline shows with the creation box closed

### Requirement: Creation box buttons
The two buttons of each step SHALL share the box width equally, with 10 points between them, and be at least 44 points tall with a 10-point corner radius and 15-point bold labels. "Guardar" and "Crear" SHALL use the primary button style: the active-tab blue background and the on-primary label color. "Cancelar" SHALL use the secondary style: the muted surface background, a 2-point dark border and the main text color. Each SHALL be announced as a button whose label is its visible text.

#### Scenario: Sizes and order
- **WHEN** either step of the box is shown
- **THEN** "Cancelar" is on the left and the main button on the right, each half the width minus the gap, each at least 44 points tall

#### Scenario: Screen reader labels
- **WHEN** a screen reader focuses the buttons of the text step
- **THEN** they are announced as buttons named "Cancelar" and "Crear"
