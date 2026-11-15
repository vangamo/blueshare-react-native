import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ItemsProvider } from '@/components/items-provider';
import { useTimeline } from '@/hooks/use-timeline';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';
import { bodyOf } from '@/test-utils/item-helpers';
import { writeFixturePhoto } from '@/test-utils/node-photo-store';

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
    expect(result.current.items.map(bodyOf)).toEqual(['Segundo', 'Primero']);
  });

  test('an edit and a deletion are reflected in items', async () => {
    const { result } = await renderHook(() => useTimeline(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => {
      await result.current.createText('Primero');
    });
    await act(async () => {
      await result.current.createText('Segundo');
    });
    const [second, first] = result.current.items;

    await act(async () => {
      await result.current.updateText(first.id, 'Primero editado');
    });
    expect(result.current.items.map(bodyOf)).toEqual(['Segundo', 'Primero editado']);

    await act(async () => {
      await result.current.deleteItem(second.id);
    });
    expect(result.current.items.map(bodyOf)).toEqual(['Primero editado']);
  });

  test('an image is created first and updated in place', async () => {
    const { result } = await renderHook(() => useTimeline(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => {
      await result.current.createText('Texto');
    });
    let id = '';
    await act(async () => {
      const item = await result.current.createImage({
        photo: { uri: writeFixturePhoto(), width: 4, height: 3, mimeType: 'image/png' },
        altText: null,
        caption: 'Verano',
      });
      id = item.id;
    });
    expect(result.current.items.map((item) => item.type)).toEqual(['image', 'text']);

    await act(async () => {
      await result.current.updateImage(id, { newPhoto: null, altText: 'Playa', caption: 'Verano' });
    });
    expect(result.current.items[0]).toMatchObject({ type: 'image', altText: 'Playa' });
  });

  test('an event is created first and updated in place', async () => {
    const { result } = await renderHook(() => useTimeline(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => {
      await result.current.createText('Texto');
    });
    const photo = () => ({ uri: writeFixturePhoto(), width: 4, height: 3, mimeType: 'image/png' });
    let id = '';
    await act(async () => {
      const item = await result.current.createEvent({
        photos: [photo(), photo()],
        title: 'Viaje',
        category: 'Familia',
        description: null,
      });
      id = item.id;
    });
    expect(result.current.items.map((item) => item.type)).toEqual(['event', 'text']);
    const [event] = result.current.items;
    const stored = event.type === 'event' ? event.photos : [];

    await act(async () => {
      await result.current.updateEvent(id, {
        photos: [{ kind: 'stored', photo: stored[1] }],
        title: 'Viaje',
        category: 'Amigos',
        description: null,
      });
    });
    expect(result.current.items[0]).toMatchObject({ type: 'event', category: 'Amigos', photos: [stored[1]] });
    expect(result.current.items[1]).toMatchObject({ type: 'text' });
  });

  test('without a provider it throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useTimeline())).rejects.toThrow(/inside ItemsProvider/);
  });
});
