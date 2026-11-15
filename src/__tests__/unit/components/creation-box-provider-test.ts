import {
  creationBoxReducer,
  initialCreationBoxState,
  type CreationAction,
  type CreationBoxState,
} from '@/components/creation-box-provider';
import type { EventPhotoDraft } from '@/components/event-photo-grid';
import { EVENT_MAX_PHOTOS } from '@/constants/limits';

function run(...actions: CreationAction[]): CreationBoxState {
  return actions.reduce(creationBoxReducer, initialCreationBoxState);
}

const open: CreationAction = { type: 'open' };
const chooseText: CreationAction = { type: 'chooseType', itemType: 'text' };
const confirm: CreationAction = { type: 'confirmType' };

describe('creationBoxReducer', () => {
  test('starts closed', () => {
    expect(initialCreationBoxState).toEqual({ box: { step: 'closed' }, openCount: 0 });
  });

  test('open goes to the choose step with no type', () => {
    expect(run(open).box).toEqual({ step: 'choose', type: null });
  });

  test('chooseType selects a type', () => {
    expect(run(open, { type: 'chooseType', itemType: 'image' }).box).toEqual({
      step: 'choose',
      type: 'image',
    });
  });

  test('confirmType goes to the write step for text and does nothing with no type', () => {
    expect(run(open, chooseText, confirm).box).toEqual({
      step: 'write',
      text: '',
      saving: false,
      failed: false,
    });
    expect(run(open, confirm).box).toEqual({ step: 'choose', type: null });
  });

  test('saveStarted and saveFailed track the save', () => {
    const saving = run(open, chooseText, confirm, { type: 'setText', text: 'Hola' }, { type: 'saveStarted' });
    expect(saving.box).toEqual({ step: 'write', text: 'Hola', saving: true, failed: false });
    expect(creationBoxReducer(saving, { type: 'saveFailed' }).box).toEqual({
      step: 'write',
      text: 'Hola',
      saving: false,
      failed: true,
    });
  });

  test('setText updates the text and clears failed', () => {
    const failed = run(open, chooseText, confirm, { type: 'saveStarted' }, { type: 'saveFailed' });
    expect(creationBoxReducer(failed, { type: 'setText', text: 'Otra' }).box).toEqual({
      step: 'write',
      text: 'Otra',
      saving: false,
      failed: false,
    });
  });

  test.each([
    ['choose', [open]],
    ['choose with a type', [open, chooseText]],
    ['write', [open, chooseText, confirm, { type: 'setText', text: 'Hola' }]],
    ['write while saving', [open, chooseText, confirm, { type: 'saveStarted' }]],
  ] as [string, CreationAction[]][])('close from %s goes back to closed', (_, actions) => {
    expect(run(...actions, { type: 'close' }).box).toEqual({ step: 'closed' });
  });

  test('openCount goes up on each open, and reopening starts empty', () => {
    const state = run(open, chooseText, confirm, { type: 'setText', text: 'Hola' }, { type: 'close' }, open);
    expect(state.openCount).toBe(2);
    expect(state.box).toEqual({ step: 'choose', type: null });
    expect(run(open, open).openCount).toBe(1); // already open: no change
  });

  test('actions for another step change nothing', () => {
    const closed = initialCreationBoxState;
    for (const action of [chooseText, confirm, { type: 'setText', text: 'x' }, { type: 'saveStarted' }, { type: 'saveFailed' }, { type: 'close' }] as CreationAction[]) {
      expect(creationBoxReducer(closed, action)).toBe(closed);
    }
  });
});

describe('creationBoxReducer image step', () => {
  const chooseImage: CreationAction = { type: 'chooseType', itemType: 'image' };
  const photo = { uri: 'file:///cache/a.jpg', width: 400, height: 300, mimeType: 'image/jpeg' };
  const other = { ...photo, uri: 'file:///cache/b.jpg' };
  const emptyImage = {
    step: 'image',
    photo: null,
    altText: '',
    caption: '',
    saving: false,
    error: null,
  };

  test('confirmType with image opens the empty image step', () => {
    expect(run(open, chooseImage, confirm).box).toEqual(emptyImage);
  });

  test('photoPicked replaces the photo and keeps the texts', () => {
    const state = run(
      open,
      chooseImage,
      confirm,
      { type: 'photoPicked', photo },
      { type: 'setAltText', text: 'Playa' },
      { type: 'setCaption', text: 'Verano' },
      { type: 'photoPicked', photo: other },
    );
    expect(state.box).toEqual({ ...emptyImage, photo: other, altText: 'Playa', caption: 'Verano' });
  });

  test('pickerFailed sets the error, and picking or typing clears it', () => {
    const failed = run(open, chooseImage, confirm, { type: 'pickerFailed' });
    expect(failed.box).toMatchObject({ error: 'picker' });
    expect(creationBoxReducer(failed, { type: 'photoPicked', photo }).box).toMatchObject({ error: null });
    expect(creationBoxReducer(failed, { type: 'setCaption', text: 'x' }).box).toMatchObject({ error: null });
  });

  test('saveStarted and saveFailed behave as in the write step', () => {
    const saving = run(open, chooseImage, confirm, { type: 'photoPicked', photo }, { type: 'saveStarted' });
    expect(saving.box).toMatchObject({ saving: true, photo });
    const failed = creationBoxReducer(saving, { type: 'saveFailed' });
    expect(failed.box).toMatchObject({ saving: false, error: 'save', photo });
    expect(creationBoxReducer(failed, { type: 'setAltText', text: 'x' }).box).toMatchObject({ error: null });
  });

  test('close discards the photo and the texts', () => {
    const state = run(open, chooseImage, confirm, { type: 'photoPicked', photo }, { type: 'close' });
    expect(state.box).toEqual({ step: 'closed' });
    expect(creationBoxReducer(state, open).box).toEqual({ step: 'choose', type: null });
  });

  test('image actions are ignored outside the image step', () => {
    const write = run(open, chooseText, confirm);
    for (const action of [
      { type: 'photoPicked', photo },
      { type: 'setAltText', text: 'x' },
      { type: 'setCaption', text: 'x' },
      { type: 'pickerFailed' },
    ] as const) {
      expect(creationBoxReducer(write, action)).toBe(write);
    }
  });
});

