# Components

All components are in `src/components/`. Each is a named export that reads its colors from `useTheme()`.

* [App header](app-header.md) - Fixed top bar with the menu button, the title/search field and the avatar.
* [Title search field](title-search-field.md) - Shows "BlueShare" at rest and becomes a search input on focus.
* [Footer tab bar](footer-tab-bar.md) - Custom JS tab bar with the Timeline, Circles and Events tabs.
* [Create button](create-button.md) - Floating round `+` button above the footer. Opens the creation box on Timeline.
* [Placeholder screen](placeholder-screen.md) - Scrollable placeholder body for Circles and Events.
* [Items provider](items-provider.md) - Creates the items module once and shares the timeline store through `useTimeline()`.
* [Creation box provider](creation-box-provider.md) - Creation box state above the tabs (step, draft, `openCount`), read through `useCreationBox()`.
* [Creation box](creation-box.md) - Inline box at the top of the Timeline: choose a type, then write and save a text.
* [Type select](type-select.md) - Field and list for picking Evento, Texto or Imagen.
* [Box button](box-button.md) - Primary and secondary creation box buttons, with a faded disabled state.
* [Timeline feed](timeline-feed.md) - The Timeline section: creation box, text cards newest first, empty, loading and error states.
* [Text item card](text-item-card.md) - A text item with its full text and the (inactive) Editar and Compartir actions.
