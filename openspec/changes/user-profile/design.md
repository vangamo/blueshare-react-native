# Design

## Context

See proposal.md (Why). The facts below are the current code this design builds on.

- **Header:** `src/components/app-header.tsx` renders the avatar as a non-pressable `View` (`accessible`, label "Profile") with a fixed `👵`, sized by `sizes.avatar` (42 on phones, 46 on tablets) and `sizes.avatarEmoji`. `AppHeader` is mounted once by the root layout, inside `ItemsProvider`, and outside the tab navigator, so it never remounts on a tab switch or a rotation.
- **Dialogs:** the three edit dialogs render the shared `EditDialogFrame` (`src/components/edit-dialog-frame.tsx`). It provides:
  - a React Native `Modal` (`transparent`, `fade`, `statusBarTranslucent`, `navigationBarTranslucent`) that covers the whole app, header included;
  - a `KeyboardAvoidingView` and `ScrollView`, with the box in `columnWidth`;
  - the title and "Cerrar" button;
  - a reducer with the `edit` and `confirm` steps, busy state and a `save` or `delete` error;
  - a double-tap guard;
  - `onRequestClose`, where Android back returns to the edit step from the confirm step and closes otherwise.

  The confirm step is fixed to deletion: `deleteLabel`, `confirmTitle`, `onDelete`, "Desaparecerá de tu línea de tiempo.", "No, volver" and "Sí, borrar". The [edit dialog](../../../docs/decisions/edit-dialog.md) and [shared edit dialog frame](../../../docs/decisions/shared-edit-dialog-frame.md) decisions say why it is a local-state `Modal` and a single frame.
- **Photos:**
  - `usePickPhoto()` opens the library for one image, with no cropping and no permission prompt, and decodes the size when the picker reports 0. It throws on picker errors.
  - `ImageFields` already shows `PICKER_ERROR_MESSAGE` on failure.
  - `photoExtension()` in `items/domain/image-item.ts` picks the file extension.
  - `importPhotos` and `removePhotos` in `items/application/import-photos.ts` copy and roll back.
  - The `PhotoStore` port writes to `<documents>/images/`.
  - `expo-image` with `contentFit="cover"` is already used by the event tiles.
- **Storage:**
  - One SQLite file (`blueshare.db`). `MIGRATIONS` in `src/items/infrastructure/migrations.ts` is append-only, and step N sets `PRAGMA user_version = N`. The database is at version 4.
  - `createItemsModule` wires `prepare: () => migrate(db)` into the timeline store, which runs it on its first `subscribe`.
  - `ItemsProvider` creates the adapters once with `createAppAdapters()`. In Jest the mock returns a fresh in-memory `NodeSqlDatabase` for each call, so two calls would give two databases.
  - `docs/architecture/items-module.md` ("Future tables") already plans `people (id, display_name, original_name, is_me)` and an `owner_id` on `items`.
- **Copy:** the shell's accessibility labels are English ("Menu", "Search", "Profile", "Create"), and all dialog copy is Spanish ([Spanish copy and labels](../../../docs/decisions/spanish-copy-labels.md)).
- **SDK 58 facts used:** no new native module. `Modal`, `expo-image`, `expo-image-picker`, `expo-crypto` and `expo-file-system` are used exactly as they are today.

## Goals / Non-Goals

**Goals:**
- Reuse the edit dialog frame and the form components, so the profile dialog looks and behaves like the other dialogs.
- Give the installation a stable identity now, stored where Phase 2 contacts and Phase 4 sharing can build on it without moving data.
- Keep the shell untouched apart from the avatar: no route, no Stack, no change to tabs, the menu or search.

**Non-Goals:**
- Bluetooth sharing of the profile. The button is a placeholder.
- Contacts (`people` rows that are not the user), the `original_name` column, `owner_id` on items and showing the name anywhere outside the dialog.
- Cropping or resizing the avatar photo. The original is copied as for item photos (see Risks).
- Asking before discarding in the three edit dialogs. They keep closing at once, as their spec states.
- Moving the shared database infrastructure out of `src/items/` (see D2).

## Decisions

