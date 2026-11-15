import { use } from 'react';

import { ItemsContext } from '@/components/items-provider';

/** A function that gives the URI to show a stored photo, from its relative file name. Inside `ItemsProvider`. */
export function usePhotoUriFor(): (file: string) => string {
  const module = use(ItemsContext);
  if (!module) throw new Error('usePhotoUri must be used inside ItemsProvider');
  const { photos } = module;
  return (file) => photos.uriFor(file);
}

/** The URI to show a stored photo, from its relative file name. Inside `ItemsProvider`. */
export function usePhotoUri(file: string): string {
  return usePhotoUriFor()(file);
}
