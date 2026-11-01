import { BackHandler } from 'react-native';

type Listener = Parameters<typeof BackHandler.addEventListener>[1];

/**
 * Replaces `BackHandler.addEventListener` (React Native 0.88 ships no Jest mock) and
 * returns `press()`, which runs the live listeners newest first, like the native
 * module, and reports whether one handled the press. `false` means the app would exit.
 */
export function spyOnBackHandler() {
  const listeners: Listener[] = [];
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    listeners.push(handler);
    return {
      remove: () => {
        const index = listeners.indexOf(handler);
        if (index >= 0) listeners.splice(index, 1);
      },
    };
  });
  return {
    listenerCount: () => listeners.length,
    press(): boolean {
      for (const listener of [...listeners].reverse()) {
        if (listener({ type: 'hardwareBackPress', timeStamp: Date.now() })) return true;
      }
      return false;
    },
  };
}
