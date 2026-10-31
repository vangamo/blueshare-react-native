# src/components: UI components

Before editing or adding a component, read:
- `docs/design-system/theme-module.md`: the required styling pattern (colors from `useTheme()`, inline; layout from tokens in `StyleSheet.create`).
- `docs/development/accessibility.md`: 44-point targets, roles, labels, contrast.
- The component's own page in `docs/components/`, if one exists. It lists its spec and its test file.

Rules:
- Use kebab-case files and named exports. Never hard-code colors or sizes: add tokens instead (`docs/design-system/design-tokens.md`).
- Every change needs tests in `src/__tests__/unit/components/` (`docs/development/testing.md`).
- After a visual change, run the `visual-review` skill.
- Changing specified behavior? Update the OpenSpec change first (`docs/development/openspec-workflow.md`).
