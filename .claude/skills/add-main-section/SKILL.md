---
name: add-main-section
description: Add a new main section (footer tab) to BlueShare, covering the route file, Tabs.Screen, typed routes, tests and docs. Use when asked to add a tab, section or top-level screen next to Timeline, Circles and Events.
---

# Add a main section

Context: `docs/architecture/routing.md` and `docs/architecture/shell-layout.md`. A new tab changes the [app-shell spec](../../../openspec/specs/app-shell/spec.md), which names exactly three sections. **Propose or update an OpenSpec change first** (`/opsx:propose` or `/opsx:update`) unless the user says otherwise.

## Steps

1. **Route:** create `src/app/<name>.tsx` with a default export. Until real content exists, it renders `<PlaceholderScreen title="<Label>" />` from `@/components/placeholder-screen`.
2. **Tab:** add `<Tabs.Screen name="<name>" options={{ title: '<Label>' }} />` in `src/app/_layout.tsx`, in the order the footer should show it. `FooterTabBar` reads `options.title`, so no footer code changes.
3. **Fit:** tabs share the width equally (`flex: 1`, 14-point bold labels). With four or more tabs, check on the emulator that the labels still fit at 411 points wide (`run-on-emulator` skill).
4. **Typed routes:** run `npx expo start` once (background, then stop it), then `npx tsc --noEmit`.
5. **Tests:**
   - `src/__tests__/e2e/navigation-test.tsx`: add the new label to `SECTIONS`, and add a deep-link case.
   - `src/__tests__/unit/components/footer-tab-bar-test.tsx`: update `TAB_NAMES`, and check the new tab's selection and navigation.
6. **Checks:** `npx expo lint --max-warnings 0`, `npx tsc --noEmit`, `npm test`.
7. **Visual:** run the `visual-review` skill. The footer changes, so the references need re-approval.
8. **Docs:** update `docs/architecture/routing.md` (route list), `docs/specs/app-shell.md`, and `docs/product/overview.md` if the feature list changes. Add an entry to `docs/log.md`.
