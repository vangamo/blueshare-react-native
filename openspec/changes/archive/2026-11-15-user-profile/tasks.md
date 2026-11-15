# Tasks

Before writing code that touches an Expo or React Native API, check the v58 docs (https://docs.expo.dev/versions/v58.0.0/), as CLAUDE.md asks. This change uses no API that the app does not already use (design Context).

Each task that creates or changes TS/TSX code is done only when these pass:
- `npx expo lint --max-warnings 0`
- `npx tsc --noEmit`
- `npm test`

No new `eslint-disable`, `.only` or `.skip`. Tests go in `src/__tests__/unit/<area>/` (`unit/profile/` mirrors `src/profile/`) or `src/__tests__/e2e/`. Shared helpers go in `src/test-utils/`. Start a dated entry for this change in `docs/log.md` with the first task, and add a line to it in each group.

## 1. Limits and sizes

- [x] 1.1 Add `PROFILE_NAME_MAX_LENGTH = 60` to `src/constants/limits.ts` and extend `limits-test.ts` (design D4). Start the `docs/log.md` entry. Verify that `npm test` passes.
- [x] 1.2 Add `profileAvatar` (112 / 136) and `profileAvatarEmoji` (56 / 64) to both size sets in `src/constants/theme.ts` (design D9), and add them to the "tablet ≥ phone" expectations in `theme-test.ts`. Add these contrast pairs to `theme-test.ts`, in both palettes: `primaryDark` on `cardBg` and on `creationBg` (3:1), and `textMuted` on `creationBg` (4.5:1) unless already covered. Update `docs/design-system/layout-sizes.md` and `docs/design-system/color-palettes.md`. Verify that the tests pass with no change to `design-system.json` and that the links resolve.

## 2. Profile domain

- [x] 2.1 Create `src/profile/domain/profile.ts` with `Profile`, `AvatarInput`, `normalizeProfileName`, `checkAvatar` and `withProfileChanges`. Create `errors.ts` with `InvalidProfileError` (field `name` or `avatar`, reason `empty`, `too_long`, `invalid` or `copy_failed`) and `ProfileNotFoundError`. Create `ports.ts` with `ProfileRepository` (`findMe`, `createMe`, `updateMe`). Follow design D2 and D4: reuse `StoredPhoto`, `PickedPhoto` and `photoExtension` from `items/domain/`, and import no React, Expo or SQL. Write `src/__tests__/unit/profile/domain/profile-test.ts`. It covers trimming, an empty or blank name, exactly 60 and 61 code units, a zero or NaN photo size, and `withProfileChanges` returning the same object for a trimmed-equal name with the same photo. Verify that `npm test` passes.
- [x] 2.2 Write `src/profile/CLAUDE.md` with the module's local rules: the dependency rule, which `items/` files it may import and that `items/` never imports `profile/`, real SQL in tests, history before update, and the shared migration list. Write `docs/architecture/profile-module.md` (Open Knowledge Format frontmatter, layout, ports, rules) and list it in `docs/architecture/index.md`. Verify that the links resolve.

## 3. Schema v5 and the repository

- [x] 3.1 Append step 5 (`people`, the `people_one_me` partial unique index and `people_history`, design D3) to `MIGRATIONS` in `src/items/infrastructure/migrations.ts`, with a comment naming this change. Extend the migration tests on `NodeSqlDatabase`. They cover: a fresh database reaching `user_version = 5`; a v4 database with text, image and event rows upgrading with every item unchanged; a second `is_me = 1` row being rejected; and an avatar with a file but no width being rejected by the `CHECK`. Verify that `npm test` passes.
- [x] 3.2 Create `src/profile/infrastructure/sqlite-profile-repository.ts` (design D5): `findMe`, `createMe`, and `updateMe` that archives into `people_history` with the next counter, then updates, in one transaction, and throws `ProfileNotFoundError` with no own row. Use positional `?` only. Write `sqlite-profile-repository-test.ts` on `NodeSqlDatabase`: a round trip with and without an avatar, counters 1 and 2 after two updates holding the earlier versions, and a failing driver (`failing-sql-database.ts`) leaving the live row and the history unchanged. Verify that `npm test` passes.
- [x] 3.3 Update `docs/architecture/items-module.md`: schema v5 in a short section pointing to the profile module page, step 5 living in the shared list, and the `people` row from "Future tables" now existing without `original_name`. Update `docs/decisions/items-schema.md` with a short note on `people` and `is_me`. Verify that the links resolve.

## 4. Generalized dialog frame (no behavior change for the edit dialogs)

- [x] 4.1 Refactor `src/components/edit-dialog-frame.tsx` as design D7 describes:
  - replace `deleteLabel`, `confirmTitle` and `onDelete` with an optional `deletion`;
  - add `confirmDiscard`, `saveErrorMessage`, `footer` and `editable`;
  - change the reducer steps to `edit`, `confirmDelete` and `confirmDiscard`.

  Update `EditTextDialog`, `EditImageDialog` and `EditEventDialog` to pass `deletion={...}`. First verify that every existing `edit-*-dialog-test.tsx`, `edit-*-item-test.tsx` e2e test and `src/test-utils/edit-dialog-harness.tsx` user passes **unchanged**.
- [x] 4.2 Add `edit-dialog-frame-test.tsx` for the new paths, using a minimal body:
  - no `deletion` means no divider and no deletion button;
  - `footer` is drawn after the divider;
  - with `confirmDiscard` and `canSave` false, Cancelar, Cerrar and back close at once;
  - with `confirmDiscard` and `canSave` true, Cancelar, Cerrar and back (`spyOnBackHandler`, or the `Modal`'s `onRequestClose`) open "¿Descartar los cambios?";
  - "Sí, descartar" closes, and "No, volver" and back return with the body's state kept;
  - `saveErrorMessage` replaces the default message;
  - `editable={false}` shows only the body and Cancelar.

  Update `docs/components/edit-dialog-frame.md` (or the frame section of the dialog pages) and `docs/decisions/shared-edit-dialog-frame.md`. Verify that `npm test` passes and the links resolve.

## 5. Use cases, store, composition and hook

- [x] 5.1 Create `src/profile/application/load-profile.ts` and `update-profile.ts`, in the order design D5 gives. Write tests with real files on `NodePhotoStore`, fixed ids and a fixed clock. They cover:
  - the first load creating one profile with the injected UUID, and a second load returning it unchanged;
  - an empty name throwing before any copy;
  - an unchanged save writing nothing;
  - a picked photo copied as `<id>.<ext>`;
  - a failed copy throwing `InvalidProfileError('avatar', 'copy_failed')` with nothing written;
  - a failed `updateMe` removing the new copy and rethrowing;
  - "remove" setting the avatar to none and keeping the old file.

  Verify that `npm test` passes.
- [x] 5.2 Create `src/profile/application/profile-store.ts` and `profile-module.ts` (design D6). Write `profile-store-test.ts`: the loading, ready and error statuses; the snapshot object kept on an unchanged save; a rejected update leaving the snapshot untouched; and `prepare` awaited before the load. Verify that `npm test` passes.
- [x] 5.3 Make `createItemsModule` accept an optional `prepare` (default unchanged). In `ItemsProvider`, build both modules from one `createAppAdapters()` call with a shared `once(() => migrate(db))`, and provide `ProfileContext` (design D2). Add `src/hooks/use-profile.ts` (`useProfile()`, re-exporting `InvalidProfileError`). Add a test that renders the app on a fresh database and checks that the timeline and the profile both reach `ready` and that step 5 ran once. Update `docs/components/items-provider.md` and the profile module page. Verify that `npm test` passes and the existing items tests are unchanged.

## 6. Avatar image and the header

- [x] 6.1 Create `src/components/avatar-image.tsx` (design D8): a circle with a strong-ink border on `avatarBg`, a cover-fitted `expo-image` photo, `👵` on no URI or `onError`, and an image role only when labelled. Write `avatar-image-test.tsx` covering the emoji with no URI, the photo with a URI, the fallback after `onError`, the label and role, and that sizes and colors come from the props, the theme and the size set in both palettes. Write `docs/components/avatar-image.md` and list it in the components index. Verify that `npm test` passes and the links resolve.
- [x] 6.2 Change `AppHeader`:
  - the avatar becomes a `Pressable` with role `button`, label "Profile" and a touch target of at least `Layout.touchTarget`;
  - it shows `AvatarImage` with the saved photo's URI (`usePhotoUriFor`);
  - it holds `profileOpen` and an open counter, calls `Keyboard.dismiss()` on open, and renders `ProfileDialog` while open;
  - a tap does nothing while the profile is loading.

  Update `app-header-test.tsx`: the role and label; a target of at least 44×44 in all four test windows; the emoji, then the photo after a save; and a tap opening the dialog. Update `docs/components/app-header.md`. Verify that `npm test` passes.

## 7. Profile dialog

- [x] 7.1 Create `src/components/profile-dialog.tsx` on the frame with `confirmDiscard` and the Bluetooth `footer` (design D8 and D9). It holds:
  - the centered preview;
  - "Elegir foto" or "Cambiar foto" and "Quitar foto", reusing `usePickPhoto` and the exported `PICKER_ERROR_MESSAGE`;
  - the gallery error;
  - "Nombre" with its hint and a `BoxTextField` (`maxLength`, `autoCapitalize="words"`, no `autoFocus`);
  - `canSave` computed during render;
  - the `saveErrorMessage` mapping;
  - the load-failure body with `editable={false}`.

  Export the copy constants.
- [x] 7.2 Write `profile-dialog-test.tsx`, with a mocked picker (`src/test-utils/picker-assets.ts`) and `NodePhotoStore`, covering each user-profile requirement:
  - the fields start from the saved profile;
  - Guardar is disabled for trimmed-equal names, and enabled for a new photo or a removed one;
  - "⚠️ Escribe tu nombre." on an empty name, with the edits kept;
  - "⚠️ No se pudo usar esa foto. Elige otra." on a failed copy;
  - the generic message on a failing driver, with a retry that succeeds;
  - the double-tap guard;
  - the gallery error and cancelling the picker;
  - "Quitar foto" showing `👵`;
  - the discard step from Cancelar, Cerrar and back;
  - "Compartir por Bluetooth" doing nothing and keeping the edits;
  - the load-failure body;
  - the accessibility labels, roles and hint, and 44-point targets.

  Verify that `npm test` passes.
- [x] 7.3 Write `docs/components/profile-dialog.md` and list it in the components index. Add the profile dialog to `docs/development/accessibility.md` where the dialogs are listed. Verify that the links resolve.

## 8. Journeys

- [x] 8.1 Write `src/__tests__/e2e/profile-test.tsx` with `renderRouter('./src/app')`. It covers:
  - opening from Circles, saving a name and a photo, returning to Circles with its tab active, and the header avatar showing the photo;
  - opening from a scrolled Timeline with a creation box draft, cancelling with no changes, and the scroll and draft kept;
  - changing the name, pressing Android back (`spyOnBackHandler`), answering "No, volver", then Cancelar and "Sí, descartar", and the saved profile unchanged;
  - reopening after a discard showing the saved values;
  - a new render on the same database (restart) showing the saved name and photo with the same UUID.

  Verify that `npm test` passes.
- [x] 8.2 Extend `rotation-test.tsx`: the profile dialog with a picked photo and a changed name survives a rotation in each direction, in the form and in the discard step, and the section under it stays the same. Verify that `npm test` passes.

## 9. Device check and visual review

- [x] 9.1 With the `run-on-emulator` skill:
  - open the profile from each tab, pick a photo, save, and check the header avatar;
  - force-stop Expo Go, reopen it, and check that the name and photo are still there and that the existing items survived the v4 to v5 migration;
  - check Android back in both steps, and TalkBack on the header avatar ("Profile, button") and through the dialog (nothing behind it is reachable);
  - type the name through the full-screen editor in phone landscape.

  Write the results in `docs/log.md`.
- [x] 9.2 Run the `visual-review` skill in light and dark, in all four layouts, for the header avatar with and without a photo and for the profile dialog (empty, with a photo, with each error, and the discard step). Check that the dialog matches the edit dialogs' box and never spans a tablet's full width. With the user's approval, add the new references to `src/__tests__/e2e/screenshots/` and update `docs/development/visual-review.md`.

## 10. Final integration check

- [x] 10.1 Run the full check:
  - `npx expo lint --max-warnings 0`, `npx tsc --noEmit` and `npm test` pass;
  - `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx` finds nothing;
  - `grep -rn "from '@/profile\|from '@/items" src/items src/profile` shows `items/` never importing `profile/`;
  - `grep -rn "expo-" src/profile` finds nothing;
  - `package.json` has no new dependency;
  - `git ls-files ios android` lists nothing, and nothing under `sketches/` changed;
  - `grep -rnE "eslint-disable|\.only\(|\.skip\(" src` finds nothing new;
  - `openspec validate user-profile --strict` passes.

## Workflow follow-up

- After review, run `/opsx:archive user-profile`. Its guidance updates:
  - `docs/specs/` for the new user-profile and profile-storage capabilities, and for app-shell, adaptive-layout and app-theming;
  - `docs/decisions/` pages for D1 (a `Modal` dialog owned by the header, not a route), D2 and D3 (a separate profile module sharing the database and migrations; `people` with `is_me`), and D7 (the generalized dialog frame);
  - the roadmap (the profile is done, and is groundwork for Phase 4);
  - known limitations: the avatar can no longer be listed as doing nothing; full-size avatar copies are never removed; the edit dialogs don't ask before discarding; `src/storage/` extraction is pending; "Compartir por Bluetooth" does nothing;
  - `CLAUDE.md` ("Current state", a Key rules line for `src/profile/`, and "When to read what" rows for the profile module and dialog) and `src/items/CLAUDE.md` (the shared migration list);
  - the `run-on-emulator` and `visual-review` skills (profile screens).
