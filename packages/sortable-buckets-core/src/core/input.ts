import {
  Bucket,
  BucketElement,
  BucketItemElement,
  Options,
  InputInstance,
  ResolvedInputState,
  Updater,
  ResolvedOptions,
  BucketItemIndexPair,
  ID,
  ResolvedBucketItem,
  BucketItemIDPair,
  ElementCategory,
} from '../types'

/**
 * Creates an instance of sortable buckets.
 *
 * @param options The options for creating sortable buckets.
 * @returns The created instance of sortable buckets.
 *
 * @throws Throws an error if the length of the matrix and buckets in the state are not the same.
 *
 * @example
 * const options = {
 *   state: {
 *     matrix: [[1, 2]],
 *     buckets: [
 *         { id: 1 },
 *         { id: 2 }
 *     ]
 *     items: [
 *         { value: 1, title: 'Item 1' },
 *         { value: 2, title: 'Item 2' }
 *     ]
 *   }
 * };
 * const instance = createSortableBuckets(options);
 */
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
    _onGetDomElement: (
      _category: ElementCategory,
      _id: ID
    ): HTMLElement | undefined => {
      // noop
      return
    },
    _onSetDomElement: (
      _category: ElementCategory,
      _id: ID,
      _element: HTMLElement | null | undefined
    ): void => {}, // noop
    onStateChange: (
      _updater: Updater<ResolvedInputState<TItemValue>>
    ): void => {}, // noop
    // Filter
    onFilterEnter: (_event: KeyboardEvent): void => {}, // noop
    // Global Filter
    onGlobalFilterChange: (_updater: any): void => {}, // noop
  }
  const resolvedOptions: ResolvedOptions<TItemValue> = {
    ...defaultOptions,
    ...options,
  }

  /**
   * Sets the state of the input.
   *
   * @param updater A function or a new state value to update the input state.
   *
   * @example
   * setState(currentState => {
   *  return {
   *   ...currentState,
   *   dragging: {
   *       item: currentState.dragging.item,
   *       indexPair: [newBucketIndex, newItemIndex],
   *   },
   * });
   */
  const setState = (updater: Updater<ResolvedInputState<TItemValue>>): void => {
    instance.options.state =
      typeof updater === 'function'
        ? updater(instance.options.state)
        : instance.options.state
    resolvedOptions.onStateChange(instance.options.state)
  }

  /**
   * Clones the values of a bucket.
   *
   * @param bucketIndex The index of the bucket to clone.
   *
   * @returns An array containing the cloned values of the bucket.
   *
   * @throws Error if the bucketIndex does not exist.
   *
   * @example
   * const bucketValues = cloneBucket(bucketIndex);
   */
  const cloneBucket = (bucketIndex: number): ID[] => {
    const bucketValues = instance.options.state.matrix[bucketIndex]
    if (bucketValues === undefined) {
      throw new Error(
        '[cloneBucket] bucketIndex does not exist: ' + bucketIndex
      )
    }
    return [...bucketValues]
  }

  let interimDragState:
    | {
        matrix: ID[][]
        dragging: {
          itemId: ID
          indexPair: BucketItemIndexPair
          domElement: HTMLElement
          original: {
            parentElement: HTMLElement
            afterElement: HTMLElement | null
          }
        }
      }
    | undefined

  /**
   * Handles the drag start event, setting the dragging state.
   *
   * @param item The item being dragged.
   * @param indexPair The bucket item index pair of the item being dragged.
   *
   * @example
   * onDragStart(item, itemIndexPair);
   */
  const onDragStart = (
    item: ResolvedBucketItem<TItemValue>,
    indexPair: BucketItemIndexPair
  ) => {
    const dragDomElement = resolvedOptions._onGetDomElement('items', item.id)
    if (!dragDomElement) {
      throw new Error('[onDragStart] the drag dom element does not exist')
    }
    const parentElement = <HTMLElement>dragDomElement.parentElement
    const childIndex = [...parentElement.children].findIndex(
      e => e === dragDomElement
    )
    interimDragState = {
      matrix: structuredClone(instance.options.state.matrix),
      dragging: {
        itemId: item.id,
        indexPair,
        domElement: dragDomElement,
        original: {
          parentElement,
          afterElement:
            childIndex + 1 < parentElement.children.length
              ? <HTMLElement>parentElement.children[childIndex + 1]
              : null,
        },
      },
    }
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

  /**
   * Handles the drag end event, clearing the dragging state.
   *
   * @example
   * onDragEnd();
   */
  const onDragEnd = () => {
    console.log('onDragEnd')
    const result = interimDragState
    if (result?.dragging.original.afterElement) {
      result.dragging.original.parentElement.insertBefore(
        result.dragging.domElement,
        result.dragging.original.afterElement
      )
    } else {
      result?.dragging.original.parentElement.appendChild(
        result.dragging.domElement
      )
    }
    interimDragState = undefined
    if (result === undefined) {
      // console.log('onDragEnd: result is undefined')
      setState(currentState => {
        return {
          ...currentState,
          dragging: null,
        }
      })
      return
    }
    console.log('onDragEnd: result', result)
    setState(currentState => {
      return {
        ...currentState,
        matrix: result.matrix,
        dragging: null,
      }
    })
  }

  /**
   * Handles the drag over event, moving the item being dragged to the new bucket.
   * @param newBucketIndex The index of the new bucket.
   * @param event The drag over event (determines the location of the item in the bucket).
   *
   * @example
   * onDragOver(newBucketIndex, event);
   */
  let i = 0
  const onDragOver = (
    newBucketIndex: number,
    newBucketId: ID,
    event: { clientY: number }
  ): void => {
    const interimState = interimDragState
    if (!interimState) return

    const currentBucketItemIds = interimState.matrix[newBucketIndex]
    if (!currentBucketItemIds) {
      throw new Error('[onDragOver] the current bucket does not exist')
    }
    const [currentBucketIndex, currentItemIndex] =
      interimState.dragging.indexPair
    const [afterItemIndex, afterElement] = getDragAfterElement(
      currentBucketItemIds,
      currentItemIndex,
      event.clientY
    )
    console.log(
      'newBucketIndex',
      newBucketIndex,
      'afterItemIndex',
      afterItemIndex,
      'afterElement',
      afterElement?.outerText,
      'matrix',
      JSON.stringify(interimDragState?.matrix),
      'indexPair',
      interimDragState?.dragging.indexPair,
      'itemId',
      interimDragState?.dragging.itemId,
      'y',

      event.clientY,
      currentBucketIndex === newBucketIndex &&
        currentItemIndex === afterItemIndex
        ? 'NO move'
        : 'move'
    )
    if (
      currentBucketIndex === newBucketIndex &&
      currentItemIndex === afterItemIndex
    )
      return
    // i++
    // if (i > 1) {
    //   return
    // }
    const matrix = [...interimState.matrix]
    const currentBucket = matrix[currentBucketIndex]
    if (!currentBucket) {
      throw new Error('[onDragOver] the current bucket does not exist')
    }
    const newBucket = matrix[newBucketIndex]
    if (!newBucket) {
      throw new Error('[onDragOver] the new bucket does not exist')
    }
    // remove from group
    // console.log(
    //   'matrix before remove',
    //   JSON.stringify(matrix),
    //   currentItemIndex
    // )
    currentBucket.splice(currentItemIndex, 1)
    // console.log('matrix after remove', JSON.stringify(matrix))

    let newItemIndex = -1
    if (afterItemIndex === -1) {
      // add to new group
      // console.log('matrix before add', JSON.stringify(matrix))
      newBucket.push(interimState.dragging.itemId)
      // console.log('matrix after add', JSON.stringify(matrix))
      newItemIndex = newBucket.length - 1
    } else {
      // adjust position in group
      // console.log('matrix before insert', JSON.stringify(matrix))
      newBucket.splice(afterItemIndex, 0, interimState.dragging.itemId)
      // console.log('matrix after insert', JSON.stringify(matrix))
      newItemIndex = afterItemIndex
    }
    interimState.dragging.indexPair = [newBucketIndex, newItemIndex]
    interimState.matrix = matrix
    // NEW
    // const currentMatrixBucket =
    //   instance.options.state.matrix[currentBucketIndex]
    // if (!currentMatrixBucket) {
    //   throw new Error('[onDragOver] the current matrix bucket does not exist')
    // }
    // const currentItemDomElement = resolvedOptions._onGetDomElement(
    //   'items',
    //   interimState.dragging.itemId
    // )
    // if (!currentItemDomElement) {
    //   throw new Error(
    //     '[onDragOver] the current item dom element does not exist'
    //   )
    // }
    // const newMatrixBucket = instance.options.state.matrix[newBucketIndex]
    // if (!newMatrixBucket) {
    //   throw new Error('[onDragOver] the new matrix bucket does not exist')
    // }

    const newBucketDomElement = resolvedOptions._onGetDomElement(
      'buckets',
      newBucketId
    )
    if (!newBucketDomElement) {
      throw new Error('[onDragOver] the new bucket dom element does not exist')
    }
    if (afterItemIndex === -1) {
      newBucketDomElement.appendChild(interimState.dragging.domElement)
    } else {
      // const afterItemId = newMatrixBucket[afterElement]
      // if (!afterItemId) {
      //   throw new Error('[onDragOver] the after item does not exist')
      // }
      // const afterItemDomElement = resolvedOptions._onGetDomElement(
      //   'items',
      //   afterItemId
      // )
      // if (!afterItemDomElement) {
      //   throw new Error(
      //     '[onDragOver] the after item dom element does not exist'
      //   )
      // }
      console.log(
        'interimState.dragging.domElement',
        interimState.dragging.domElement.outerText,
        'afterElement',
        afterElement?.outerText
      )
      newBucketDomElement.insertBefore(
        interimState.dragging.domElement,
        afterElement
      )
      // interimState.dragging.domElement.insertAdjacentElement(
      //   'afterend',
      //   <HTMLElement>afterElement // afterItemDomElement will not be null if afterItemIndex !== -1
      // )
    }

    // replace with DOM manipulation rather than setState
    // setState(currentState => {
    //   if (!currentState.dragging) {
    //     return currentState
    //   }
    //   let matrix = [...currentState.matrix]
    //   matrix.splice(newBucketIndex, 1, newBucket)
    //   return {
    //     ...currentState,
    //     matrix,
    //     dragging: {
    //       item: currentState.dragging.item,
    //       indexPair: [newBucketIndex, newItemIndex],
    //     },
    //   }
    // })
  }

  /**
   * Determines the item index to place the dragged item after.
   * @param newBucketIndex The index of the new bucket.
   * @param currentItemIndex The index of the current item.
   * @param y The y position of the mouse.
   * @returns The index of the item to place the dragged item after.
   * @example
   * const afterElement = getDragAfterElement(newBucketIndex, currentItemIndex, y);
   */
  const getDragAfterElement = (
    bucketItemIds: ID[],
    currentItemIndex: number,
    y: number
  ): [itemIndex: number, element: HTMLElement | null] => {
    if (!bucketItemIds) return [-1, null]
    const draggableElements = bucketItemIds
      .filter(
        (_itemId: ID, itemIndex: number) => itemIndex !== currentItemIndex
      )
      .map((itemId: ID) => {
        return resolvedOptions._onGetDomElement('items', itemId)
      })
    console.log(
      'draggableElements',
      JSON.stringify(
        draggableElements.map(e => {
          const box = e?.getBoundingClientRect() ?? { top: 0, height: 0 }
          const t = box.top - box.height / 2
          return [e?.outerText, t, y - t]
        })
      )
    )
    const after = draggableElements.reduce(
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
    )
    return [after.itemIndex, after.element]
  }

  const instance: InputInstance<TItemValue> = {
    options: resolvedOptions,
    initialState: structuredClone(resolvedOptions.state),
    isFiltering: (): boolean => {
      return instance.options.state.globalFilter.length > 0
    },
    reset: function (): void {
      instance.setState(instance.initialState)
    },
    getState: function (): ResolvedInputState<TItemValue> {
      return instance.options.state
    },
    setState,
    getBucket: function (bucketId: ID): Bucket | undefined {
      return instance.options.state.buckets.find(b => b.id === bucketId)
    },
    getItemFromIndexPair: function ([
      bucketIndex,
      itemIndex,
    ]: BucketItemIndexPair): ResolvedBucketItem<TItemValue> | undefined {
      const bucketItemIds = instance.options.state.matrix[bucketIndex]
      if (bucketItemIds === undefined) return undefined
      return instance.getItem(bucketItemIds[itemIndex])
    },
    getItem: function (
      itemId: ID | undefined
    ): ResolvedBucketItem<TItemValue> | undefined {
      return instance.options.state.items.find(i => i.id === itemId)
    },
    getBuckets: (): BucketElement<TItemValue>[] => {
      return instance.options.state.buckets.reduce<BucketElement<TItemValue>[]>(
        (acc, bucket, bucketIndex) => {
          const values = instance.options.state.matrix[bucketIndex] ?? []

          acc.push({
            ...bucket,
            index: bucketIndex,
            getDomElement: () =>
              resolvedOptions._onGetDomElement('buckets', bucket.id),
            setDomElement: element =>
              resolvedOptions._onSetDomElement('buckets', bucket.id, element),
            showMoveLeft: bucketIndex > 0,
            showMoveRight:
              bucketIndex < instance.options.state.buckets.length - 1,
            onDragOver: (event: {
              clientY: number
              preventDefault: () => void
            }) => {
              event.preventDefault()
              onDragOver(bucketIndex, bucket.id, event)
            },
            items: values.reduce<BucketItemElement<TItemValue>[]>(
              (items, itemId, itemIndex) => {
                const item = instance.getItem(itemId)

                if (!item) return items

                const bucketItemIndexPair = [bucketIndex, itemIndex] as const
                const inGlobalFilter =
                  instance.isFiltering() &&
                  item.title !== undefined &&
                  item.title
                    .toLowerCase()
                    .includes(instance.options.state.globalFilter)

                items.push({
                  ...item,
                  index: itemIndex,
                  getDomElement: () =>
                    resolvedOptions._onGetDomElement('items', item.id),
                  setDomElement: element =>
                    resolvedOptions._onSetDomElement('items', item.id, element),

                  isDragging: () =>
                    instance.options.state.dragging?.item.id === item.id,
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
                    instance.options.state.filterFocusIndex ===
                      instance.options.state.filterResults.findIndex(
                        ids => ids[1] === item.id
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
        if (instance.isFiltering()) {
          instance.clearFilters()
        }
        return
      }
      if (search === instance.options.state.globalFilter) return

      const searchValue = search.toLowerCase()
      const result = instance.options.state.buckets.reduce<BucketItemIDPair[]>(
        (acc, bucket, bucketIndex) => {
          const itemIds = instance.options.state.matrix[bucketIndex] ?? []
          const resultInBucket = itemIds
            .filter(itemId => {
              const item = instance.getItem(itemId)
              return item?.title?.toLowerCase().includes(searchValue)
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
        instance.isFiltering() &&
        event.key === 'Enter' &&
        instance.options.state.filterResults.length > 0
      ) {
        // get next result to focus
        const nextFocus =
          instance.options.state.filterFocusIndex + 1 >=
          instance.options.state.filterResults.length
            ? 0
            : instance.options.state.filterFocusIndex + 1
        setState(currentState => {
          return {
            ...currentState,
            filterFocusIndex: nextFocus,
          }
        })

        // scroll to result
        const focusId = instance.options.state.filterResults[nextFocus]
        if (!focusId) return
        const [focusBucketId, focusItemId] = focusId
        const itemElement = resolvedOptions._onGetDomElement(
          'items',
          focusItemId
        )
        if (!itemElement) return
        const bucketElement = resolvedOptions._onGetDomElement(
          'buckets',
          focusBucketId
        )
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
