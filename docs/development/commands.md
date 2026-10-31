---
type: Reference
title: Commands
description: npm scripts and Expo CLI commands for starting, linting, typechecking, testing and diagnosing BlueShare. The project uses npm and npx, not bun.
tags: [commands, cli, expo, npm]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Commands

The project uses **npm** (`package-lock.json`), so run tools with `npx`. Use `bunx` only if a `bun.lock` ever appears.

```bash
npm install                     # install dependencies
npx expo start                  # dev server (also regenerates typed routes)
npm run android | npm run ios   # dev server + open on Android / iOS

npx expo lint --max-warnings 0  # lint (mandatory, zero warnings); add --no-cache for a final run
npx tsc --noEmit                # typecheck
npm test                        # Jest, one run
npm run test:watch              # Jest in watch mode

npx expo install <package>      # ALWAYS use to add packages (SDK-compatible versions)
npx expo install --check        # check that versions match the SDK
npx expo install --fix          # fix incompatible versions
npx expo-doctor                 # diagnose dependency and config issues
```

EAS (cloud builds and updates): `npx eas-cli@latest <command>`. See [Native config and EAS](native-config-and-eas.md).

Emulator and adb commands: [Device testing](device-testing.md).