### D1. A `Modal` dialog owned by `AppHeader`, not a route

The profile dialog is rendered by `AppHeader` from a local `profileOpen` state, as `{profileOpen ? <ProfileDialog key={openCount} onClose={...} /> : null}`.
- **No screen underneath changes,** so "return to the last screen" needs no code, and the tab's scroll position and the creation box draft are untouched.
- **The `Modal` covers the header,** so there's nothing to disable in the menu or search.
- **Android back is `onRequestClose`,** already handled by the frame.
- **Rotation keeps the dialog,** because `AppHeader` never remounts. That's the same reason the edit dialogs survive rotation inside the feed.
- **Fresh fields on every open:** a counter `key` mounts the dialog anew each time, so its fields start from the saved profile.
- **Keyboard:** opening calls `Keyboard.dismiss()` first. The title field then returns to rest through its existing `keyboardDidHide` handling.

Alternatives considered:
- **A Stack above a `(tabs)` group** gives native back and a deep link, but restructures `src/app/` and touches the [tab bar in one slot](../../../docs/decisions/tab-bar-single-slot.md) decision for no user-visible gain.
- **A hidden tab route** needs manual return-to-tab logic or `backBehavior="history"`, which changes today's back rule.
- **An in-shell overlay without `Modal`** keeps the header tappable. The user explicitly dropped that need, and the overlay needs manual back handling and screen-reader hiding.

### D2. A separate `src/profile/` module that shares the database and its migrations

```
src/profile/
  domain/          Profile, normalizeProfileName, checkAvatar, withProfileChanges,
                   InvalidProfileError, ProfileRepository (port)
  application/     load-profile.ts, update-profile.ts, profile-store.ts,
                   profile-module.ts (composition root)
  infrastructure/  sqlite-profile-repository.ts
```

- **Same rules as `src/items/`:**
  - the dependency rule `domain/` ← `application/` ← `infrastructure/`;
  - real SQL in tests;
  - positional `?` only;
  - UI access only through a provider and a hook.
- **The module reuses the items module's ports.** The domain reuses `StoredPhoto`, `PickedPhoto` and `photoExtension` from `items/domain/image-item.ts`, and the `Clock`, `IdGenerator` and `PhotoStore` ports from `items/domain/ports.ts`. The infrastructure reuses the `SqlDatabase` port from `items/infrastructure/sql-database.ts`. `profile/` may import `items/domain/`, `items/application/import-photos.ts` and those infrastructure ports. `items/` never imports `profile/`.
- **One migration list:** the database file has one `user_version`, so step 5 is appended to the existing `MIGRATIONS` in `src/items/infrastructure/migrations.ts`, with a comment naming this change. Two lists would need two version counters in one file.
- **Migrations run once:** `ItemsProvider` builds `const prepare = once(() => migrate(db))` and passes it to both `createItemsModule` and `createProfileModule`. `createItemsModule` gains an optional `prepare` and defaults to today's `() => migrate(db)`, so its tests are unchanged. Without the shared promise, the two stores would race to run step 5.
- **One set of adapters:** `ItemsProvider` keeps its name and gains a second context, `ProfileContext`. Both modules are built in the same lazy `useState` initializer from one `createAppAdapters()` call, so they share the database connection, and in Jest the same in-memory database.

Alternatives considered:
- **Profile inside `src/items/`:** a profile is not an item, and `TimelineItem`, `TYPE_TABLES` and `archive()` would gain cases that make no sense for it.
- **Moving the database, migrations and adapters to a new `src/storage/` first:** this is the cleaner end state, but it's a refactor that touches every items import and test. It's left as a follow-up and noted in known limitations at archive time.
- **A `ProfileProvider` that opens its own adapters:** it would open a second connection in the app and a different database in Jest.

### D3. Migration step 5: `people` and `people_history`

