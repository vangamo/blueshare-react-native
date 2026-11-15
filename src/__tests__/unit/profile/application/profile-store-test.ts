import { createProfileStore } from '@/profile/application/profile-store';
import type { Profile } from '@/profile/domain/profile';

const profile: Profile = { id: 'me', name: null, avatar: null, createdAt: 1, updatedAt: 1 };

function setup(overrides: Partial<Parameters<typeof createProfileStore>[0]> = {}) {
  const order: string[] = [];
  const deps = {
    prepare: jest.fn(async () => {
      order.push('prepare');
    }),
    loadProfile: jest.fn(async () => {
      order.push('load');
      return profile;
    }),
    updateProfile: jest.fn(async (current: Profile, input: { name: string }) =>
      input.name === current.name ? current : { ...current, name: input.name, updatedAt: 2 },
    ),
    ...overrides,
  };
  return { store: createProfileStore(deps), deps, order };
}

const ready = async (store: ReturnType<typeof createProfileStore>) => {
  const unsubscribe = store.subscribe(() => {});
  await store.update({ name: '', avatar: { kind: 'keep' } }).catch(() => undefined);
  return unsubscribe;
};

describe('createProfileStore', () => {
  test('starts loading, then is ready with the profile; prepare runs before the load', async () => {
    const { store, order } = setup();
    expect(store.getSnapshot()).toEqual({ status: 'loading', profile: null });
    const listener = jest.fn();
    store.subscribe(listener);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(order).toEqual(['prepare', 'load']);
    expect(store.getSnapshot()).toEqual({ status: 'ready', profile });
    expect(listener).toHaveBeenCalled();
  });

  test('a failing load gives the error status', async () => {
    const { store } = setup({ loadProfile: jest.fn(async () => Promise.reject(new Error('x'))) });
    store.subscribe(() => {});
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.getSnapshot()).toEqual({ status: 'error', profile: null });
  });

  test('a failing prepare gives the error status', async () => {
    const { store, deps } = setup({ prepare: jest.fn(async () => Promise.reject(new Error('x'))) });
    store.subscribe(() => {});
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.getSnapshot().status).toBe('error');
    expect(deps.loadProfile).not.toHaveBeenCalled();
  });

  test('update waits for the load and replaces the profile', async () => {
    const { store } = setup();
    const saved = await store.update({ name: 'Ana', avatar: { kind: 'keep' } });
    expect(saved.name).toBe('Ana');
    expect(store.getSnapshot()).toEqual({ status: 'ready', profile: saved });
  });

  test('an unchanged save keeps the snapshot object', async () => {
    const { store } = setup({
      updateProfile: jest.fn(async (current: Profile) => current),
    });
    await store.update({ name: 'x', avatar: { kind: 'keep' } });
    const before = store.getSnapshot();
    await store.update({ name: 'x', avatar: { kind: 'keep' } });
    expect(store.getSnapshot()).toBe(before);
  });

  test('a rejected update leaves the snapshot untouched', async () => {
    const { store } = setup({ updateProfile: jest.fn(async () => Promise.reject(new Error('x'))) });
    await ready(store);
    const before = store.getSnapshot();
    await expect(store.update({ name: 'Ana', avatar: { kind: 'keep' } })).rejects.toThrow('x');
    expect(store.getSnapshot()).toBe(before);
  });

  test('update rejects when the profile could not be loaded', async () => {
    const { store } = setup({ loadProfile: jest.fn(async () => Promise.reject(new Error('x'))) });
    await expect(store.update({ name: 'Ana', avatar: { kind: 'keep' } })).rejects.toThrow();
  });
});
