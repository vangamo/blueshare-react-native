# Components

All components are in `src/components/`. Each is a named export that reads its colors from `useTheme()`.

* [App header](app-header.md) - Fixed top bar with the menu button, the title/search field and the avatar.
* [Title search field](title-search-field.md) - Shows "BlueShare" at rest and becomes a search input on focus.
* [Tab bar](tab-bar.md) - Custom JS tab bar with the Timeline, Circles and Events tabs, at the bottom in portrait and at the top in landscape.
* [Create button](create-button.md) - Floating round `+` button above the footer. Opens the creation box on Timeline.
* [Placeholder screen](placeholder-screen.md) - Scrollable placeholder body for Circles and Events.
* [Items provider](items-provider.md) - Creates the items module once and shares the timeline store through `useTimeline()`.
* [Creation box provider](creation-box-provider.md) - Creation box state above the tabs (step, draft, `openCount`), read through `useCreationBox()`.
* [Creation box](creation-box.md) - Inline box at the top of the Timeline: choose a type, then create a text, an image or an event.
* [Type select](type-select.md) - Field and list for picking Evento, Texto or Imagen.
* [Box button](box-button.md) - Primary and secondary creation box buttons, with a faded disabled state.
* [Edit text dialog](edit-text-dialog.md) - Dialog over the Timeline to edit or delete a text item, with a deletion confirmation step.
* [Edit image dialog](edit-image-dialog.md) - The same dialog for an image item: photo, Cambiar foto, alternative text and caption.
* [Edit event dialog](edit-event-dialog.md) - The same dialog for an event item: thumbnails, Añadir fotos, title, category with suggestions and description.
* [Timeline feed](timeline-feed.md) - The Timeline section: creation box, text, image and event cards newest first, empty, loading and error states.
* [Text item card](text-item-card.md) - A text item with its full text and the (inactive) Editar and Compartir actions.
* [Photo preview](photo-preview.md) - A photo shown whole on the image backdrop, sized by its proportions and the layout, with a missing-photo message.
* [Event item card](event-item-card.md) - An event item: accent bar, bold title with a category badge, a sideways row of square photo tiles, the description and the actions.
* [Field components](field-components.md) - `BoxTextField` and `FieldLabel`, the single-line field and labeled hint of the image fields.
* [Event fields](event-fields.md) - `EventFields`, `EventPhotoGrid` and `CategorySuggestions`: thumbnails, the multi-select photo button, title, category with suggestions and description.
* [Image item card](image-item-card.md) - An image item: the photo whole on its backdrop, an italic caption, and the Editar and Compartir actions.
