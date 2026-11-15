import { createContext, useReducer, type Dispatch, type ReactNode } from 'react';

import { appendPhotos, type EventPhotoDraft } from '@/components/event-photo-grid';
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
    }
  | {
      step: 'event';
      /** In order. All picked: they are copied on Crear. */
      photos: EventPhotoDraft[];
      title: string;
      category: string;
      description: string;
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
  | { type: 'photosAdded'; photos: EventPhotoDraft[] }
  | { type: 'photoRemoved'; key: string }
  | { type: 'setTitle'; text: string }
  | { type: 'setCategory'; text: string }
  | { type: 'setDescription'; text: string }
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
      if (box.type === 'event') {
        return {
          ...state,
          box: {
            step: 'event',
            photos: [],
            title: '',
            category: '',
            description: '',
            saving: false,
            error: null,
          },
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
    case 'photosAdded':
      if (box.step !== 'event') return state;
      return { ...state, box: { ...box, photos: appendPhotos(box.photos, action.photos), error: null } };
    case 'photoRemoved':
      if (box.step !== 'event') return state;
      return {
        ...state,
        box: { ...box, photos: box.photos.filter((photo) => photo.key !== action.key), error: null },
      };
    case 'setTitle':
      if (box.step !== 'event') return state;
      return { ...state, box: { ...box, title: action.text, error: null } };
    case 'setCategory':
      if (box.step !== 'event') return state;
      return { ...state, box: { ...box, category: action.text, error: null } };
    case 'setDescription':
      if (box.step !== 'event') return state;
      return { ...state, box: { ...box, description: action.text, error: null } };
    case 'pickerFailed':
      if (box.step !== 'image' && box.step !== 'event') return state;
      return { ...state, box: { ...box, error: 'picker' } };
    case 'saveStarted':
      if (box.step === 'write') return { ...state, box: { ...box, saving: true } };
      if (box.step === 'image' || box.step === 'event') return { ...state, box: { ...box, saving: true } };
      return state;
    case 'saveFailed':
      if (box.step === 'write') return { ...state, box: { ...box, saving: false, failed: true } };
      if (box.step === 'image' || box.step === 'event') {
        return { ...state, box: { ...box, saving: false, error: 'save' } };
      }
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