```sql
CREATE TABLE people (
  id            TEXT PRIMARY KEY NOT NULL,                 -- UUID v4, never changes
  is_me         INTEGER NOT NULL DEFAULT 0 CHECK (is_me IN (0, 1)),
  display_name  TEXT,                                      -- NULL = not set yet
  avatar_file   TEXT,                                      -- '<uuid>.<ext>' in <documents>/images/
  avatar_width  INTEGER CHECK (avatar_width > 0),
  avatar_height INTEGER CHECK (avatar_height > 0),
  created_at    INTEGER NOT NULL,                          -- UTC ms
  updated_at    INTEGER NOT NULL,
  CHECK ((avatar_file IS NULL) = (avatar_width IS NULL)
     AND (avatar_file IS NULL) = (avatar_height IS NULL))
);
CREATE UNIQUE INDEX people_one_me ON people (is_me) WHERE is_me = 1;
CREATE TABLE people_history (
  person_id     TEXT NOT NULL,
  counter       INTEGER NOT NULL CHECK (counter >= 1),
  display_name  TEXT,
  avatar_file   TEXT,
  avatar_width  INTEGER,
  avatar_height INTEGER,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  PRIMARY KEY (person_id, counter)                         -- no FK: same reasoning as items_history
);
```

- **`people` with `is_me`, not a one-row `profile` table.** The items module doc already plans `people` for contacts and for `owner_id`. A profile received over Bluetooth in Phase 4 becomes a `people` row with `is_me = 0`, so the user's own row needs no move. The partial unique index enforces "exactly one own profile" in SQL as well as in code. `original_name` is not created now, because only what features use exists. A later step adds it with `ALTER TABLE`.
- **`display_name` is nullable:** the row is created before the user has typed a name. The non-empty rule is a domain rule on save, like the item text limits, not a SQL `CHECK`.
- **Partial unique indexes** are supported by both bundled SQLite versions (3.8 and later). `node:sqlite` runs the same SQL in tests.
- **Upgrade:** the step only adds tables, so items are untouched (profile-storage, "The profile persists").

### D4. Domain rules

- `Profile = { id, name: string | null, avatar: StoredPhoto | null, createdAt, updatedAt }`.
- **`normalizeProfileName(raw)`** trims the name. It throws `InvalidProfileError('name', 'empty')` for an empty name, or `('name', 'too_long', PROFILE_NAME_MAX_LENGTH)` for one over the limit. The limit is 60 UTF-16 code units, in `src/constants/limits.ts`.
- **`checkAvatar(picked)`** throws `InvalidProfileError('avatar', 'invalid')` unless the width and height are finite and positive.
- **`withProfileChanges(current, { name, avatar })`** returns the current profile (the same object) when the trimmed name and the photo file are equal, and otherwise a new profile with `updatedAt` from the clock.
- `AvatarInput = { kind: 'keep' } | { kind: 'remove' } | { kind: 'picked'; photo: PickedPhoto }`.

### D5. Use cases and the order of operations

- **`loadProfile({ repository, ids, clock })()`** calls `repository.findMe()`. When that returns `null`, it builds `{ id: ids.newId(), name: null, avatar: null, createdAt: now, updatedAt: now }`, calls `repository.createMe(profile)` and returns it. The unique index makes a second `createMe` fail rather than create two own profiles.
- **`updateProfile({ repository, ids, clock, photos })(current, { name, avatar })`** runs in this order:
  1. normalize the name, which may throw before anything else happens;
  2. for a picked photo, run `checkAvatar`;
  3. build the candidate. If nothing changed (picked always counts as a change), return `current` and write nothing;
  4. copy a picked photo with `importPhotos` under `<ids.newId()>.<photoExtension(photo)>`. If the copy fails, throw `InvalidProfileError('avatar', 'copy_failed')`;
  5. `repository.updateMe(next)`. If it fails, remove the new copy with `removePhotos` and rethrow the original error.

  Old avatar files are never removed, because history points to them.
- **`SqliteProfileRepository`** has `findMe()`, `createMe(profile)` and `updateMe(profile)`. `updateMe` archives the live row into `people_history` with `COALESCE(MAX(counter), 0) + 1`, then updates the row, in one `db.transaction`. If no own row exists it throws `ProfileNotFoundError`.

### D6. Profile store and `useProfile()`

