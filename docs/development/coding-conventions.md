---
type: Convention
title: Coding conventions
description: File naming, exports, imports, styling, comments and React Compiler rules that all BlueShare code follows.
tags: [conventions, style, typescript, react]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Coding conventions

- **TypeScript strict.** No `any` escapes. Prefer types derived from the source, as `ThemeColors` is derived from the JSON.
- **Files:** kebab-case (`footer-tab-bar.tsx`). Components are **named exports** in PascalCase. Route files in `src/app/` use `export default`. See [Project structure](../architecture/project-structure.md).
- **Imports:** use the `@/` alias for `src/` (`@/components/app-header`) and `@/assets/*`. Order: packages, a blank line, then `@/` imports.
- **Styling:** layout in module-level `StyleSheet.create` using `Spacing`, `Radius`, `FontSize`, `FontWeight` and `Layout`. Colors inline from `useTheme()`. No color literals or magic numbers in components. See [Theme module](../design-system/theme-module.md).
- **React Compiler is on:** no manual `useMemo` or `useCallback` for memoization. Do not set state inside effects (`react-hooks/set-state-in-effect`). Compute derived values during render. See [Title field state without effects](../decisions/title-field-state.md).
- **Interactive elements:** use `Pressable` with an opacity change for press feedback (0.7–0.8), plus `accessibilityRole` and `accessibilityLabel`. See [Accessibility](accessibility.md).
- **Glyphs:** use plain `Text` (`≡`, `+`, emoji). There is no icon library yet.
- **Placeholders:** a control whose feature does not exist yet gets an explicit no-op handler and a short comment saying so.
- **Comments:** short and useful. Explain *why*, for example a platform workaround such as `includeFontPadding: false` or `paddingVertical: 0` on Android. Use a JSDoc line on each exported component.
- **Platform differences:** handle them inline with a comment. No `.web.*` files. Add `.ios.*` or `.android.*` files only when inline handling gets messy.
- **UI copy:** tab and accessibility labels are in English, and the search placeholder is "Buscar..." (an open language question, see [Known limitations](../product/known-limitations.md)).
