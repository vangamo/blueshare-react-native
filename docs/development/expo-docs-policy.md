---
type: Guide
title: Expo docs policy
description: Expo ships breaking changes every SDK. Read the version in package.json and the matching versioned docs before touching any Expo, EAS or React Native API.
tags: [expo, docs, policy]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Expo docs policy

Expo ships breaking changes with every SDK release. APIs you remember are likely renamed, moved or removed. Before writing code that touches an Expo, EAS or React Native API:

1. Read the major version of `expo` in `package.json`. It is currently **58**.
2. Fetch the versioned docs: `https://docs.expo.dev/versions/v58.0.0/`.
3. For anything else, fetch `https://docs.expo.dev/llms.txt`, an index of all Expo docs with corrections to common LLM mistakes. Follow its links to the page you need. Never answer from memory.
4. When the docs and the installed types disagree, **the installed package wins**. Check `node_modules/<pkg>`.

## SDK 58 facts already verified in this repo

- `Tabs` lives at `expo-router/js-tabs`. `Tabs` from `expo-router` is deprecated.
- Only screens declared in the layout are shown.
- `BottomTabBarProps` has `emitter` and `navigateToTab`, not `navigation`.
- `ThemeProvider`, `DefaultTheme` and `DarkTheme` come from `expo-router`.
- Headless tabs (`expo-router/ui`) are experimental.
- `expo-status-bar` `style` takes `'auto' | 'inverted' | 'light' | 'dark'`.
- `jest-expo` 58 needs Jest 30. Router tests need RNTL ≥ 14. `react-test-renderer` is deprecated.
- `boxShadow` works on Android and iOS under the New Architecture.

Useful docs: Expo Router `https://docs.expo.dev/router/introduction.md`, EAS `https://docs.expo.dev/eas/index.md`, module list `https://docs.expo.dev/versions/latest/index.md`.
