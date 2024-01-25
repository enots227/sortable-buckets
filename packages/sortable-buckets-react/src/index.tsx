import React, { useState, useRef } from 'react'
import {
  createSortableBuckets as createInput,
  Options,
  ID,
  prepareState,
  InputState,
  SimpleInputState,
} from 'sortable-buckets-core'

export function useSortableBuckets<TItemValue>(
  options: Omit<Options<TItemValue>, 'state'> & {
    state: SimpleInputState<TItemValue>
  }
) {
  const [state, setState] = useState<InputState<TItemValue>>(() =>
    prepareState(options.state)
  )
  const itemElementRef = useRef<{ [itemId: string]: HTMLElement }>({})
  const bucketElementRef = useRef<{ [bucketId: string]: HTMLElement }>({})
  return createInput<TItemValue>({
    ...options,
    state,
    // Similarly, we'll maintain both our internal state and any user-provided
    // state.
    _onGetDomItemElement: (itemId: ID) => {
      return itemElementRef.current[itemId]
    },
    _onSetDomItemElement: (
      itemId: ID,
      element: HTMLElement | null | undefined
    ) => {
      if (!element) return

      itemElementRef.current[itemId] = element
    },
    _onGetDomBucketElement: (bucketId: ID) => {
      return bucketElementRef.current[bucketId]
    },
    _onSetDomBucketElement: (
      bucketId: ID,
      element: HTMLElement | null | undefined
    ) => {
      if (!element) return

      bucketElementRef.current[bucketId] = element
    },
    onStateChange: updater => {
      setState(updater)
      options.onStateChange?.(updater)
    },
  })
}
