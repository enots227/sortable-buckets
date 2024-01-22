import React, { useState } from 'react'
import {
  createSortableBuckets as createInput,
  addRemainingValues,
} from 'sortable-buckets-core'
import { Options } from 'sortable-buckets-core/src/types'

export function createSortableBuckets<TValue>(options: Options<TValue>) {
  const [tableRef] = useState(() => ({
    current: createInput<TValue>(options),
  }))

  // By default, manage table state here using the table's initial state
  const [state, setState] = useState(() => tableRef.current.initialState)

  // Compose the default state above with any user state. This will allow the user
  // to only control a subset of the state if desired.
  tableRef.current.setOptions(prev => ({
    ...prev,
    ...options,
    state: {
      ...state,
      ...options.state,
    },
    // Similarly, we'll maintain both our internal state and any user-provided
    // state.
    onStateChange: updater => {
      setState(updater)
      options.onStateChange?.(updater)
    },
  }))

  return tableRef.current
}
