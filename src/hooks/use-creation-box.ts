import { use } from 'react';

import { CreationBoxContext, type CreationBoxContextValue } from '@/components/creation-box-provider';

/** The creation box state and its `dispatch`. Must be used inside `CreationBoxProvider`. */
export function useCreationBox(): CreationBoxContextValue {
  const value = use(CreationBoxContext);
  if (!value) throw new Error('useCreationBox must be used inside CreationBoxProvider');
  return value;
}
