# src/profile: the user's own profile (hexagonal)

Before changing anything here, read [Profile module](../../docs/architecture/profile-module.md) and [Items module](../../docs/architecture/items-module.md).

- Dependency rule: `domain/` ← `application/` ← `infrastructure/`, as in `src/items/`. `domain/` imports no React, Expo or SQL.
- This module may import from `items/` only: `domain/image-item.ts` (`StoredPhoto`, `PickedPhoto`, `photoExtension`), `domain/ports.ts` (`Clock`, `IdGenerator`, `PhotoStore`), `application/import-photos.ts` and `infrastructure/sql-database.ts` (`SqlDatabase`). **`items/` never imports `profile/`.**
- Expo imports are not allowed here. The adapters come from `items/infrastructure/app-adapters.ts`, through `ItemsProvider`.
- The database file has one schema version, so the `people` tables are step 5 of `MIGRATIONS` in `src/items/infrastructure/migrations.ts`. Never add a second migration list. The shared `prepare` runs the migrations once.
- `updateMe` archives the live row into `people_history` before changing it, in one transaction. Avatar files are never removed, because history points to them.
- SQL uses positional `?` parameters only, and features both `node:sqlite` and `expo-sqlite` support.
- Tests run the real SQL on `NodeSqlDatabase` (`src/test-utils/`) in `src/__tests__/unit/profile/`.
