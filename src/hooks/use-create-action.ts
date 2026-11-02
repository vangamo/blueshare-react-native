import { usePathname } from 'expo-router';

import { useCreationBox } from '@/hooks/use-creation-box';

export type CreateAction = {
  /** `false` means the button is not rendered (and not in the accessibility tree). */
  visible: boolean;
  onPress: () => void;
};

/**
 * What the `+` button does on the current section (design D6):
 * Timeline opens the creation box and hides the button while it is open.
 * Circles (pairing a contact) and Events (creating an event) do nothing yet.
 */
export function useCreateAction(): CreateAction {
  const pathname = usePathname();
  const { box, dispatch } = useCreationBox();

  if (pathname === '/') {
    return { visible: box.step === 'closed', onPress: () => dispatch({ type: 'open' }) };
  }
  // Circles and Events: the button shows, even with a draft pending on Timeline.
  return { visible: true, onPress: () => {} };
}
