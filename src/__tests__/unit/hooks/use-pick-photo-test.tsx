import { Image } from 'expo-image';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { renderHook } from '@testing-library/react-native';

import { usePickPhoto } from '@/hooks/use-pick-photo';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));

const launch = jest.mocked(launchImageLibraryAsync);

function asset(overrides: Record<string, unknown> = {}) {
  return { uri: 'file:///cache/a.jpg', width: 400, height: 300, mimeType: 'image/jpeg', ...overrides };
}

async function pick() {
  const { result } = await renderHook(() => usePickPhoto());
  return result.current();
}

describe('usePickPhoto', () => {
  test('asks for one image with no cropping and no EXIF, and returns the asset', async () => {
    launch.mockResolvedValue({ canceled: false, assets: [asset()] } as never);

    expect(await pick()).toEqual({
      uri: 'file:///cache/a.jpg',
      width: 400,
      height: 300,
      mimeType: 'image/jpeg',
    });
    expect(launch).toHaveBeenCalledWith({
      mediaTypes: 'images',
      allowsMultipleSelection: false,
      allowsEditing: false,
      quality: 1,
      exif: false,
    });
  });

  test('a cancelled pick gives null', async () => {
    launch.mockResolvedValue({ canceled: true, assets: null } as never);
    expect(await pick()).toBeNull();
  });

  test('a zero size is replaced by the decoded size', async () => {
    launch.mockResolvedValue({ canceled: false, assets: [asset({ width: 0, height: 0, mimeType: null })] } as never);
    const loadAsync = jest
      .spyOn(Image, 'loadAsync')
      .mockResolvedValue({ width: 3000, height: 4000 } as never);

    expect(await pick()).toEqual({ uri: 'file:///cache/a.jpg', width: 3000, height: 4000, mimeType: null });
    expect(loadAsync).toHaveBeenCalledWith('file:///cache/a.jpg');
  });

  test('a reported size is used without decoding', async () => {
    launch.mockResolvedValue({ canceled: false, assets: [asset()] } as never);
    const loadAsync = jest.spyOn(Image, 'loadAsync');

    await pick();

    expect(loadAsync).not.toHaveBeenCalled();
  });

  test('picker errors propagate', async () => {
    launch.mockRejectedValue(new Error('no gallery'));
    await expect(pick()).rejects.toThrow('no gallery');
  });
});
