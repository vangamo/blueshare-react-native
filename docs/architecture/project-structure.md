---
type: Reference
title: Project structure
description: Where routes, components, hooks, theme, tests and design references live, and the rules for placing new files.
tags: [structure, folders, conventions]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Project structure

```
src/
├─ app/                      # Expo Router routes ONLY (every file is a screen)
│  ├─ _layout.tsx            # root layout: theme, header, JS tabs, footer, FAB
│  ├─ index.tsx              # Timeline (the start route "/")
│  ├─ circles.tsx            # "/circles"
│  └─ events.tsx             # "/events"
├─ components/               # shell components (named exports, kebab-case files)
│  ├─ app-header.tsx
│  ├─ title-search-field.tsx
│  ├─ footer-tab-bar.tsx
│  ├─ create-button.tsx
│  └─ placeholder-screen.tsx
├─ constants/
│  ├─ design-system.json     # design tokens: light + dark palettes, sizes
│  └─ theme.ts               # maps the JSON to Colors, Spacing, Radius, FontSize, FontWeight; Layout; NavigationThemes
├─ hooks/
│  ├─ use-color-scheme.ts    # re-exports RN useColorScheme (mocked in tests)
│  └─ use-theme.ts           # active palette
├─ test-utils/               # Jest setup and helpers (never under __tests__)
└─ __tests__/
   ├─ unit/{components,constants,hooks}/   # one module per test file
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

Related: [Shell layout](shell-layout.md), [Components](../components/index.md).
