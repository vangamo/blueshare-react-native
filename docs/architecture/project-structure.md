---
type: Reference
title: Project structure
description: Where routes, components, hooks, theme, tests and design references live, and the rules for placing new files.
tags: [structure, folders, conventions]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:30:00Z
---

# Project structure

```
src/
├─ app/                      # Expo Router routes ONLY (every file is a screen)
│  ├─ _layout.tsx            # root layout: theme, header, JS tabs, footer, FAB
│  ├─ index.tsx              # Timeline (the start route "/"): renders TimelineFeed
│  ├─ circles.tsx            # "/circles"
│  └─ events.tsx             # "/events"
├─ components/               # UI components (named exports, kebab-case files)
│  ├─ app-header.tsx
│  ├─ title-search-field.tsx
│  ├─ footer-tab-bar.tsx
│  ├─ create-button.tsx
│  ├─ placeholder-screen.tsx # Circles and Events
│  ├─ items-provider.tsx     # items module context
│  ├─ creation-box-provider.tsx
│  ├─ timeline-feed.tsx
│  ├─ creation-box.tsx
│  ├─ type-select.tsx
│  ├─ box-button.tsx
│  └─ text-item-card.tsx
├─ items/                    # items module (hexagonal), see items-module.md
│  ├─ domain/                # types, rules, ports: no React, Expo or SQL
│  ├─ application/           # use cases, timeline store, composition root
│  └─ infrastructure/        # SQL port, migrations, repository, expo-sqlite driver, app adapters
├─ constants/
│  ├─ limits.ts              # TEXT_MAX_LENGTH
│  ├─ design-system.json     # design tokens: light + dark palettes, sizes
│  └─ theme.ts               # maps the JSON to Colors, Spacing, Radius, FontSize, FontWeight; Layout; NavigationThemes
├─ hooks/
│  ├─ use-color-scheme.ts    # re-exports RN useColorScheme (mocked in tests)
│  ├─ use-theme.ts           # active palette
│  ├─ use-timeline.ts        # timeline items and status (useSyncExternalStore)
│  ├─ use-creation-box.ts    # creation box state and dispatch
│  └─ use-create-action.ts   # what the + button does per route
├─ test-utils/               # Jest setup and helpers (never under __tests__), incl. the node:sqlite driver
└─ __tests__/
   ├─ unit/{components,constants,hooks,items}/   # one module per test file
   └─ e2e/                                 # whole-app journeys + screenshots/
assets/                      # app icons and splash only
sketches/                    # design references, never edited
openspec/                    # specs and changes (spec-driven workflow)
docs/                        # this knowledge base
```

## Placement rules

- **Only routes in `src/app/`.** A helper there becomes a route. Components, hooks and utils go outside it.
- New UI pieces go in `src/components/<kebab-name>.tsx` with a **named export** (`export function AppHeader`). Route files use `export default`.
- Imports use the `@/` alias for `src/` (`@/components/...`) and `@/assets/*` for `assets/`.
- Tests go in `src/__tests__/unit/<folder>/<name>-test.ts(x)` or `src/__tests__/e2e/`. See [Testing](../development/testing.md).
- There are no `ios/` or `android/` folders. They are generated, see [Native config and EAS](../development/native-config-and-eas.md).
- No `*.web.ts(x)` files and no CSS: web is not a target, see [Mobile only](../decisions/mobile-only.md).

- Domain and storage code goes in a module folder under `src/` (like `src/items/`), not in components or hooks. See [Items module](items-module.md).

Related: [Shell layout](shell-layout.md), [Components](../components/index.md).
