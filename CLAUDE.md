# BlueShare

BlueShare is an accessible, intergenerational social app that connects older adults with young people. Users share events, short texts and photos with their family and close circles. It is an **Expo / React Native** app for **Android and iOS phones, portrait only, running in Expo Go** (no web). The audience includes seniors, so high contrast and large touch targets are requirements, not extras.

**Current state:** Phase 1 has delivered the app shell: a fixed header (menu, a title that doubles as search, avatar), footer tabs (Timeline, Circles, Events), a floating `+` button, and light and dark themes built from JSON design tokens. The sections show placeholders. The feed is next.

Detailed knowledge lives in [`docs/`](docs/index.md) (Open Knowledge Format, one topic per file). Open only the files the task needs, using the index below.

## Stack

Expo SDK **58** (`expo ~58.0.22`), Expo Router 58 (JS tabs), React Native 0.88.1, React 19.3, strict TypeScript 6, React Compiler and typed routes on, Jest 30 + jest-expo + React Native Testing Library. Package manager: **npm** (use `npx`, not `bunx`).

## Expo has changed: do not trust your training data

Before writing code that touches an Expo, EAS or React Native API:

1. Read the major version of `expo` in `package.json` (currently 58).
2. Fetch the versioned docs: `https://docs.expo.dev/versions/v58.0.0/`.
3. For anything else, fetch `https://docs.expo.dev/llms.txt` and follow its links. Never answer from memory.

When the docs and the installed types disagree, the installed package wins. The SDK 58 facts already verified are listed in [Expo docs policy](docs/development/expo-docs-policy.md).

## Commands

```bash
npx expo install <package>      # ALWAYS use to add packages (never npm install <pkg>)
npx expo start                  # dev server (also regenerates typed routes)
npx expo lint --max-warnings 0  # lint: zero errors AND zero warnings
npx tsc --noEmit                # typecheck
npm test                        # Jest (unit + e2e)
npx expo-doctor                 # diagnose dependency and config issues
npx expo install --check|--fix  # check or fix SDK-compatible versions
npx eas-cli@latest <command>    # EAS build / submit / update (in place of bare `eas`)
```

## Definition of done

A task is finished only when **lint (0 warnings), typecheck and tests pass**, with no new `eslint-disable` and no `.only` or `.skip`. Visual changes are also checked on the Android emulator in light and dark. Details: [Definition of done](docs/development/definition-of-done.md).

## Key rules

- **Routes only in `src/app/`.** Every file there is a screen. Components, hooks and utils go in `src/components/`, `src/hooks/` and `src/constants/`. Import with the `@/` alias.
- **Tabs come from `expo-router/js-tabs`** (the `Tabs` export of `expo-router` is deprecated). Every route needs a `Tabs.Screen` in `src/app/_layout.tsx`. Import `Link`, `router`, `useLocalSearchParams` and `ThemeProvider` from `expo-router`.
- **No hard-coded colors.** Colors live only in `src/constants/design-system.json`. Components read them through `useTheme()` and pass them inline, with layout in `StyleSheet.create` using the `Spacing`, `Radius`, `FontSize`, `FontWeight` and `Layout` tokens. A new color role goes in both `colors` and `colors_dark`.
- **Accessibility:** touch targets ≥ 44×44 pt, `accessibilityRole` and `accessibilityLabel` on every control, WCAG AA contrast in both palettes (tested).
- **React Compiler:** no manual `useMemo` or `useCallback`, and no `setState` inside effects. Compute derived values during render.
- **Expo Go only:** no native modules beyond those bundled in Expo Go. A library with other native code needs a development build (`npx expo run:android|ios` or `eas build --profile development`), so propose a spec change first. Prefer Expo modules, and check the available skills before adding dependencies.
- **Continuous Native Generation:** never create or edit `ios/` or `android/`. Configure native behavior in `app.json` and config plugins.
- **Never edit `sketches/`.** They are design references. The HTML mock wins over `sketches/design_system.json`.
- **Specs first:** features go through OpenSpec (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`). Current specs are in `openspec/specs/`.

## Knowledge index (`docs/`)

**Product**
- [Product overview](docs/product/overview.md): purpose, audience, planned features
- [Roadmap](docs/product/roadmap.md): phases, what is done, what is next
- [Design sources](docs/product/design-sources.md): the `sketches/` files and their precedence
- [Known limitations](docs/product/known-limitations.md): accepted gaps and open questions

**Architecture**
- [Tech stack](docs/architecture/tech-stack.md): versions and experiments
- [Project structure](docs/architecture/project-structure.md): folders and placement rules
- [Shell layout](docs/architecture/shell-layout.md): how `_layout.tsx` composes header, tabs, footer and FAB
- [Routing](docs/architecture/routing.md): JS tabs, typed routes, deep links, adding a section

**Design system**
- [Design tokens](docs/design-system/design-tokens.md): `design-system.json` and how to add a token
- [Theme module](docs/design-system/theme-module.md): `theme.ts` exports, `useTheme()`, the styling pattern
- [Color palettes](docs/design-system/color-palettes.md): light and dark roles, contrast ratios
- [Sizes and typography](docs/design-system/layout-sizes.md): `Layout` and the token scales

**Components**
- [App header](docs/components/app-header.md), [Title search field](docs/components/title-search-field.md), [Footer tab bar](docs/components/footer-tab-bar.md), [Create button](docs/components/create-button.md), [Placeholder screen](docs/components/placeholder-screen.md)

**Decisions**
- [Decisions index](docs/decisions/index.md): JS tabs with a custom tab bar, shell at the root layout, no themed wrappers, tokens in JSON, active tab contrast, splash on first layout, title field state, dependencies, mobile only

**Implemented specs**
- [app-shell](docs/specs/app-shell.md), [app-theming](docs/specs/app-theming.md), [app-platform](docs/specs/app-platform.md)

**Development**
- [Commands](docs/development/commands.md), [Dependencies](docs/development/dependencies.md), [Native config and EAS](docs/development/native-config-and-eas.md)
- [Coding conventions](docs/development/coding-conventions.md), [Accessibility](docs/development/accessibility.md), [Linting](docs/development/linting.md)
- [Testing](docs/development/testing.md), [Device testing](docs/development/device-testing.md), [Visual review](docs/development/visual-review.md)
- [OpenSpec workflow](docs/development/openspec-workflow.md)

When you change code, behavior or decisions, update the matching `docs/` file and add an entry to [`docs/log.md`](docs/log.md).
