import React, { useState, useRef } from 'react'
import {
  createSortableBuckets,
  Options,
  ID,
  prepareState,
  ResolvedInputState,
  InputState,
  ElementCategory,
} from 'sortable-buckets-core'

export function useSortableBuckets<TItemValue>(
  options: Omit<Options<TItemValue>, 'state'> & {
    state: InputState<TItemValue>
  }
) {
  const [state, setState] = useState<ResolvedInputState<TItemValue>>(() =>
    prepareState(options.state)
  )
  const elementRef = useRef<{
    items: { [itemId: string]: HTMLElement }
    buckets: { [bucketId: string]: HTMLElement }
  }>({ items: {}, buckets: {} })

  const [inputRef] = useState(() => ({
    current: createSortableBuckets<TItemValue>({
      ...options,
      state,
      // Similarly, we'll maintain both our internal state and any user-provided
      // state.
      _onGetDomElement: (category: ElementCategory, itemId: ID) => {
        return elementRef.current[category][itemId]
      },
      _onSetDomElement: (
        category: ElementCategory,
        itemId: ID,
        element: HTMLElement | null | undefined
      ) => {
        if (!element) return

        elementRef.current[category][itemId] = element
      },
      onStateChange: updater => {
        setState(updater)
        options.onStateChange?.(updater)
      },
    }),
  }))

  return inputRef.current
}
