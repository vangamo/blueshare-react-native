---
type: Guide
title: Testing
description: Jest with jest-expo and React Native Testing Library. Unit and e2e folders under src/__tests__, shared mocks in src/test-utils, and checks on behavior instead of snapshots.
tags: [testing, jest, rntl]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:30:00Z
---

# Testing

## Setup

- `package.json` `jest`: `preset: "jest-expo"`, `moduleNameMapper` for `^@/assets/(.*)$` (the preset already resolves `@/`), `setupFilesAfterEnv: ["<rootDir>/src/test-utils/jest-setup.ts"]`.
- `tsconfig.json`: `"types": ["jest"]`. Only `src/test-utils/node-sql-database.ts` adds Node types, with `/// <reference types="node" />`.
- **Node ≥ 22.13** (`engines` in `package.json`): the test SQLite driver uses the built-in `node:sqlite`.
- Run `npm test`. It currently runs **26 suites and 189 tests**.

## Layout

- `src/__tests__/unit/{components,constants,hooks,items}/<name>-test.ts(x)`: one module per file. `unit/items/` mirrors `src/items/` (`domain/`, `application/`, `infrastructure/`). A component test may render through `renderRouter` and still counts as a unit test.
- `src/__tests__/e2e/`: journeys through the whole app (`navigation-test.tsx`, `create-text-item-test.tsx`), plus `screenshots/` (the approved device screenshots, see [Visual review](visual-review.md)).
- Helpers live in `src/test-utils/`, **never** inside `__tests__/`, where Jest would run them as tests. **Never** put tests in `src/app/`, where every file is a route.

## Shared mocks (`src/test-utils/jest-setup.ts`)

- `react-native-safe-area-context` uses the library's Jest mock, with fixed insets `TEST_INSETS = { top: 24, bottom: 20, left: 0, right: 0 }` (in `test-values.ts`).
- `@/hooks/use-color-scheme` is mocked. Force a scheme with `setMockColorScheme('dark')`. It resets to `'light'` after each test.
- `@/items/infrastructure/app-adapters` is replaced: `createAppAdapters()` returns a fresh in-memory `NodeSqlDatabase`, `randomUUID` from `node:crypto` and `Date.now`. Every app render starts with an empty database. See [Items module](../architecture/items-module.md).
- `jest.restoreAllMocks()` runs after each test, so `jest.spyOn` spies (Keyboard, BackHandler, `createAppAdapters`) never stack.
- Add any new native-module mock here. Never change app code just to make it testable.

## Storage tests

- Run the real SQL: create `new NodeSqlDatabase()` (`src/test-utils/node-sql-database.ts`), `migrate()` it and pass it to the repository or `createItemsModule`. Never write a fake repository.
- To test failures, wrap it in `FailingSqlDatabase(db, (sql) => ...)` (`src/test-utils/failing-sql-database.ts`), which throws on matching statements, inside or outside transactions.
- Components that read items take an optional `adapters` prop on `ItemsProvider`, so a test can inject a failing database.

## How to write tests

- Use RNTL queries (`getByRole`, `getByLabelText`, `getByText`) and matchers (`toHaveStyle`, `toBeSelected`).
- Routes: `renderRouter('./src/app', { initialUrl })` and `expect(screen).toHavePathname('/events')` from `expo-router/testing-library`.
- Assert spec numbers using `Colors`, `Layout` and `TEST_INSETS`, not literals, so a palette change does not break tests.
- **No snapshot tests** (`toMatchSnapshot`) of screens.
- No `.only` or `.skip` left in the code.

## Coverage map

| File | Covers |
| --- | --- |
| `unit/constants/theme-test.ts` | Same palette keys, WCAG ratios for every pair, `NavigationThemes` mapping |
| `unit/constants/design-system-test.ts` | JSON ↔ `Colors`, `Spacing`, `Radius`, `FontSize` stay in sync. Corrected footer values. |
| `unit/hooks/use-theme-test.tsx` | Palette per scheme, live switching |
| `unit/components/*-test.tsx` | Header, title field, footer tabs, create button (see each [component page](../components/index.md)) |
| `unit/constants/limits-test.ts` | `TEXT_MAX_LENGTH` default |
| `unit/items/domain/text-item-test.ts` | Trimming, blank and too-long text |
| `unit/items/infrastructure/node-sql-database-test.ts` | Test driver: queries, commit, rollback, foreign keys |
| `unit/items/infrastructure/migrations-test.ts` | Fresh install, up to date, extra step, failing step |
| `unit/items/infrastructure/sqlite-item-repository-test.ts` | Newest first with tie-break, soft-deleted rows hidden, all-or-nothing save |
| `unit/items/infrastructure/app-adapters-test.ts` | The Jest swap: working fresh database, UUID v4 |
| `unit/items/application/use-cases-test.ts` | Common item record, rejected text stores nothing, newest first |
| `unit/items/application/timeline-store-test.ts` | loading → ready, error states, `createText` waits and prepends, failed save, stable snapshot |
| `unit/items/application/items-module-test.ts` | Items survive a restart (two modules, one database) |
| `unit/hooks/use-timeline-test.tsx` | `useSyncExternalStore` reading: loading → ready, created items first |
| `unit/components/creation-box-provider-test.ts` | Every reducer transition and `openCount` |
| `unit/components/{box-button,type-select,creation-box,text-item-card,timeline-feed,timeline-back-button}-test.tsx` | See each [component page](../components/index.md) |
| `e2e/navigation-test.tsx` | Opens on Timeline (the feed, no placeholder). `/circles` and `/events` deep links work. `/explore` shows no starter content. |
| `e2e/create-text-item-test.tsx` | Create a text, Cancelar, a tab switch keeping the draft, Evento doing nothing |

Helpers for Timeline tests: `journey` (`src/test-utils/timeline-journey.ts`) drives the box through the whole app; `CreationBoxHarness` renders the box outside the router; `spyOnBackHandler()` simulates Android back.

Jest cannot see real rendering (shadows, device insets, keyboard, focus, fonts). The [visual review](visual-review.md) covers those.