- **`createProfileStore({ prepare, loadProfile, updateProfile })`** follows the timeline store:
  - `getSnapshot()` returns `{ status: 'loading' | 'ready' | 'error', profile: Profile | null }`. It is a new object only on change.
  - `subscribe()` starts the load on its first call: `prepare()`, then `loadProfile()`.
  - `update(input)` waits for the load, runs the use case and notifies subscribers. When it rejects, the snapshot is left untouched. An unchanged save keeps the snapshot object.
- **The load starts when the header mounts,** because `AppHeader` calls `useProfile()` to draw the avatar. So it runs at app start, in parallel with the timeline load, and both wait on the shared `prepare`.
- **`useProfile()`** uses `useSyncExternalStore` and returns `{ status, profile, updateProfile }`. `InvalidProfileError` is re-exported for the dialog's error mapping, as `useTimeline` re-exports item types.

### D7. Generalizing `EditDialogFrame`

The frame changes like this:
- **Deletion becomes optional:** `deleteLabel`, `confirmTitle` and `onDelete` become `deletion?: { label; confirmTitle; onDelete }`. Without it, there is no divider and no deletion button.
- **New optional props:**
  - `confirmDiscard?: boolean`. When it is set and `canSave` is true, "Cancelar", "Cerrar" and back move to a `discard` step instead of closing. That step shows "¿Descartar los cambios?", "Los cambios que no has guardado se perderán.", "No, volver" and "Sí, descartar" (`danger`). "Sí, descartar" closes, and "No, volver" and back return to `edit`. `canSave` already means "there is a real change", so it doubles as the "dirty" flag.
  - `saveErrorMessage?: (error: unknown) => string`. It defaults to `EDIT_SAVE_ERROR_MESSAGE`, and the profile dialog maps `InvalidProfileError` with it.
  - `footer?: ReactNode`, drawn after a divider below Cancelar and Guardar, in the place of the deletion button. The profile dialog puts "Compartir por Bluetooth" there.
  - `editable?: boolean`, default `true`. When it is false, the frame shows only the body and "Cancelar", for the load-failure case.
- **Steps:** the reducer's `step` becomes `'edit' | 'confirmDelete' | 'confirmDiscard'`, and `error` gains the custom message string.
- **The three edit dialogs** pass `deletion={...}` and nothing else changes, so their tests must pass unchanged. That is the check that the refactor kept their behavior (item-editing has no delta).

Alternative considered: a lower-level `DialogFrame` with `EditDialogFrame` as a thin wrapper. It has a cleaner name, but it's a larger diff and goes against the single-frame decision. If a fourth kind of dialog appears, rename it then.

### D8. The profile dialog body and `AvatarImage`

- **`AvatarImage({ uri, size, emojiSize, label? })`:**
  - a circle of `size`, with a `Layout.borderWidth` border in `primaryDark` on `avatarBg`;
  - the photo through `expo-image` with `contentFit="cover"`, which falls back to `👵` on `onError` (the same pattern as `PhotoPreview`);
  - when `label` is given it is `accessible` with role `image`, and it is hidden from screen readers otherwise.

  The header uses it at `sizes.avatar` and `sizes.avatarEmoji`, with no label, because the button carries "Profile". The dialog uses it at `sizes.profileAvatar` and `sizes.profileAvatarEmoji`, labelled "Foto de perfil" or "Sin foto de perfil".
- **The header avatar** becomes a `Pressable` with role `button`, label "Profile" and press feedback. Its touch target is at least `Layout.touchTarget` square, with the circle centered, so the 42-point phone circle still gets a 44-point target. The header row's height (70) already fits it.
- **`ProfileDialog`**, on the frame with `confirmDiscard`, from top to bottom:
  - the centered `AvatarImage`;
  - a row with the photo `BoxButton` ("Elegir foto" or "Cambiar foto") and "Quitar foto", both `secondary`. "Quitar foto" shows only when a photo is shown;
  - the gallery error;
  - `FieldLabel` "Nombre" with its hint, and `BoxTextField` with `maxLength={PROFILE_NAME_MAX_LENGTH}`, `autoCapitalize="words"` and no `autoFocus`.

  The footer holds "Compartir por Bluetooth" (`secondary`, `onPress={() => {}}`).
