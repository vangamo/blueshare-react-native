# Specs

Summaries of the capabilities that are already specified and implemented. The full requirement and scenario text is in `openspec/specs/<capability>/spec.md`, and that file is the authority when a summary here disagrees with it. app-shell, app-theming and app-platform came from the change `basic-app-layout` (`openspec/changes/archive/2026-11-01-basic-app-layout/`). item-creation, item-storage and timeline-feed came from `add-text-items` (`openspec/changes/archive/2026-11-01-add-text-items/`), which also changed app-shell and app-theming.

* [app-shell](app-shell.md) - The frame around every main screen: header, title field, footer tabs, create button and its per-section action, scrolling and touch targets.
* [app-theming](app-theming.md) - Light and dark palettes, contrast guarantees, live scheme switching, status bar and backgrounds.
* [app-platform](app-platform.md) - Android and iOS in portrait, Expo Go, native splash, and no starter leftovers.
* [item-creation](item-creation.md) - The creation box: choose a type, write a text, Crear, Cancelar, back button and drafts across tabs.
* [item-storage](item-storage.md) - Local SQLite storage: item record, UUIDs, timestamps, soft deletion, text limits, atomic saves and migrations.
* [timeline-feed](timeline-feed.md) - The Timeline: items newest first, the text card and its actions, and the empty, loading and error states.
