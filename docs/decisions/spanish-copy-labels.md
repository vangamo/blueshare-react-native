---
type: Decision
title: Spanish copy and labels
description: New visible text is Spanish and each new control's accessibility label equals its visible text, while the existing English shell labels stay.
tags: [decision, accessibility, copy, i18n]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Spanish copy and labels (add-text-items D11)

**Decision:**
- All new visible text is Spanish, from the sketches and the specs.
- Each new control's accessibility label equals its visible text (WCAG 2.5.3, label in name), so voice control works. The type select's label is its heading, "Crear nuevo elemento".
- The existing English labels ("Create", "Menu", "Search") stay. The app-language question stays open in [Known limitations](../product/known-limitations.md).
- The save and load errors are announced with `accessibilityLiveRegion="polite"` on Android and `AccessibilityInfo.announceForAccessibility` on iOS.

See [Accessibility](../development/accessibility.md).