- **Picking** reuses the `ImageFields` pattern: a `pickingRef` guard, `usePickPhoto()`, and on an error `PICKER_ERROR_MESSAGE` plus the iOS announcement. The message is exported from `image-fields.tsx` and imported, not duplicated.
- **State:** `name`, `avatar: AvatarInput`, `pickerFailed`. `canSave` is computed during render: the trimmed name differs from `profile.name ?? ''`, or `avatar.kind !== 'keep'`. Removing a photo when there is none never happens, because "Quitar foto" is hidden.
- **Error mapping (`saveErrorMessage`):**
  - `InvalidProfileError` with field `name` → "⚠️ Escribe tu nombre.";
  - with field `avatar` → "⚠️ No se pudo usar esa foto. Elige otra.";
  - anything else → the default save message.

  Editing the name or the photo calls `clearError()`.
- **Load failure:** when the status is `error`, the dialog renders the frame with `editable={false}` and the body "⚠️ No se pudo cargar tu perfil.". While the status is `loading`, a tap on the avatar does nothing. The load starts at mount and takes milliseconds, so this is acceptable.

### D9. Tokens, sizes and copy

- **New sizes** in both size sets in `theme.ts`: `profileAvatar` (112 on phones, 136 on tablets) and `profileAvatarEmoji` (56 and 64). Everything else reuses existing sizes (`controlHeight`, `inputFont`, `fieldLabel`, `fieldHint`, `boxTitle`).
- **No new colors:** `avatarBg`, `primaryDark`, `creationBg`, `cardBg`, `textMain`, `textMuted`, `danger`, `onDanger` and `overlay` already exist. The contrast tests add these pairs, in both palettes:
  - `primaryDark` on `cardBg` (the header avatar border) and on `creationBg` (the preview border), at 3:1;
  - `textMuted` on `creationBg` (the hint), at 4.5:1, if it isn't already covered by the image step tests.
- **Copy:** Spanish for everything in the dialog, and "Profile" (English) for the header button, following the shell labels. Constants are exported from `profile-dialog.tsx` so tests import them: `PROFILE_TITLE`, `NAME_HINT`, `NAME_REQUIRED_MESSAGE`, `AVATAR_UNUSABLE_MESSAGE`, `PROFILE_LOAD_ERROR_MESSAGE` and `DISCARD_TITLE`.

## Risks / Trade-offs

- **[Risk] Refactoring `EditDialogFrame` breaks the three edit dialogs.** → Their component and e2e tests run unchanged, as the first check after the refactor (tasks group 4), before any profile code uses the frame.
- **[Risk] `profile/` depends on `items/` internals (the migrations file and ports).** → The direction is one-way and documented. The `src/storage/` extraction is recorded as a known limitation.
- **[Risk] The timeline and profile stores race on migration.** → The shared `once(prepare)` promise, plus a Jest test that renders the app on a fresh database and checks that both load with `user_version = 5`.
- **[Trade-off] Full-size avatar photos.** A phone photo of several MB is copied for a 42-point circle, and every replaced avatar stays on disk because history points to it. → Accepted, the same as item photos. Resizing with `expo-image-manipulator` (bundled in Expo Go) is a follow-up for Phase 4 together with item photos.
- **[Trade-off] Profile dialog asks before discarding, edit dialogs don't.** → Accepted and specified per dialog. It's noted as a possible follow-up for the edit dialogs.
- **[Risk] Avatar tap while the profile is loading does nothing.** → The load starts at app start and normally takes milliseconds. The avatar shows `👵` meanwhile, as the spec states.
- **[Risk] A UUID on the device is a persistent identifier.** → It never leaves the phone in this change. Phase 4 must decide what is shared and with whom.

## Migration Plan

- **Deploy:** schema step 5 runs on the first launch of this build and only adds tables. The own profile is created right after, on the first load.
- **Rollback:** revert the code. An older build ignores the extra tables, because it only reads the item tables and its `MIGRATIONS` stops at 4 while `user_version` is 5, so it runs no step. During development, clearing Expo Go's data resets the database.
