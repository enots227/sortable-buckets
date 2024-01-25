import React, { useState, useRef } from 'react'
import {
  createSortableBuckets as createInput,
  addRemainingValues,
  Options,
  BucketItemIndexPair,
  onStateChange,
  ItemID,
  prepareState,
  InputState,
  SimpleInputState,
} from 'sortable-buckets-core'

export function useSortableBuckets<TValue>(
  options: Omit<Options<TValue>, 'state'> & { state: SimpleInputState<TValue> }
) {
  const [state, setState] = useState<InputState<TValue>>(() =>
    prepareState(options.state)
  )
  const itemElementRef = useRef<{ [itemValue: string]: HTMLElement }>({})
  return createInput<TValue>({
    ...options,
    state,
    // Similarly, we'll maintain both our internal state and any user-provided
    // state.
    _onGetDomElement: (itemId: ItemID) => {
      return itemElementRef.current[itemId]
    },
    _onSetDomElement: (
      itemId: ItemID,
      element: HTMLElement | null | undefined
    ) => {
      if (!element) return

      itemElementRef.current[itemId] = element
    },
    onStateChange: updater => {
      setState(updater)
      options.onStateChange?.(updater)
    },
  })
}
