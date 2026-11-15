import { ItemsProvider } from '@/components/items-provider';
import { ProfileDialog } from '@/components/profile-dialog';
import { useProfile } from '@/hooks/use-profile';
import type { PickedPhoto } from '@/items/domain/image-item';
import type { AppAdapters } from '@/items/infrastructure/app-adapters';
import { migrate } from '@/items/infrastructure/migrations';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { createProfileModule } from '@/profile/application/profile-module';
import { NodePhotoStore } from '@/test-utils/node-photo-store';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

/**
 * Adapters on a database whose own profile already has `name` and, when `avatar` is given,
 * that picked photo (ids are `id-1`, `id-2`, …: the profile is `id-1`, its photo `id-2.<ext>`).
 * `wrap` decorates the database the app under test uses; `db` is the raw one for reading.
 */
export async function profileAdapters({
  name,
  avatar,
  wrap = (db) => db,
}: {
  name?: string;
  avatar?: PickedPhoto;
  wrap?: (db: SqlDatabase) => SqlDatabase;
} = {}): Promise<AppAdapters & { raw: NodeSqlDatabase }> {
  const raw = new NodeSqlDatabase();
  let next = 0;
  let time = 1_700_000_000_000;
  const base = {
    db: raw,
    ids: { newId: () => `id-${++next}` },
    clock: { now: () => time++ },
    photos: new NodePhotoStore(),
  };
  const { store } = createProfileModule({ ...base, prepare: () => migrate(raw) });
  store.subscribe(() => {});
  // Wait for the own profile to be created, then save the seed values.
  while (store.getSnapshot().status === 'loading') await new Promise((resolve) => setTimeout(resolve, 0));
  if (name !== undefined || avatar) {
    await store.update({
      name: name ?? 'Nombre',
      avatar: avatar ? { kind: 'picked', photo: avatar } : { kind: 'keep' },
    });
  }
  return { ...base, db: wrap(raw), raw };
}

/** Renders the dialog once the profile has been read (or failed to load), outside the router. */
function Gate({ onClose }: { onClose: () => void }) {
  const { status } = useProfile();
  return status === 'loading' ? null : <ProfileDialog onClose={onClose} />;
}

export function ProfileDialogHarness({
  adapters,
  onClose = () => {},
}: {
  adapters: AppAdapters;
  onClose?: () => void;
}) {
  return (
    <ItemsProvider adapters={adapters}>
      <Gate onClose={onClose} />
    </ItemsProvider>
  );
}
