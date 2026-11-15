import { Image } from 'expo-image';

import type { PickedPhoto } from '@/items/domain/image-item';

/** The fields of a photo picker asset this helper reads. */
type PickerAsset = { uri: string; width: number; height: number; mimeType?: string | null };

/**
 * A picker asset as a `PickedPhoto`. When the picker reports a size of `0` (it can), the
 * real size is read by decoding the file. Shared by `usePickPhoto` and `usePickPhotos`.
 */
export async function toPickedPhoto(asset: PickerAsset): Promise<PickedPhoto> {
  let { width, height } = asset;
  if (!width || !height) {
    const decoded = await Image.loadAsync(asset.uri);
    ({ width, height } = decoded);
  }
  return { uri: asset.uri, width, height, mimeType: asset.mimeType ?? null };
}
