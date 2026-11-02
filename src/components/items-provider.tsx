import { createContext, useState, type ReactNode } from 'react';

import { createItemsModule, type ItemsModule } from '@/items/application/items-module';
import { createAppAdapters, type AppAdapters } from '@/items/infrastructure/app-adapters';

export const ItemsContext = createContext<ItemsModule | null>(null);

type ItemsProviderProps = {
  /** Storage adapters. Defaults to the real ones; tests inject failing drivers here. */
  adapters?: AppAdapters;
  children: ReactNode;
};

/**
 * Creates the items module once per app session and shares it with the hooks
 * (`useTimeline`). Rendered by the root layout around the shell.
 */
export function ItemsProvider({ adapters, children }: ItemsProviderProps) {
  // A lazy initializer, not an effect: the module exists from the first render.
  const [module] = useState(() => createItemsModule(adapters ?? createAppAdapters()));
  return <ItemsContext value={module}>{children}</ItemsContext>;
}
