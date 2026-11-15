import { Image } from 'expo-image';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { renderHook } from '@testing-library/react-native';

import { usePickPhotos } from '@/hooks/use-pick-photos';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));

const launch = jest.mocked(launchImageLibraryAsync);

function asset(name: string, overrides: Record<string, unknown> = {}) {
  return { uri: `file:///cache/${name}.jpg`, width: 400, height: 300, mimeType: 'image/jpeg', ...overrides };
}

async function pick(max = 10) {
  const { result } = await renderHook(() => usePickPhotos());
  return result.current(max);
}

describe('usePickPhotos', () => {
  test('asks for several images up to the limit, in tapped order, with no EXIF', async () => {
    launch.mockResolvedValue({ canceled: false, assets: [asset('a')] } as never);

    expect(await pick(7)).toEqual([
      { uri: 'file:///cache/a.jpg', width: 400, height: 300, mimeType: 'image/jpeg' },
    ]);
    expect(launch).toHaveBeenCalledWith({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: 7,
      orderedSelection: true,
      quality: 1,
      exif: false,
    });
  });

  test('a cancelled pick gives an empty list', async () => {
    launch.mockResolvedValue({ canceled: true, assets: null } as never);
    expect(await pick()).toEqual([]);
  });

  test('a zero size is replaced by the decoded size for each asset', async () => {
    launch.mockResolvedValue({
      canceled: false,
      assets: [asset('a', { width: 0, height: 0, mimeType: null }), asset('b'), asset('c', { height: 0 })],
    } as never);
    const loadAsync = jest
      .spyOn(Image, 'loadAsync')
      .mockResolvedValueOnce({ width: 3000, height: 4000 } as never)
      .mockResolvedValueOnce({ width: 50, height: 60 } as never);

    expect(await pick()).toEqual([
      { uri: 'file:///cache/a.jpg', width: 3000, height: 4000, mimeType: null },
      { uri: 'file:///cache/b.jpg', width: 400, height: 300, mimeType: 'image/jpeg' },
      { uri: 'file:///cache/c.jpg', width: 50, height: 60, mimeType: 'image/jpeg' },
    ]);
    expect(loadAsync.mock.calls.map(([uri]) => uri)).toEqual(['file:///cache/a.jpg', 'file:///cache/c.jpg']);
  });

  test('the order is the picker’s', async () => {
    launch.mockResolvedValue({ canceled: false, assets: [asset('c'), asset('a'), asset('b')] } as never);
    expect((await pick()).map((photo) => photo.uri)).toEqual([
      'file:///cache/c.jpg',
      'file:///cache/a.jpg',
      'file:///cache/b.jpg',
    ]);
  });

  test('errors propagate', async () => {
    launch.mockRejectedValue(new Error('No gallery'));
    await expect(pick()).rejects.toThrow('No gallery');
  });
});
