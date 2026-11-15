import { createContext, useState, type ReactNode } from 'react';

import { createItemsModule, type ItemsModule } from '@/items/application/items-module';
import { createAppAdapters, type AppAdapters } from '@/items/infrastructure/app-adapters';
import { migrate } from '@/items/infrastructure/migrations';
import { createProfileModule, type ProfileModule } from '@/profile/application/profile-module';

export const ItemsContext = createContext<ItemsModule | null>(null);
export const ProfileContext = createContext<ProfileModule | null>(null);

type ItemsProviderProps = {
  /** Storage adapters. Defaults to the real ones; tests inject failing drivers here. */
  adapters?: AppAdapters;
  children: ReactNode;
};

/**
 * Creates the items and profile modules once per app session, from one set of adapters
 * (one database, one photo store) and one shared migration, and shares them with the hooks
 * (`useTimeline`, `useProfile`). Rendered by the root layout around the shell.
 */
export function ItemsProvider({ adapters, children }: ItemsProviderProps) {
  // A lazy initializer, not an effect: the modules exist from the first render.
  const [modules] = useState(() => {
    const app = adapters ?? createAppAdapters();
    // One promise, so the two stores never run the migrations twice at the same time.
    let migration: Promise<void> | null = null;
    const prepare = () => (migration ??= migrate(app.db));
    return {
      items: createItemsModule(app, { prepare }),
      profile: createProfileModule({ ...app, prepare }),
    };
  });
  return (
    <ItemsContext value={modules.items}>
      <ProfileContext value={modules.profile}>{children}</ProfileContext>
    </ItemsContext>
  );
}
