# src/__tests__: Jest tests

Before writing or changing tests, read `docs/development/testing.md`.

- `unit/{components,constants,hooks}/<name>-test.ts(x)` holds one module per file. `e2e/` holds whole-app journeys through `renderRouter('./src/app')`.
- Shared mocks and helpers go in `src/test-utils/`, never in here. Safe-area insets are fixed (`TEST_INSETS`), and `setMockColorScheme('dark')` forces dark mode.
- Assert with `Colors`, `Layout` and `TEST_INSETS`, never literals. No snapshots, `.only` or `.skip`.
- `e2e/screenshots/` holds the **user-approved** device references. Replace them only through the `visual-review` skill, and only after the user approves the new UI.
