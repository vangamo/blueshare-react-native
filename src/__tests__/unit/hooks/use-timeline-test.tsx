import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ItemsProvider } from '@/components/items-provider';
import { useTimeline } from '@/hooks/use-timeline';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';

function wrapper({ children }: { children: ReactNode }) {
  return <ItemsProvider adapters={createAppAdapters()}>{children}</ItemsProvider>;
}

describe('useTimeline', () => {
  test('goes from loading to ready with no items, then shows a created item first', async () => {
    // The in-memory driver answers at once, so record every status that rendered.
    const statuses: string[] = [];
    const { result } = await renderHook(
      () => {
        const timeline = useTimeline();
        statuses.push(timeline.status);
        return timeline;
      },
      { wrapper },
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(statuses[0]).toBe('loading');
    expect(result.current.items).toEqual([]);

    await act(async () => {
      await result.current.createText('Primero');
    });
    await act(async () => {
      await result.current.createText('  Segundo  ');
    });
    expect(result.current.items.map((item) => item.body)).toEqual(['Segundo', 'Primero']);
  });

  test('without a provider it throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useTimeline())).rejects.toThrow(/inside ItemsProvider/);
  });
});
