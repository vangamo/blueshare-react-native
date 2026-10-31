---
type: Guide
title: Testing
description: Jest with jest-expo and React Native Testing Library. Unit and e2e folders under src/__tests__, shared mocks in src/test-utils, and checks on behavior instead of snapshots.
tags: [testing, jest, rntl]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Testing

## Setup

- `package.json` `jest`: `preset: "jest-expo"`, `moduleNameMapper` for `^@/assets/(.*)$` (the preset already resolves `@/`), `setupFilesAfterEnv: ["<rootDir>/src/test-utils/jest-setup.ts"]`.
- `tsconfig.json`: `"types": ["jest"]`.
- Run `npm test`. It currently runs **8 suites and 66 tests**.

## Layout

- `src/__tests__/unit/{components,constants,hooks}/<name>-test.ts(x)`: one module per file. A component test may render through `renderRouter` and still counts as a unit test.
- `src/__tests__/e2e/`: journeys through the whole app (`navigation-test.tsx`), plus `screenshots/` (the approved device screenshots, see [Visual review](visual-review.md)).
- Helpers live in `src/test-utils/`, **never** inside `__tests__/`, where Jest would run them as tests. **Never** put tests in `src/app/`, where every file is a route.

## Shared mocks (`src/test-utils/jest-setup.ts`)

- `react-native-safe-area-context` uses the library's Jest mock, with fixed insets `TEST_INSETS = { top: 24, bottom: 20, left: 0, right: 0 }` (in `test-values.ts`).
- `@/hooks/use-color-scheme` is mocked. Force a scheme with `setMockColorScheme('dark')`. It resets to `'light'` after each test.
- Add any new native-module mock here. Never change app code just to make it testable.

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
| `e2e/navigation-test.tsx` | Opens on Timeline. `/circles` and `/events` deep links work. `/explore` shows no starter content. |

Jest cannot see real rendering (shadows, device insets, keyboard, fonts). The [visual review](visual-review.md) covers those.
