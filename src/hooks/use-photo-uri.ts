import { use } from 'react';

import { ItemsContext } from '@/components/items-provider';

/** The URI to show a stored photo, from its relative file name. Inside `ItemsProvider`. */
export function usePhotoUri(file: string): string {
  const module = use(ItemsContext);
  if (!module) throw new Error('usePhotoUri must be used inside ItemsProvider');
  return module.photos.uriFor(file);
}
