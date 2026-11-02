# src/constants: design tokens and theme

- `design-system.json` is the **only** place where color values live. `theme.ts` maps it and holds no color literals.
- Before changing either file, read `docs/design-system/design-tokens.md`. For colors, also read `docs/design-system/color-palettes.md`.
- Add every new color role to both `colors` and `colors_dark`. Text, icon and boundary colors also need a contrast pair in `src/__tests__/unit/constants/theme-test.ts`.
- Sizes live in `theme.ts`: `Sizes` (phone and tablet), `Frames` (four layouts) and `Layout` (fixed values). Keep the phone set equal to the old phone portrait look, and read `docs/design-system/layout-sizes.md` first.
- Never edit `sketches/design_system.json`. It is the original mock (`docs/product/design-sources.md`).
- Changing an existing value changes the UI, so run the `visual-review` skill afterwards.
