# src/items: the items module (hexagonal)

Before changing anything here, read [Items module](../../docs/architecture/items-module.md).

- Dependency rule: `domain/` ← `application/` ← `infrastructure/`. `domain/` imports no React, Expo or SQL. Use cases and the store import only `domain/`. `application/items-module.ts` is the one composition root that wires `infrastructure/` in.
- Expo imports only in `infrastructure/expo-sql-database.ts`, `infrastructure/expo-photo-store.ts` and `infrastructure/app-adapters.ts`. UI code reaches this module only through `ItemsProvider` and the hooks.
- `MIGRATIONS` is append-only: never edit or reorder a step that has shipped. Add a new step instead.
- Editing or deleting an item first archives it in the `*_history` tables, in one transaction (`archive()` in the repository). A new item type needs its own history table and an `archive()` case.
- SQL uses positional `?` parameters only, and features both `node:sqlite` and `expo-sqlite` support.
- Tests run the real SQL on `NodeSqlDatabase` (`src/test-utils/`), never a fake repository. See [Testing](../../docs/development/testing.md).
