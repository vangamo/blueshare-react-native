import { createContext, useReducer, type Dispatch, type ReactNode } from 'react';

import type { PickedPhoto } from '@/items/domain/image-item';
import type { ItemType } from '@/hooks/use-timeline';

/** Where the creation box is. Lives above the tabs, so a tab switch keeps the draft. */
export type CreationState =
  | { step: 'closed' }
  | { step: 'choose'; type: ItemType | null }
  | { step: 'write'; text: string; saving: boolean; failed: boolean }
  | {
      step: 'image';
      /** Chosen in the picker. Still in the picker's cache: it is copied on Crear. */
      photo: PickedPhoto | null;
      altText: string;
      caption: string;
      saving: boolean;
      error: 'save' | 'picker' | null;
    };

export type CreationBoxState = {
  box: CreationState;
  /** Goes up on every open. The feed scrolls to the top when it changes. */
  openCount: number;
};

export type CreationAction =
  | { type: 'open' }
  | { type: 'chooseType'; itemType: ItemType }
  | { type: 'confirmType' }
  | { type: 'setText'; text: string }
  | { type: 'photoPicked'; photo: PickedPhoto }
  | { type: 'setAltText'; text: string }
  | { type: 'setCaption'; text: string }
  | { type: 'pickerFailed' }
  | { type: 'saveStarted' }
  | { type: 'saveFailed' }
  | { type: 'close' };

export const initialCreationBoxState: CreationBoxState = { box: { step: 'closed' }, openCount: 0 };

export function creationBoxReducer(state: CreationBoxState, action: CreationAction): CreationBoxState {
  const { box } = state;
  switch (action.type) {
    case 'open':
      if (box.step !== 'closed') return state;
      return { box: { step: 'choose', type: null }, openCount: state.openCount + 1 };
    case 'chooseType':
      if (box.step !== 'choose') return state;
      return { ...state, box: { step: 'choose', type: action.itemType } };
    case 'confirmType':
      // Evento does nothing yet.
      if (box.step !== 'choose') return state;
      if (box.type === 'text') {
        return { ...state, box: { step: 'write', text: '', saving: false, failed: false } };
      }
      if (box.type === 'image') {
        return {
          ...state,
          box: { step: 'image', photo: null, altText: '', caption: '', saving: false, error: null },
        };
      }
      return state;
    case 'setText':
      if (box.step !== 'write') return state;
      return { ...state, box: { ...box, text: action.text, failed: false } };
    case 'photoPicked':
      if (box.step !== 'image') return state;
      return { ...state, box: { ...box, photo: action.photo, error: null } };
    case 'setAltText':
      if (box.step !== 'image') return state;
      return { ...state, box: { ...box, altText: action.text, error: null } };
    case 'setCaption':
      if (box.step !== 'image') return state;
      return { ...state, box: { ...box, caption: action.text, error: null } };
    case 'pickerFailed':
      if (box.step !== 'image') return state;
      return { ...state, box: { ...box, error: 'picker' } };
    case 'saveStarted':
      if (box.step === 'write') return { ...state, box: { ...box, saving: true } };
      if (box.step === 'image') return { ...state, box: { ...box, saving: true } };
      return state;
    case 'saveFailed':
      if (box.step === 'write') return { ...state, box: { ...box, saving: false, failed: true } };
      if (box.step === 'image') return { ...state, box: { ...box, saving: false, error: 'save' } };
      return state;
    case 'close':
      if (box.step === 'closed') return state;
      return { ...state, box: { step: 'closed' } };
  }
}

export type CreationBoxContextValue = CreationBoxState & {
  dispatch: Dispatch<CreationAction>;
};

export const CreationBoxContext = createContext<CreationBoxContextValue | null>(null);

/** Holds the creation box state for the whole shell (the box, the feed and the `+` button). */
export function CreationBoxProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(creationBoxReducer, initialCreationBoxState);
  return (
    <CreationBoxContext value={{ box: state.box, openCount: state.openCount, dispatch }}>
      {children}
    </CreationBoxContext>
  );
}
