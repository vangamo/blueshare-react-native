# Log

## 2026-11-01

* **Update** Removed machine-specific details (SDK path, AVD name, how adb is installed, the host OS) from the docs and the `run-on-emulator` skill. The emulator is now found through `ANDROID_HOME`, and the docs describe the required reference device profile (Medium Phone, 1080×2400, density 420) instead of a local AVD name.
* **Update** Moved the step-by-step procedures into the project skills `run-on-emulator`, `visual-review` and `add-main-section` (`.claude/skills/`). `device-testing.md`, `visual-review.md` and the routing page now keep only the context and point to the skills. Added nested `CLAUDE.md` files in `src/app`, `src/components`, `src/constants` and `src/__tests__`, and rewrote the `CLAUDE.md` index as "when you… read…" lines.
* **Initialization** Created the knowledge base from the code, the `basic-app-layout` OpenSpec change and the synced specs in `openspec/specs/`. The basic app layout is implemented (51/51 tasks), and the change is not archived yet.
