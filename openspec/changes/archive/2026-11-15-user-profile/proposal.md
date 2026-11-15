# Proposal

## Why

BlueShare has no notion of who is using it. The header avatar is a fixed `👵` that does nothing, and nothing stored on the phone says whose items they are. Phase 4 will share items and the user's own details between phones over Bluetooth, so the app needs a profile the user controls (a name and a photo) and a stable identity that never changes, before anything is shared.

## What Changes

- **Opening the profile:** tapping the header avatar opens a **profile dialog** (`"Editar perfil:"`) over the whole screen. It looks and behaves like the edit dialogs: the same box in the content column (never full screen on tablets), the dimmed overlay, the close button and Android back. The dialog covers the header, the tab bar and the `+` button, so nothing under it can be used. Closing it always leaves the user on the section they had open.
- **The form:**
  - a large round preview of the avatar, showing the photo or `👵`;
  - "Elegir foto" (or "Cambiar foto") to pick one photo from the gallery, and "Quitar foto" to remove it;
  - a "Nombre" field, for a full name or a nickname, at most 60 characters;
  - "Cancelar" and "Guardar", then a divider and a full-width "Compartir por Bluetooth" button that does nothing yet.
- **Saving:** "Guardar" is enabled only when there is a real change. It saves the trimmed name and the avatar and closes the dialog. If the name is empty, the chosen photo can't be used, or the save fails, the dialog stays open with a message and keeps the user's edits.
- **Discarding:** "Cancelar", the close button and Android back close the dialog at once when nothing changed. When something changed, they first ask "¿Descartar los cambios?" inside the dialog ("No, volver" / "Sí, descartar"). Back in that step returns to the form.
- **Header avatar:** it becomes a button labelled "Profile" with a touch target of at least 44 points. It shows the saved photo, cropped to the circle, and keeps `👵` while there is no photo or the file can't be read.
- **Identity and storage:**
  - The first time the app opens the profile, it creates the user's own person record with a new random UUID that never changes afterwards, and no name or photo yet.
  - The name and avatar are kept in the local SQLite database through migration step 5, in a `people` table that already anticipates the contacts of Phase 2.
  - The chosen photo is copied into app storage like item photos.
  - Every earlier version goes to a history table.
- **Shared dialog frame:** `EditDialogFrame` gets an optional deletion step, an optional discard confirmation and custom save messages, so the profile dialog can reuse it. The three edit dialogs behave exactly as they do today.

## Capabilities

### New Capabilities

- `user-profile`: the profile dialog opened from the header avatar. Covers the form (avatar preview, photo buttons, name), when Guardar is enabled, saving, the name and avatar errors, failed saves, the discard confirmation, Android back, the Bluetooth placeholder, the dialog when the profile can't be loaded, the header avatar showing the photo, and accessibility.
- `profile-storage`: the user's own profile on the phone. Covers the stable UUID created once, the name and avatar rules, all-or-nothing saves, copying the avatar photo, the history of earlier versions, and persistence across restarts.

### Modified Capabilities

- `app-shell`: the Avatar requirement changes from "display-only, does nothing" to a button labelled "Profile" that opens the profile dialog and shows the saved photo. The touch target requirement covers the avatar.
- `adaptive-layout`: the tablet size set adds the profile avatar preview. The content column, rotation and phone landscape keyboard requirements cover the profile dialog.
- `app-theming`: the text contrast, icon and boundary contrast, and "colors come from the theme" requirements cover the profile dialog, the photo shown in the header avatar and the large avatar preview.

## Impact

- **Code:**
  - New `src/profile/` module, hexagonal like `src/items/`:
    - domain: `Profile`, `normalizeProfileName`, `checkAvatar`, `withProfileChanges` and `InvalidProfileError`;
    - application: `loadProfile`, `updateProfile`, the profile store and the composition root;
    - infrastructure: `SqliteProfileRepository`.
  - Migration step 5 is appended to the shared `MIGRATIONS` list in `src/items/infrastructure/migrations.ts`, because the database file has one schema version.
  - `ItemsProvider` builds both modules from one set of adapters and runs the migrations once, then exposes the profile through `useProfile()`.
  - `src/constants/limits.ts` gets `PROFILE_NAME_MAX_LENGTH`. `theme.ts` gets the profile avatar sizes.
  - Components:
    - new `AvatarImage` (used by the header and the dialog);
    - new `ProfileDialog` on the shared frame;
    - `AppHeader`, where the avatar becomes a button and the header owns the dialog's open state;
    - `EditDialogFrame`, generalized, with the three edit dialogs passing their deletion settings explicitly.
- **Dependencies:** none. `expo-image-picker`, `expo-crypto`, `expo-file-system` and `expo-image` are already installed and bundled in Expo Go.
- **Data:** the schema goes from version 4 to 5, adding the `people` and `people_history` tables. Items are untouched. Avatar photos are stored in the same `<documents>/images/` folder.
- **Tests:**
  - unit tests for the domain;
  - the repository and migration on `node:sqlite`;
  - the use cases with real files on the Node photo store;
  - the store, and the components (`AvatarImage`, `ProfileDialog`, `EditDialogFrame` with and without deletion, `AppHeader`);
  - Jest journeys for opening, saving, discarding, the errors and rotation;
  - new sizes in the theme tests.
- **Device checks:** the dialog in all four layouts, light and dark, TalkBack on the header avatar and the dialog, picking and removing a photo, and persistence after a restart.
- **Docs:**
  - a new profile module page;
  - component pages for the profile dialog and the avatar image;
  - updates to app header, edit dialog frame, items module (the shared migration and the `people` table), layout sizes, known limitations, roadmap and the log.
- **Not changed:** routes and navigation (no new screen, no Stack), the tab bar, the create button, the menu and search, items and their cards, and Bluetooth sharing itself (Phase 4).
