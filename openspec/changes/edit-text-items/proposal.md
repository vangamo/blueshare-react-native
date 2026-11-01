# Proposal

## Why

Text cards show an "Editar" button that does nothing, so a typo or an outdated message stays on the timeline for good. Users need to fix or remove what they shared. Phase 4 will share items with contacts, so every change should be recorded, not overwritten. This is the next item on the Phase 1 roadmap.

## What Changes

- "Editar" on a text card opens an **edit dialog** over the Timeline. It looks like the creation box (`sketches/mobile-portrait-new-text-component.png`): the creation background, a solid primary-blue border (the dashed one stays for drafts of new items), and the title "Editar elemento de texto:". Its parts:
  - a close button "✕" (label "Cerrar") at the top right
  - a multi-line text area holding the item's current text, with the same limits as Crear
  - "Cancelar" and "Guardar". Guardar is disabled while the text is blank or unchanged.
  - below a divider, a full-width "Borrar texto" button in a new danger style
- **Closing:** the dialog closes without changes only through "✕", "Cancelar" or the Android back button. Tapping outside the dialog does nothing.
- **Guardar** saves the new text. The card shows it right away, **in the same place**: the feed stays ordered by creation time.
- **Borrar texto** asks for confirmation inside the same dialog: "¿Borrar este texto?", "Desaparecerá de tu línea de tiempo.", "No, volver" and "Sí, borrar". "Sí, borrar" deletes the item, closes the dialog and removes the card. "No, volver" and the Android back button return to the edit step with the text kept.
- **Errors** keep the dialog open with the text kept and show "⚠️ No se pudo guardar. Inténtalo de nuevo." or "⚠️ No se pudo borrar. Inténtalo de nuevo.".
- **Storage keeps every version** (schema version 2). The live tables `items` and `text_items` keep holding what the Timeline shows. New append-only tables `items_history` and `text_items_history`, keyed by item id plus a counter (1, 2, 3, …), hold earlier versions:
  - an edit first copies the current rows into the history, then updates the text and the update time in place
  - a deletion copies the current rows into the history with the deletion time set, then removes them from the live tables
  - all of it happens in one transaction
- **BREAKING (storage spec):** a deleted item is no longer kept in `items` with `deleted_at` set. Its record, with the deletion time, lives on in the history tables. Nothing has been deleted so far, so no stored data is affected.
- **New color roles** `danger` and `on_danger` in both palettes, for the deletion buttons, all checked for WCAG AA.

## Capabilities

### New Capabilities

- `item-editing`: the edit dialog opened from a card's "Editar". It covers its look, the prefilled text area, Guardar and its enabled rule, the ways to close it (✕, Cancelar, back, no outside tap), the deletion confirmation step, error messages and screen reader behavior.

### Modified Capabilities

- `item-storage`: "Soft deletion" changes, since the record moves to the history tables and deleting is now a user action. New requirements cover editing a text item (same id, same creation time, new update time, the same text rules, no-op when unchanged), the edit history with its counter, and all-or-nothing edits and deletions.
- `timeline-feed`: "Card actions do nothing yet" is replaced. Editar opens the edit dialog, and only Compartir still does nothing. "Items newest first" states that an edited item keeps its place. New requirement: edits and deletions show right away.
- `app-theming`: the contrast, control-boundary and "colors come from the theme" requirements now also cover the edit dialog and the danger buttons. The light-palette exception for the main buttons now includes the dialog's Guardar.

## Impact

- **Code:**
  - `src/items/`: migration step 2, repository methods (find, update and delete a text item, with history), use cases `updateTextItem` and `deleteItem`, an `ItemNotFoundError`, and the timeline store's `updateText` and `deleteItem`.
  - `src/hooks/use-timeline.ts` exposes the two new actions.
  - New components: the edit dialog. `BoxButton` gets the danger variants. `TextItemCard` gets an `onEdit` prop. `TimelineFeed` renders the dialog.
  - `src/constants/design-system.json` (2 color roles). `src/constants/theme.ts` may get one or two `Layout` sizes (close button, dialog margins).
- **Dependencies:** none. React Native's `Modal` is already used by the type select.
- **Data:** schema version 1 to 2, adding two tables. Existing items are untouched.
- **Tests:** unit tests for the migration, repository, use cases, store, dialog and buttons, plus new contrast pairs. A Jest journey test covers edit, cancel, delete and the confirmation. `text-item-card-test.tsx` changes, since Editar now acts.
- **Device checks:** keyboard with the dialog, the back button in both steps, TalkBack, and a visual review in light and dark, with new reference screenshots.
- **Docs:** new component pages, the items module and schema decision pages, specs summaries, the roadmap and known limitations (Editar no longer inactive), and the log.
- **Not changed:** routes, `app.json`, the header, the footer, the create button and the creation box.
