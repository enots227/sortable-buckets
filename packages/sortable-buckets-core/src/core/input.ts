import {
  Bucket,
  BucketElement,
  BucketItemElement,
  Options,
  InputInstance,
  InputState,
  Updater,
  ResolvedOptions,
  BucketItemIndexPair,
  ID,
  ResolvedBucketItem,
  BucketItemIDPair,
} from '../types'

export function createSortableBuckets<TItemValue>(
  options: Options<TItemValue>
): InputInstance<TItemValue> {
  if (options.debugAll || options.debugInput) {
    console.info('Creating Sortable Buckets Input Instance...')
  }

  if (options.state.matrix.length !== options.state.buckets.length) {
    throw new Error('The matrix and buckets must be the same length')
  }

  const lastBucketIndex = options.state.buckets.length - 1
  const defaultOptions: Omit<ResolvedOptions<TItemValue>, 'state'> = {
    remainingBucket: lastBucketIndex,
    debugAll: false,
    debugInput: false,
    _onGetDomItemElement: (_itemId: ID): HTMLElement | undefined => {
      return
    },
    _onSetDomItemElement: (
      _itemID: ID,
      _element: HTMLElement | null | undefined
    ): void => {},
    _onGetDomBucketElement: (_bucketId: ID): HTMLElement | undefined => {
      return
    },
    _onSetDomBucketElement: (
      _bucketId: ID,
      _element: HTMLElement | null | undefined
    ): void => {},
    onStateChange: (_updater: Updater<InputState<TItemValue>>): void => {},
    // Filter
    onFilterEnter: (_event: KeyboardEvent): void => {},
    // Global Filter
    onGlobalFilterChange: (_updater: any): void => {},
  }
  const resolvedOptions: ResolvedOptions<TItemValue> = {
    ...defaultOptions,
    ...options,
  }

  const state = resolvedOptions.state
  const setState = resolvedOptions.onStateChange

  const cloneBucket = (bucketIndex: number): ID[] => {
    const bucketValues = state.matrix[bucketIndex]
    if (bucketValues === undefined) {
      throw new Error(
        '[cloneBucket] bucketIndex does not exist: ' + bucketIndex
      )
    }
    return [...bucketValues]
  }

  const onDragStart = (
    item: ResolvedBucketItem<TItemValue>,
    indexPair: BucketItemIndexPair
  ) => {
    setState(currentState => {
      return {
        ...currentState,
        dragging: {
          item,
          indexPair,
        },
      }
    })
  }

  const onDragEnd = () => {
    setState(currentState => {
      return {
        ...currentState,
        dragging: null,
      }
    })
  }

  const onDragOver = (
    newBucketIndex: number,
    e: any /* React.DragEvent<HTMLUListElement>*/
  ) => {
    if (!state.dragging) return

    const [currentBucketIndex, currentItemIndex] = state.dragging.indexPair
    const afterElement = getDragAfterElement(
      newBucketIndex,
      currentItemIndex,
      e.clientY
    )
    if (
      currentBucketIndex === newBucketIndex &&
      afterElement === currentItemIndex
    )
      return
    const matrix = [...state.matrix]
    const currentBucket = matrix[currentBucketIndex]
    if (!currentBucket) {
      throw new Error('[onDragOver] the current bucket does not exist')
    }
    const newBucket = matrix[newBucketIndex]
    if (!newBucket) {
      throw new Error('[onDragOver] the new bucket does not exist')
    }
    // remove from group
    currentBucket.splice(currentItemIndex, 1)

    let newItemIndex = -1
    if (afterElement === -1) {
      // add to new group
      newBucket.push(state.dragging.item.id)
      newItemIndex = newBucket.length - 1
    } else {
      // adjust position in group
      newBucket.splice(afterElement, 0, state.dragging.item.id)
      newItemIndex = afterElement
    }
    setState(currentState => {
      if (!currentState.dragging) {
        return currentState
      }
      let matrix = [...currentState.matrix]
      matrix.splice(newBucketIndex, 1, newBucket)
      return {
        ...currentState,
        matrix,
        dragging: {
          item: currentState.dragging.item,
          indexPair: [newBucketIndex, newItemIndex],
        },
      }
    })
  }

  const getDragAfterElement = (
    newBucketIndex: number,
    currentItemIndex: number,
    y: number
  ) => {
    const bucketItems = state.matrix[newBucketIndex]
    if (!bucketItems) return -1
    const draggableElements = bucketItems
      .filter(
        (_itemId: ID, itemIndex: number) => itemIndex !== currentItemIndex
      )
      .map((itemId: ID) => {
        return resolvedOptions._onGetDomItemElement(itemId)
      })
    return draggableElements.reduce(
      (
        closest: {
          offset: number
          element: HTMLElement | null
          itemIndex: number
        },
        child: HTMLElement | undefined,
        itemIndex: number
      ) => {
        if (!child) return closest
        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child, itemIndex }
        } else {
          return closest
        }
      },
      { offset: Number.NEGATIVE_INFINITY, element: null, itemIndex: -1 }
    ).itemIndex
  }

  const isFiltering = (): boolean => {
    return state.globalFilter.length > 0
  }

  const instance: InputInstance<TItemValue> = {
    options: resolvedOptions,
    initialState: structuredClone(state),
    isFiltering,
    reset: function (): void {
      instance.setState(instance.initialState)
    },
    setOptions: function (newOptions: Updater<Options<TItemValue>>): void {
      throw new Error('Function not implemented.')
    },
    getState: function (): InputState<TItemValue> {
      return state
    },
    setState,
    getBucket: function (bucketIndex: number): Bucket {
      throw new Error('Function not implemented.')
    },
    getItemFromIndexPair: function ([
      bucketIndex,
      itemIndex,
    ]: BucketItemIndexPair): ResolvedBucketItem<TItemValue> | undefined {
      const bucketItemIds = state.matrix[bucketIndex]
      if (bucketItemIds === undefined) return undefined
      return instance.getItem(bucketItemIds[itemIndex])
    },
    getItem: function (
      itemId: ID | undefined
    ): ResolvedBucketItem<TItemValue> | undefined {
      return state.items.find(i => i.id === itemId)
    },
    getBuckets: (): BucketElement<TItemValue>[] => {
      return state.buckets.reduce<BucketElement<TItemValue>[]>(
        (acc, bucket, bucketIndex) => {
          const values = state.matrix[bucketIndex] ?? []

          acc.push({
            ...bucket,
            id: bucketIndex,
            getDomElement: () =>
              resolvedOptions._onGetDomBucketElement(bucket.id),
            setDomElement: element =>
              resolvedOptions._onSetDomBucketElement(bucket.id, element),
            showMoveLeft: bucketIndex > 0,
            showMoveRight: bucketIndex < state.buckets.length - 1,
            onDragOver: (e: any /*React.DragEvent<HTMLUListElement>*/) =>
              onDragOver(bucketIndex, e),
            items: values.reduce<BucketItemElement<TItemValue>[]>(
              (items, itemId, itemIndex) => {
                const item = instance.getItem(itemId)

                if (!item) return items

                const bucketItemIndexPair = [bucketIndex, itemIndex] as const
                const inGlobalFilter =
                  instance.isFiltering() &&
                  item.title
                    .toLowerCase()
                    .includes(state.globalFilter.toLowerCase())

                items.push({
                  ...item,

                  id: itemIndex,
                  getDomElement: () =>
                    resolvedOptions._onGetDomItemElement(item.id),
                  setDomElement: element =>
                    resolvedOptions._onSetDomItemElement(item.id, element),

                  isDragging: false, //dragging === val,
                  onDragStart: () => onDragStart(item, bucketItemIndexPair),
                  onDragEnd,

                  moveItemToBucket: (adjustBucketIndex: number) =>
                    instance.moveItemToBucket(
                      bucketItemIndexPair,
                      adjustBucketIndex,
                      item.id
                    ),
                  moveItemToLeftBucket: () =>
                    instance.moveItemToBucket(bucketItemIndexPair, -1, item.id),
                  moveItemToRightBucket: () =>
                    instance.moveItemToBucket(bucketItemIndexPair, 1, item.id),

                  inFilter: inGlobalFilter,
                  inGlobalFilter,
                  isFilterFocus:
                    inGlobalFilter &&
                    state.filterFocusIndex ===
                      state.filterResults.findIndex(ids => ids[1] === item.id),
                })

                return items
              },
              []
            ),
          })

          return acc
        },
        []
      )
    },
    moveItemToBucket: (
      [bucketIndex, itemIndex]: BucketItemIndexPair,
      bucketAdjustment: number,
      itemId?: ID
    ) => {
      const bucketValues = cloneBucket(bucketIndex)

      let id = itemId
      if (!id) {
        const item = instance.getItemFromIndexPair([bucketIndex, itemIndex])
        if (item) {
          id = item.id
        } else {
          throw new Error(
            `[moveItemToBucket] the bucket item index pair provided was not found\nbucketIndex: ${bucketIndex}\nitemIndex: ${itemIndex}`
          )
        }
      } else {
        const indexPairValue = bucketValues[itemIndex]
        if (indexPairValue !== id) {
          console.warn(
            `[moveItemToBucket] the bucket item index pair and the item value provided does not match\nbucketIndex: ${bucketIndex}\nitemIndex: ${itemIndex}\nindexPairValue: ${indexPairValue}\nitemId: ${id}`
          )
        }
      }

      const newBucketIndex = bucketIndex + bucketAdjustment
      const newBucketValues = cloneBucket(newBucketIndex)

      // remove from current group
      bucketValues.splice(itemIndex, 1)

      // add to new group
      if (newBucketValues.length < itemIndex) newBucketValues.push(id)
      else newBucketValues.splice(itemIndex, 0, id)

      setState(currentState => {
        const matrix = [...currentState.matrix]
        matrix.splice(bucketIndex, 1, bucketValues)
        matrix.splice(newBucketIndex, 1, newBucketValues)
        return {
          ...currentState,
          matrix,
        }
      })
    },
    clearFilters: () => {
      setState(currentState => ({
        ...currentState,
        globalFilter: '',
        filterFocusIndex: -1,
        filterResults: [],
      }))
      resolvedOptions.onGlobalFilterChange('')
    },
    setGlobalFilter: (search: string) => {
      if (!search) {
        if (isFiltering()) {
          instance.clearFilters()
        }
        return
      }
      if (search === state.globalFilter) return

      const searchValue = search.toLowerCase()
      const result = state.buckets.reduce<BucketItemIDPair[]>(
        (acc, bucket, bucketIndex) => {
          const itemIds = state.matrix[bucketIndex] ?? []
          const resultInBucket = itemIds
            .filter(itemId => {
              const item = instance.getItem(itemId)
              return item?.title.toLowerCase().includes(searchValue)
            })
            .map(itemId => [bucket.id, itemId] as const)
          if (resultInBucket.length > 0) acc.push(...resultInBucket)
          return acc
        },
        []
      )

      setState(currentState => ({
        ...currentState,
        globalFilter: search,
        filterFocusIndex: -1,
        filterResults: result,
      }))
    },
    onFilterEnter: (event: { key: string }) => {
      if (
        isFiltering() &&
        event.key === 'Enter' &&
        state.filterResults.length > 0
      ) {
        // get next result to focus
        const nextFocus =
          state.filterFocusIndex + 1 >= state.filterResults.length
            ? 0
            : state.filterFocusIndex + 1
        setState(currentState => {
          return {
            ...currentState,
            filterFocusIndex: nextFocus,
          }
        })

        // scroll to result
        const focusId = state.filterResults[nextFocus]
        if (!focusId) return
        const [focusBucketId, focusItemId] = focusId
        const itemElement = resolvedOptions._onGetDomItemElement(focusItemId)
        if (!itemElement) return
        const bucketElement =
          resolvedOptions._onGetDomBucketElement(focusBucketId)
        if (!bucketElement) return
        const gbox = bucketElement.getBoundingClientRect()
        const ibox = itemElement.getBoundingClientRect()
        bucketElement.scrollTop =
          itemElement.offsetTop -
          bucketElement.offsetTop -
          gbox.height / 2 +
          ibox.height / 2
      }
    },
  }

  return instance
}
