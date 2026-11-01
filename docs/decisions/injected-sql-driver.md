---
type: Decision
title: Injected SQL driver
description: The SQL runs on expo-sqlite in the app and on Node's built-in node:sqlite in Jest, behind one SqlDatabase port, so tests run the real SQL.
tags: [decision, testing, sqlite, jest]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Injected SQL driver (add-text-items D4)

**Decision:** migrations and the repository depend on a small `SqlDatabase` port (`exec`, `run`, `getAll`, `getFirst`, `transaction`). The app gets `createExpoSqlDatabase()`; Jest gets `NodeSqlDatabase` (`src/test-utils/`) over `node:sqlite`. Whole-app tests swap `@/items/infrastructure/app-adapters` in `jest-setup.ts`, so each render gets a fresh in-memory database.

**Consequences:**
- SQL uses positional `?` parameters only, and features both bundled SQLite versions support.
- Metro never bundles the Node driver: only `src/test-utils/` and `jest-setup.ts` import it.
- `node-sql-database.ts` uses `/// <reference types="node" />` instead of adding Node types to tsconfig, so `process` and `Buffer` don't leak into app code. `@types/node` is a direct dev dependency.
- Tests need Node 22.13 or later (`engines.node`), the first release with `node:sqlite` unflagged.

**Rejected:**
- `better-sqlite3`: a native addon that can fail to install without a prebuilt binary.
- `sql.js`: WebAssembly, async init, slower, one more dependency.
- Mocking `expo-sqlite`, or an in-memory fake repository: neither runs the real SQL or the migrations.

See [Testing](../development/testing.md) and [Items module](../architecture/items-module.md).
