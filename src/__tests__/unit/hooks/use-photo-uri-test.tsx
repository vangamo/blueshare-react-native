import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ItemsProvider } from '@/components/items-provider';
import { usePhotoUri } from '@/hooks/use-photo-uri';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';

describe('usePhotoUri', () => {
  test('gives the URI the photo store builds for the file name', async () => {
    const adapters = createAppAdapters();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ItemsProvider adapters={adapters}>{children}</ItemsProvider>
    );
    const { result } = await renderHook(() => usePhotoUri('abc.jpg'), { wrapper });
    expect(result.current).toBe(adapters.photos.uriFor('abc.jpg'));
  });

  test('without a provider it throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => usePhotoUri('a.jpg'))).rejects.toThrow(/inside ItemsProvider/);
  });
});
