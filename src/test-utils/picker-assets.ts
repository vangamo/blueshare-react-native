import { writeFixturePhoto } from './node-photo-store';

/** What a mocked `launchImageLibraryAsync` returns for `count` real fixture files, in order. */
export function pickedResult(count: number, prefix = 'picked') {
  return {
    canceled: false,
    assets: Array.from({ length: count }, (_, index) => ({
      uri: writeFixturePhoto(`${prefix}-${index + 1}.png`),
      width: 400 + index,
      height: 300,
      mimeType: 'image/png',
    })),
  } as never;
}

/** What a mocked `launchImageLibraryAsync` returns when the user closes the picker. */
export const cancelledPick = { canceled: true, assets: null } as never;
