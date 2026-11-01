---
type: Specification
title: item-creation
description: The inline creation box opened by the + button on Timeline. Choose a type, write a text, then Crear, Cancelar or the Android back button. The draft survives tab switches.
tags: [spec, implemented, creation-box, items]
resource: ../../openspec/specs/item-creation/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# item-creation (implemented)

Full text: `openspec/specs/item-creation/spec.md`. From the change `add-text-items`.

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Creation box opens at the top of the Timeline | `+` on Timeline opens the box above every item, in the choose step, and scrolls the feed to the top. | [Timeline feed](../components/timeline-feed.md), [Creation box provider](../components/creation-box-provider.md) |
| Creation box appearance | 2-point dashed primary-blue border, `creationBg`, radius 16, padding 16, 14-point bold title. | [Creation box](../components/creation-box.md) |
| Type select shows the chosen type | ≥ 44 tall, strong-ink border, card background. "Selecciona una opción" until a type is chosen, then a `▾`. | [Type select](../components/type-select.md) |
| Choosing a type | A list with "📅 Evento", "📝 Texto", "📷 Imagen" (rows ≥ 44). The placeholder is not an option. | same |
| Dismissing the type list | Tapping outside or Android back closes only the list and keeps the selection. | same |
| Type select accessibility | Button "Crear nuevo elemento" with the selection as its value. Options announce their selected state. | same |
| Guardar is enabled only after choosing a type | Faded and announced as disabled until a type is chosen. | [Box button](../components/box-button.md) |
| Guardar with Texto opens the text step | The text step replaces the choose step. The text area gets focus and the keyboard opens. | [Creation box](../components/creation-box.md) |
| Guardar with Evento or Imagen does nothing yet | The box stays in its choose step with the same selection. | same |
| Text step input | Multi-line, at least three lines, grows up to a maximum height, then scrolls. Keeps line breaks. | same |
| Text length limit | At most `TEXT_MAX_LENGTH` (8192) characters. | `src/constants/limits.ts`, [Text limit](../decisions/text-limit.md) |
| Crear is enabled only with some text | Disabled while the text is blank or only whitespace. | [Creation box](../components/creation-box.md) |
| Crear saves the text item | Saves the trimmed text, closes the box and keyboard, shows the card first. A double tap creates one item. | same, [Items module](../architecture/items-module.md) |
| Failed save keeps the text | The box stays open with the text and announces "⚠️ No se pudo guardar. Inténtalo de nuevo.". Crear retries. | same |
| Cancelar discards the creation | Closes the box, discards type and text. The next open starts empty. | same |
| Android back button cancels the visible box | Back acts like Cancelar only while the box is on screen. Otherwise back keeps its usual behavior. | [Timeline feed](../components/timeline-feed.md) |
| Draft survives tab switches | Leaving Timeline hides the box. Returning shows the same step and text without opening the keyboard. Not kept across restarts. | [Creation box provider](../components/creation-box-provider.md) |
| Creation box buttons | Two equal buttons, 10 apart, ≥ 44 tall. Guardar and Crear are primary (active-tab blue), Cancelar is secondary. | [Box button](../components/box-button.md), [Creation box buttons](../decisions/creation-box-buttons.md) |

Tests: `src/__tests__/unit/components/creation-box-test.tsx`, `type-select-test.tsx`, `box-button-test.tsx`, `timeline-back-button-test.tsx`, and the journeys in `src/__tests__/e2e/create-text-item-test.tsx`.
