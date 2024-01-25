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
  ItemID,
  ResolvedBucketItem,
} from '../types'

export function createSortableBuckets<TValue>(
  options: Options<TValue>
): InputInstance<TValue> {
  if (options.debugAll || options.debugInput) {
    console.info('Creating Sortable Buckets Input Instance...')
  }

  if (options.state.matrix.length !== options.state.buckets.length) {
    throw new Error('The matrix and buckets must be the same length')
  }

  const lastBucketIndex = options.state.buckets.length - 1
  const defaultOptions: Omit<ResolvedOptions<TValue>, 'state'> = {
    remainingBucket: lastBucketIndex,
    debugAll: false,
    debugInput: false,
    _onGetDomElement: (_itemId: ItemID): HTMLElement | undefined => {
      return
    },
    _onSetDomElement: (
      _itemID: ItemID,
      _element: HTMLElement | null | undefined
    ): void => {},
    onStateChange: (_updater: Updater<InputState<TValue>>): void => {},
    // Global Filter
    onGlobalFilterChange: (_updater: any): void => {},
  }
  const resolvedOptions: ResolvedOptions<TValue> = {
    ...defaultOptions,
    ...options,
  }

  const state = resolvedOptions.state
  const setState = resolvedOptions.onStateChange

  const cloneBucket = (bucketIndex: number): ItemID[] => {
    const bucketValues = state.matrix[bucketIndex]
    if (bucketValues === undefined) {
      throw new Error(
        '[cloneBucket] bucketIndex does not exist: ' + bucketIndex
      )
    }
    return [...bucketValues]
  }

  const onDragStart = (
    item: ResolvedBucketItem<TValue>,
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
        (_itemId: ItemID, itemIndex: number) => itemIndex !== currentItemIndex
      )
      .map((itemId: ItemID) => {
        return resolvedOptions._onGetDomElement(itemId)
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

  const instance: InputInstance<TValue> = {
    options: resolvedOptions,
    initialState: structuredClone(state),
    isFiltering: (): boolean => {
      return state.globalFilter.length > 0
    },
    reset: function (): void {
      instance.setState(instance.initialState)
    },
    setOptions: function (newOptions: Updater<Options<TValue>>): void {
      throw new Error('Function not implemented.')
    },
    getState: function (): InputState<TValue> {
      return state
    },
    setState,
    getBucket: function (bucketIndex: number): Bucket {
      throw new Error('Function not implemented.')
    },
    getItemFromIndexPair: function ([
      bucketIndex,
      itemIndex,
    ]: BucketItemIndexPair): ResolvedBucketItem<TValue> | undefined {
      const bucketItemIds = state.matrix[bucketIndex]
      if (bucketItemIds === undefined) return undefined
      return instance.getItem(bucketItemIds[itemIndex])
    },
    getItem: function (
      itemId: ItemID | undefined
    ): ResolvedBucketItem<TValue> | undefined {
      return state.items.find(i => i.id === itemId)
    },
    getBuckets: (): BucketElement<TValue>[] => {
      return state.buckets.reduce<BucketElement<TValue>[]>(
        (acc, bucket, bucketIndex) => {
          const values = state.matrix[bucketIndex] ?? []

          acc.push({
            ...bucket,
            id: bucketIndex,
            // ref: (ref: HTMLUListElement | null) => bucketRefs.current[b] = ref,
            showMoveLeft: bucketIndex > 0,
            showMoveRight: bucketIndex < state.buckets.length - 1,
            onDragOver: (e: any /*React.DragEvent<HTMLUListElement>*/) =>
              onDragOver(bucketIndex, e),
            items: values.reduce<BucketItemElement<TValue>[]>(
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
                    resolvedOptions._onGetDomElement(item.id),
                  setDomElement: element =>
                    resolvedOptions._onSetDomElement(item.id, element),

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
                      state.filterResults.findIndex(
                        i => i[0] === bucketIndex && i[1] === itemIndex
                      ),
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
      itemId?: ItemID
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
  }

  return instance
}