describe('creationBoxReducer event step', () => {
  const chooseEvent: CreationAction = { type: 'chooseType', itemType: 'event' };
  const draft = (key: string): EventPhotoDraft => ({
    key,
    kind: 'picked',
    photo: { uri: `file:///cache/${key}.jpg`, width: 400, height: 300, mimeType: 'image/jpeg' },
  });
  const drafts = (...keys: string[]) => keys.map(draft);
  const keysOf = (state: CreationBoxState) =>
    state.box.step === 'event' ? state.box.photos.map((photo) => photo.key) : null;
  const emptyEvent = {
    step: 'event',
    photos: [],
    title: '',
    category: '',
    description: '',
    saving: false,
    error: null,
  };
  const event = (...actions: CreationAction[]) => run(open, chooseEvent, confirm, ...actions);

  test('confirmType with event opens the empty event step', () => {
    expect(event().box).toEqual(emptyEvent);
  });

  test('photosAdded appends in order', () => {
    const state = event(
      { type: 'photosAdded', photos: drafts('a', 'b') },
      { type: 'photosAdded', photos: drafts('c') },
    );
    expect(keysOf(state)).toEqual(['a', 'b', 'c']);
  });

  test('photosAdded keeps only the first photos up to the limit', () => {
    const eight = drafts('1', '2', '3', '4', '5', '6', '7', '8');
    const state = event(
      { type: 'photosAdded', photos: eight },
      { type: 'photosAdded', photos: drafts('9', '10', '11', '12') },
    );
    expect(EVENT_MAX_PHOTOS).toBe(10);
    expect(keysOf(state)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });

  test('photoRemoved keeps the others in order', () => {
    const state = event({ type: 'photosAdded', photos: drafts('a', 'b', 'c') }, { type: 'photoRemoved', key: 'b' });
    expect(keysOf(state)).toEqual(['a', 'c']);
    expect(keysOf(creationBoxReducer(state, { type: 'photoRemoved', key: 'zzz' }))).toEqual(['a', 'c']);
  });

  test('the text actions set their field and clear the error', () => {
    const failed = event({ type: 'pickerFailed' });
    expect(failed.box).toMatchObject({ error: 'picker' });
    const typed = [
      { type: 'setTitle', text: 'Viaje' },
      { type: 'setCategory', text: 'Familia' },
      { type: 'setDescription', text: 'Genial' },
    ] as const;
    for (const action of typed) {
      expect(creationBoxReducer(failed, action).box).toMatchObject({ error: null });
    }
    expect(event(...typed).box).toEqual({
      ...emptyEvent,
      title: 'Viaje',
      category: 'Familia',
      description: 'Genial',
    });
    expect(creationBoxReducer(failed, { type: 'photosAdded', photos: drafts('a') }).box).toMatchObject({
      error: null,
    });
  });

  test('saveStarted and saveFailed behave as in the other steps', () => {
    const saving = event({ type: 'photosAdded', photos: drafts('a') }, { type: 'setTitle', text: 'Viaje' }, { type: 'saveStarted' });
    expect(saving.box).toMatchObject({ saving: true, title: 'Viaje' });
    const failed = creationBoxReducer(saving, { type: 'saveFailed' });
    expect(failed.box).toMatchObject({ saving: false, error: 'save', title: 'Viaje' });
    expect(keysOf(failed)).toEqual(['a']);
    expect(creationBoxReducer(failed, { type: 'setCategory', text: 'x' }).box).toMatchObject({ error: null });
  });

  test('close discards the photos and the fields', () => {
    const state = event({ type: 'photosAdded', photos: drafts('a') }, { type: 'setTitle', text: 'Viaje' }, { type: 'close' });
    expect(state.box).toEqual({ step: 'closed' });
    expect(creationBoxReducer(state, open).box).toEqual({ step: 'choose', type: null });
  });

  test('event actions are ignored outside the event step', () => {
    const image = run(open, { type: 'chooseType', itemType: 'image' }, confirm);
    for (const action of [
      { type: 'photosAdded', photos: drafts('a') },
      { type: 'photoRemoved', key: 'a' },
      { type: 'setTitle', text: 'x' },
      { type: 'setCategory', text: 'x' },
      { type: 'setDescription', text: 'x' },
    ] as const) {
      expect(creationBoxReducer(image, action)).toBe(image);
    }
  });
});
