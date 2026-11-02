# Proposal

## Why

The app shell is finished, but the Timeline is still a placeholder and the `+` button does nothing. Phase 1 needs the first real content: letting a user write a short text and see it in their timeline, saved on the phone. This change also sets up how items are stored, because image and event items come next and every item will later be shared with contacts over Bluetooth, with no server.

## What Changes

- The `+` button now acts per section. On Timeline it opens a creation box at the top of the feed and scrolls the feed to the top. On Circles and Events it still does nothing (contact pairing and event creation come later). The button is hidden while the creation box is open.
- New creation box (dashed blue border, as in `sketches/mobile-portrait-new-item-component.png`):
  - **Choose step:** "Crear nuevo elemento:", a select with the placeholder "Selecciona una opción" and the options "📅 Evento", "📝 Texto" and "📷 Imagen", plus "Cancelar" and "Guardar" buttons. Guardar is disabled until an option is picked. Evento and Imagen can be picked, but Guardar then does nothing.
  - **Text step:** after Texto + Guardar, the box shows "Crear nuevo elemento de texto:", a multi-line text area that gets focus and opens the keyboard, plus "Cancelar" and "Crear". Crear is disabled while the text is blank. The text is limited to 8192 characters, a configurable constant.
  - "Crear" saves the text, puts a new text card at the top of the timeline and closes the box. "Cancelar", or the Android back button while the box is on screen, closes the box and discards what was typed. Switching tabs keeps the box and its draft, and returning to Timeline shows them again.
- The Timeline placeholder is replaced by the feed. Text cards are shown newest first, as in `sketches/mobile-portrait-text-item.png`, with "Editar" and "Compartir" buttons that do nothing yet. An empty timeline shows "Sin publicaciones todavía. Pulsa en el botón + para crear una." Circles and Events keep their placeholders.
- Items are stored in a local SQLite database on the phone through `expo-sqlite`, which ships with Expo Go. Each item has a UUID, a type, creation, update and deletion timestamps (soft delete), and its text. The schema is versioned so that owner, sharing, image and event data can be added later without losing data.
- The items code follows a hexagonal (ports and adapters) layout under `src/items/`. The database driver is injected: the app gets `expo-sqlite`, and Jest gets Node's built-in `node:sqlite`, so the same SQL runs in both.
- Accessibility fixes over the mock:
  - Guardar and Crear use the darker active-tab blue, because white on `#0084ff` at 15 pt is 3.66:1, below AA.
  - Every new button is at least 44 pt tall.
  - Screen-reader labels match the visible Spanish text.
- New dependencies: `expo-sqlite` and `expo-crypto`, both included in Expo Go. Node 22.13 or later is now required for running tests.

## Capabilities

### New Capabilities

- `item-creation`: the creation box opened from the `+` button. It covers the type select, the text step, the Cancelar, Guardar and Crear buttons, the Android back button, keeping the draft across tab switches, and scrolling to the top.
- `timeline-feed`: what the Timeline section shows. That is the list of items newest first, the text card with its (inactive) Editar and Compartir buttons, and the empty, loading and error states.
- `item-storage`: how items are kept on the device. That is the local database, the fields every item has, the ID and timestamp rules, soft deletion, the text length limit, persistence across restarts and schema upgrades.

### Modified Capabilities

- `app-shell`: "Main sections as tabs" changes, because Timeline now shows the feed instead of a placeholder. "Floating create button" changes because it now acts per section and hides while the creation box is open.
- `app-theming`: the contrast and "colors come from the theme" requirements now also cover the creation box and the timeline cards. The light-palette requirement adds the creation box's main buttons as a second exception to the mock's `#0084ff`, for contrast.

## Impact

- **Code:**
  - New module `src/items/` (`domain/`, `application/`, `infrastructure/`).
  - New components in `src/components/`: creation box, type select, buttons, text card, timeline feed and providers.
  - New hooks in `src/hooks/`.
  - `src/constants/limits.ts` (`TEXT_MAX_LENGTH`).
  - `src/app/_layout.tsx` wires the providers and the `+` action.
  - `src/app/index.tsx` renders the feed.
  - `src/components/create-button.tsx` gets its per-section action and visibility.
- **Tokens:**
  - New color roles `card_shadow`, `divider` and `overlay` in both palettes.
  - New `Layout` sizes for the creation box, text area, cards and the disabled-button opacity.
- **Dependencies:** `expo-sqlite` and `expo-crypto`, installed with `npx expo install`. `package.json` gets `engines.node >= 22.13`. There is no new test dependency, since `node:sqlite` is built into Node.
- **Tests:**
  - New unit tests for the domain, the repository and migrations (on `node:sqlite`), the store and the components.
  - New Jest journey tests for creating, cancelling, the back button and tab switching.
  - The Node driver lives in `src/test-utils/` and is injected through `jest-setup.ts`.
  - `navigation-test.tsx` and `create-button-test.tsx` change, since the Timeline placeholder is gone and `+` now acts on Timeline.
- **Device checks:**
  - Persistence across a force-stop.
  - Keyboard and back button behavior.
  - A visual review of both box steps, the card and the empty state, in light and dark.
  - The approved Timeline reference screenshots get replaced.
- **Docs:** component pages, a page for the items architecture, new decision pages, testing and dependency guides, known limitations and the log.
- **Not changed:** routes, `app.json`, the header and footer.
