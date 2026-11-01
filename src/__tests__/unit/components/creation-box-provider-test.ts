import {
  creationBoxReducer,
  initialCreationBoxState,
  type CreationAction,
  type CreationBoxState,
} from '@/components/creation-box-provider';

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

  test('confirmType goes to the write step only for text', () => {
    expect(run(open, chooseText, confirm).box).toEqual({
      step: 'write',
      text: '',
      saving: false,
      failed: false,
    });
    for (const itemType of ['event', 'image'] as const) {
      expect(run(open, { type: 'chooseType', itemType }, confirm).box).toEqual({
        step: 'choose',
        type: itemType,
      });
    }
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
