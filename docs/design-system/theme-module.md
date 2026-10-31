---
type: Architecture
title: Theme module
description: theme.ts turns the JSON tokens into typed Colors, Spacing, Radius, FontSize, FontWeight and NavigationThemes, and useTheme() returns the active palette.
tags: [theme, hooks, styling, dark-mode]
resource: ../../src/constants/theme.ts
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Theme module

## `src/constants/theme.ts` exports

| Export | Source | Notes |
| --- | --- | --- |
| `Colors.light`, `Colors.dark` | `colors`, `colors_dark` | snake_case → camelCase (`card_bg` → `cardBg`) |
| `ThemeColors`, `ThemeColor` | type of `Colors.light` | `ThemeColor` is a key name |
| `Spacing` | `spacing` | `{ xs 4, sm 8, md 12, lg 16, xl 20, xxl 24 }` |
| `Radius` | `border_radius` | `{ sm 8, md 12, lg 16, xl 18, pill 9999 }` |
| `FontSize` | `typography.sizes` | `{ caption 12, small 14, body 15, bodyLarge 16, titleCard 18, titleTablet 20 }` |
| `FontWeight` | `typography.weights` | `'400' / '600' / '700' / '800'` |
| `Layout` | written in `theme.ts` | shell sizes, see [Sizes and typography](layout-sizes.md) |
| `NavigationThemes.light`, `.dark` | `DefaultTheme`/`DarkTheme` + palette | `primary`, `background`, `card`, `text`, `border`, `notification` |
| `px(value)` | helper | `"12px"` → 12, `"50%"` → 9999. Throws on anything else. |

`theme.ts` holds **no color literals**. A grep for `#hex` or `rgba(` in it must find nothing.

## Hooks

- `useColorScheme()` (`src/hooks/use-color-scheme.ts`) re-exports React Native's hook. Tests mock this module to force a scheme.
- `useTheme()` (`src/hooks/use-theme.ts`) returns `Colors.dark` when the scheme is `'dark'` and `Colors.light` otherwise. It re-renders on a system scheme change, which gives live switching with no restart.

## Styling pattern (required)

```tsx
const theme = useTheme();
<View style={[styles.box, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]} />

const styles = StyleSheet.create({
  box: { padding: Spacing.lg, borderWidth: Layout.borderWidth, borderRadius: Radius.md },
});
```

- Static layout goes in module-level `StyleSheet.create`, which uses `Spacing`, `Radius`, `FontSize` and `Layout`.
- **Colors are always inline**, from `useTheme()`. Never put colors in `StyleSheet.create`, and never hard-code them.
- There is no `useMemo` style factory. React Compiler memoizes.
- Shadows use `boxShadow` with the `primaryShadow` token, for example `` `0 3px 8px ${theme.primaryShadow}` ``.
- There are no `ThemedText` or `ThemedView` wrappers, see [No themed wrappers](../decisions/no-themed-wrappers.md).

Related: [Design tokens](design-tokens.md), [Color palettes](color-palettes.md).
