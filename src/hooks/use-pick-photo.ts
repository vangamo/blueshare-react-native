import { Image } from 'expo-image';
import { launchImageLibraryAsync } from 'expo-image-picker';

import type { PickedPhoto } from '@/items/domain/image-item';

/**
 * Opens the system photo picker (images only, one photo, no cropping, no permission
 * prompt) and resolves to the chosen photo, or `null` when the user cancels. Errors
 * from the picker are thrown to the caller, which shows the gallery message.
 *
 * When the picker reports a size of `0` (it can), the real size is read by decoding.
 */
export function usePickPhoto(): () => Promise<PickedPhoto | null> {
  return async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: false,
      allowsEditing: false,
      quality: 1,
      exif: false,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return null;

    let { width, height } = asset;
    if (!width || !height) {
      const decoded = await Image.loadAsync(asset.uri);
      ({ width, height } = decoded);
    }
    return { uri: asset.uri, width, height, mimeType: asset.mimeType ?? null };
  };
}
