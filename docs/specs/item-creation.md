---
type: Specification
title: item-creation
description: The inline creation box opened by the + button on Timeline. Choose a type, write a text, pick a photo with its texts, or pick up to 10 photos for an event with a title, category and description, then Crear, Cancelar or the Android back button. The draft survives tab switches.
tags: [spec, implemented, creation-box, items]
resource: ../../openspec/specs/item-creation/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-06T12:00:00Z
---

# item-creation (implemented)

Full text: `openspec/specs/item-creation/spec.md`. From the change `add-text-items`, extended by `add-image-items` (the image step) and `event-items` (the event step, which replaced "Guardar with Evento does nothing yet").

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Creation box opens at the top of the Timeline | `+` on Timeline opens the box above every item, in the choose step, and scrolls the feed to the top, so it is fully visible below the header and the top tab bar. | [Timeline feed](../components/timeline-feed.md), [Creation box provider](../components/creation-box-provider.md) |
| Creation box appearance | 2-point dashed primary-blue border, `creationBg`, radius 16, padding 16, 14-point bold title (one per step, including "Crear nuevo elemento de evento:"). | [Creation box](../components/creation-box.md) |
| Type select shows the chosen type | ≥ 44 tall, strong-ink border, card background. "Selecciona una opción" until a type is chosen, then a `▾`. | [Type select](../components/type-select.md) |
| Choosing a type | A list with "📅 Evento", "📝 Texto", "📷 Imagen" (rows ≥ 44). The placeholder is not an option. | same |
| Dismissing the type list | Tapping outside or Android back closes only the list and keeps the selection. | same |
| Type select accessibility | Button "Crear nuevo elemento" with the selection as its value. Options announce their selected state. | same |
| Guardar is enabled only after choosing a type | Faded and announced as disabled until a type is chosen. | [Box button](../components/box-button.md) |
| Guardar with Texto opens the text step | The text step replaces the choose step. The text area gets focus and the keyboard opens. | [Creation box](../components/creation-box.md) |
| Guardar with Evento opens the event step | Thumbnails, "Elegir fotos", Título, Categoría with suggestions, Descripción, Cancelar and Crear. No keyboard on open. | [Creation box](../components/creation-box.md), [Event fields](../components/event-fields.md) |
| Choosing event photos | The system picker with multiple selection (images only, no permission prompt) adds photos at the end in the picker's order. The button then reads "Añadir fotos". A cancelled pick changes nothing. | `usePickPhotos` |
| Event photo limit | At most `EVENT_MAX_PHOTOS` (10). The picker is limited to the slots left, extra photos are dropped, and at the limit the button is disabled with "Un evento puede tener hasta 10 fotos." | [Event fields](../components/event-fields.md) |
| Event photo thumbnails | Square, cropped thumbnails in rows (3 per row on phones, 4 on tablets), "Foto N de M". | `EventPhotoGrid` |
| Removing an event photo | A 44-point "✕" in each corner, "Quitar foto N", removes it at once with no confirmation. | same |
| Event photo picker failure | The gallery message in the step, the draft is kept, the button retries. | same |
| Event title field | Labeled "Título", required, at most `EVENT_TITLE_MAX_LENGTH` (120). | [Event fields](../components/event-fields.md) |
| Event category field | Labeled "Categoría", required, at most `EVENT_CATEGORY_MAX_LENGTH` (24). | same |
| Category suggestions | "Familia", "Amigos", "Trabajo", "Encuentro" (≥ 44 tall, wrapping). A press fills the field without opening the keyboard. | `CategorySuggestions` |
| Event description field | Labeled "Descripción", optional, at most `EVENT_DESCRIPTION_MAX_LENGTH` (2000). | same |
| Crear is enabled only with photos, a title and a category | At least one photo and a non-blank title and category. The description does not count. | [Creation box](../components/creation-box.md) |
| Crear saves the event item | Copies the photos in order, saves the trimmed texts, closes the box and shows the card first. One item per double tap. | same, [Items module](../architecture/items-module.md) |
| Failed event save keeps the draft | The step stays with its photos and texts and shows the save error. Crear retries. | same |
| Event step accessibility | The photo button is named by its text and ≥ 44 tall; the fields are named Título, Categoría and Descripción. | same |
| Guardar with Imagen opens the image step | The image step replaces the choose step. | [Creation box](../components/creation-box.md) |
| Choosing a photo | "Elegir foto" opens the system photo library (no permission prompt). A cancelled pick changes nothing. | `usePickPhoto` |
| Photo picker failure | A message in the step, the draft is kept and the user can try again. | same |
| Photo preview | The photo whole at its proportions, up to the layout's maximum height. | [Photo preview](../components/photo-preview.md) |
| Alternative text field | Labeled, optional, at most `ALT_TEXT_MAX_LENGTH` (1000) characters. | [Field components](../components/field-components.md) |
| Caption field | Labeled, optional, at most `CAPTION_MAX_LENGTH` (500) characters. | same |
| Crear is enabled only with a photo | Disabled until a photo is chosen, whatever the texts. | [Creation box](../components/creation-box.md) |
| Crear saves the image item | Copies the photo into app storage, saves the item, closes the box and shows the card first. One item per double tap. | same, [Items module](../architecture/items-module.md) |
| Failed image save keeps the draft | The box stays with the photo and texts and shows the save error. Crear retries. | same |
| Image step accessibility | Labels equal the visible text, the photo has an announced preview and the fields have hints. | same |
| Text step input | Multi-line, at least three lines, grows up to a maximum height, then scrolls. Keeps line breaks. | same |
| Text length limit | At most `TEXT_MAX_LENGTH` (8192) characters. | `src/constants/limits.ts`, [Text limit](../decisions/text-limit.md) |
| Crear is enabled only with some text | Disabled while the text is blank or only whitespace. | [Creation box](../components/creation-box.md) |
| Crear saves the text item | Saves the trimmed text, closes the box and keyboard, shows the card first. A double tap creates one item. | same, [Items module](../architecture/items-module.md) |
| Failed save keeps the text | The box stays open with the text and announces "⚠️ No se pudo guardar. Inténtalo de nuevo.". Crear retries. | same |
| Cancelar discards the creation | Closes the box, discards type, text and any chosen photos (nothing is copied). The next open starts empty. | same |
| Android back button cancels the visible box | Back acts like Cancelar only while the box is on screen. Otherwise back keeps its usual behavior. | [Timeline feed](../components/timeline-feed.md) |
| Draft survives tab switches | Leaving Timeline hides the box. Returning shows the same step and content (text, image fields, or an event's photos in order and its texts) without opening the keyboard. Not kept across restarts. | [Creation box provider](../components/creation-box-provider.md) |
| Creation box buttons | Two equal buttons, 10 apart, ≥ 44 tall. Guardar and Crear are primary (active-tab blue), Cancelar is secondary. | [Box button](../components/box-button.md), [Creation box buttons](../decisions/creation-box-buttons.md) |

Tests: `src/__tests__/unit/components/creation-box-test.tsx`, `type-select-test.tsx`, `box-button-test.tsx`, `timeline-back-button-test.tsx`, `event-fields-test.tsx`, `event-photo-grid-test.tsx`, and the journeys in `src/__tests__/e2e/create-text-item-test.tsx`, `create-image-item-test.tsx` and `create-event-item-test.tsx`.
