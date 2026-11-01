import { createContext, useReducer, type Dispatch, type ReactNode } from 'react';

import type { ItemType } from '@/hooks/use-timeline';

/** Where the creation box is. Lives above the tabs, so a tab switch keeps the draft. */
export type CreationState =
  | { step: 'closed' }
  | { step: 'choose'; type: ItemType | null }
  | { step: 'write'; text: string; saving: boolean; failed: boolean };

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
      // Only text items can be created for now: Evento and Imagen do nothing.
      if (box.step !== 'choose' || box.type !== 'text') return state;
      return { ...state, box: { step: 'write', text: '', saving: false, failed: false } };
    case 'setText':
      if (box.step !== 'write') return state;
      return { ...state, box: { ...box, text: action.text, failed: false } };
    case 'saveStarted':
      if (box.step !== 'write') return state;
      return { ...state, box: { ...box, saving: true } };
    case 'saveFailed':
      if (box.step !== 'write') return state;
      return { ...state, box: { ...box, saving: false, failed: true } };
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
