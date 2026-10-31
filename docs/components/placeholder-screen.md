---
type: Component
title: Placeholder screen
description: The scrollable body that each main section shows until it has real content. It shows the section name and "Coming soon."
tags: [component, screen, placeholder]
resource: ../../src/components/placeholder-screen.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Placeholder screen

`PlaceholderScreen({ title })`. Used by `src/app/index.tsx` ("Timeline"), `circles.tsx` and `events.tsx`.

- A `ScrollView` with `flex: 1` and a `backgroundMain` background, so content scrolls only between the header and the footer.
- Content padding `Spacing.lg` (16), gap `Spacing.sm`.
- Title: the section name, `textMain`, 18-point extrabold.
- Body: "Coming soon.", `textSecondary`, 15 pt.

Replace it per section when that section gets real content. For example, Timeline will get the feed, see [Roadmap](../product/roadmap.md). The e2e navigation test uses the "Coming soon." text to find which section is shown, so update `src/__tests__/e2e/navigation-test.tsx` when you replace it.

Spec: [app-shell](../specs/app-shell.md) (main sections as tabs).
