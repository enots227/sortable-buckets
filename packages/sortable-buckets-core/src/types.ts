/**
 * Convert specified properties of an object to be optional
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * A value or a function to update the value
 */
export type Updater<T> = T | ((old: T) => T)

/**
 * A function that updates a value from a value or a function to update the value
 */
export type OnChangeFn<T> = (updaterOrValue: Updater<T>) => void

/**
 * A function that updates the state of the input from a value or a function to update the value
 */
export type onStateChange<TItemValue> = OnChangeFn<
  ResolvedInputState<TItemValue>
>

/**
 * A unique ID that can be used to identify a bucket or bucket item
 */
export type ID = string | number

/**
 * The bucket item
 */
export type BucketItem<TItemValue> = {
  value: TItemValue
  title?: string
} & (TItemValue extends ID
  ? { id?: ID } // if the value is of ID type, it is optional as the ID could be derived from the value
  : { id: ID }) // if the value is not of ID type, the ID is required

/**
 * The bucket item where the ID has been derived from the value otherwise an error would have been thrown ensuring the ID is always present
 */
export type ResolvedBucketItem<TItemValue> = Omit<
  BucketItem<TItemValue>,
  'id'
> & {
  /**
   * The unique ID of the bucket item
   */
  id: ID
}

/**
 * The bucket
 */
export type Bucket = {
  id: ID
  title?: string
}

/**
 * Tuple of bucket index and item index corresponding to the matrix
 */
export type BucketItemIndexPair = readonly [
  bucketIndex: number,
  itemIndex: number,
]

/**
 * Tuple of bucket ID and item ID
 */
export type BucketItemIDPair = readonly [bucketId: ID, itemId: ID]

/**
 * The instance of the sortable buckets input
 */
export type InputInstance<TItemValue> = {
  /**
   * The original state of the input when it was first created.
   */
  initialState: ResolvedInputState<TItemValue>
  /**
   * Determines if the global filter is being used.
   * @returns True if the global filter is being used, otherwise false.
   * @example
   * const isFiltering = instance.isFiltering();
   */
  isFiltering: () => boolean
  /**
   * Resets the state of the input to the initial state.
   *
   * @example
   * reset();
   */
  reset: () => void
  /**
   * Get the current options of the input
   * @returns The current options of the input
   * @example
   * const options = instance.options;
   */
  options: ResolvedOptions<TItemValue>
  /**
   * Get the current state of the input
   * @returns The current state of the input
   * @example
   * const state = instance.getState();
   */
  getState: () => ResolvedInputState<TItemValue>
  /**
   * Set the state of the input
   * @param updater The new state or a function to update the state
   * @example
   * instance.setState(currentState => ({ ...currentState, matrix: [[1, 2, 3]] }));
   */
  setState: (updater: Updater<ResolvedInputState<TItemValue>>) => void
  /**
   * Get the bucket from a bucket ID
   * @param bucketId The unique ID of the bucket
   * @returns The bucket
   * @example
   * const bucket = instance.getBucket('bucket-1');
   */
  getBucket: (bucketId: ID) => Bucket | undefined
  /**
   * Get the bucket from a bucket index
   * @param indexPair The index of the bucket and item
   * @returns The bucket item
   * @example
   * const bucket = instance.getBucketFromIndexPair([0, 0]);
   */
  getItemFromIndexPair: (
    indexPair: BucketItemIndexPair
  ) => ResolvedBucketItem<TItemValue> | undefined
  /**
   * Get the bucket item from the ID
   * @param itemId The unique ID of the bucket item
   *
   * @returns The bucket item
   *
   * @example
   * const item = instance.getItem('item-1');
   */
  getItem: (
    itemId: ID | undefined
  ) => ResolvedBucketItem<TItemValue> | undefined
  /**
   * Get an array of all the bucket with headless UI functions
   * @returns The bucket with headless UI functions
   * @example
   * const buckets = instance.getBuckets();
   */
  getBuckets: () => BucketElement<TItemValue>[]
  /**
   * Moves a value from one bucket to another depending on the adjustment value
   * @param bucketItemIndexPair The posiition of the bucket item to move
   * @param adjustBucketIndex The amount to adjust the bucket index by
   * @param _itemValue The value of the item at the bucketItemIndexPair (internal use only - speeds up result by not locating the value using the bucketItemIndexPair against the matrix)
   */
  moveItemToBucket: (
    bucketItemIndexPair: BucketItemIndexPair,
    adjustBucketIndex: number,
    _itemId?: ID
  ) => void
  // Filter
  /**
   * Clears and resets filter state
   * @example
   * clearFilters();
   */
  clearFilters: () => void
  /**
   * Sets the global filter
   * @param search The search text
   * @example
   * instance.setGlobalFilter('test');
   */
  setGlobalFilter: (serach: string) => void
  /**
   * Changes focus to the next item in the filter results
   * @param event - The keyboard event
   * @example
   * instance.focusNextFilterResult(event);
   */
  onFilterEnter: (event: { key: string }) => void
}

/**
 * The resolved state of the sortable buckets input
 */
export type ResolvedInputState<TItemValue> = {
  // Core
  /**
   * A matrix where the first dimension is the buckets and the second dimension is the items in the bucket
   * @example
   * [
   *  [1, 2, 3], // bucket 1
   *  [4, 5, 6], // bucket 2
   *  [7, 8],    // bucket 3
   * ]
   */
  matrix: ID[][]
  /**
   * The buckets
   */
  buckets: Bucket[]
  /**
   * The items
   */
  items: ResolvedBucketItem<TItemValue>[]
  /**
   * The dragging state; null if not dragging
   */
  dragging: {
    /**
     * The bucket item being dragged
     */
    item: ResolvedBucketItem<TItemValue>
    /**
     * The index of the bucket item being dragged
     */
    indexPair: BucketItemIndexPair
  } | null
  // Filters
  /**
   * The global filter text; empty string if not filtering
   */
  globalFilter: string
  /**
   * The index of the filter result that is focused; -1 if no filter result is focused
   */
  filterFocusIndex: number
  /**
   * The filter results; empty array if no filter results
   */
  filterResults: BucketItemIDPair[]
}

/**
 * The state of the sortable buckets input
 */
export type InputState<TItemValue> = PartialKeys<
  Omit<
    ResolvedInputState<TItemValue>,
    | 'items' // allow unresolved items
    | 'dragging' // cannot already be dragging when initialising
    | 'filterResults' // filter results are calculated and not settable
  >,
  'globalFilter' | 'filterFocusIndex' // optional
> & { items: BucketItem<TItemValue>[] } // allow unresolved items

/**
 * The category of the element
 */
export type ElementCategory = 'buckets' | 'items'

export type Options<TItemValue> = {
  /**
   * The state of the input
   */
  state: ResolvedInputState<TItemValue>
  /**
   * If a bucket item is not found in the matrix, it should be added to the bucket at this index. This is informative only and does not affect the state.
   * @see `addRemainingValues` to add the remaining items to a bucket.
   */
  remainingBucket?: number
  /**
   * A function that enables debug logging for all components of sortable buckets
   */
  debugAll?: boolean
  /**
   * A function that enables debug logging for the input component of sortable buckets
   */
  debugInput?: boolean
  /**
   * A function that gets the DOM element for a bucket or item by ID
   * @ignore Internal use only
   * @param category Whether the element is a bucket or item
   * @param id The ID of the bucket or item
   * @returns The DOM element
   * @example
   * const _getDomElement = (category, id) => { ... };
   * createSortableBuckets({ ...options, _getDomElement });
   */
  _onGetDomElement?: (
    category: ElementCategory,
    id: ID
  ) => HTMLElement | undefined
  /**
   * A function that sets the DOM element for a bucket or item by ID
   * @ignore Internal use only
   * @param category - Whether the element is a bucket or item
   * @param id - The ID of the bucket or item
   * @param element - The DOM element
   * @example
   * const _setDomElement = (category, id, element) => { ... };
   * createSortableBuckets({ ...options, _setDomElement });
   */
  _onSetDomElement?: (
    category: ElementCategory,
    id: ID,
    element: HTMLElement | null | undefined
  ) => void
  // State Function
  /**
   * A function that is called when the state changes
   * @param updaterOrValue The new state or a function to update the state
   * @example
   * const onStateChange = (updaterOrValue) => { ... };
   * createSortableBuckets({ ...options, onStateChange });
   */
  onStateChange?: onStateChange<TItemValue>
  // Filter
  /**
   * A function that is called when enter is pressed on the global filter
   * @param event The keyboard event
   * @example
   * const onGlobalFilterChange = (event) => { ... };
   * createSortableBuckets({ ...options, onGlobalFilterChange });
   */
  onFilterEnter?: (event: KeyboardEvent) => void
  // Global Filter
  /**
   * A function that is called when the global filter changes
   * @param updaterOrValue The new state or a function to update the state
   * @example
   * const onGlobalFilterChange = (updaterOrValue) => { ... };
   * createSortableBuckets({ ...options, onGlobalFilterChange });
   */
  onGlobalFilterChange?: OnChangeFn<any>
}

/**
 * The resolved options of the sortable buckets input where undefined values are replaced with default values
 */
export type ResolvedOptions<TItemValue> = Required<Options<TItemValue>>

/**
 * The bucket with headless UI functions
 */
export type BucketElement<TItemValue> = Bucket & {
  /**
   * The index of the bucket within the matrix (first dimension)
   */
  index: number
  /**
   * Get the DOM element for the bucket
   * @returns The DOM element
   * @example
   * const element = bucket.getDomElement();
   */
  getDomElement: () => HTMLElement | undefined
  /**
   * Set the DOM element for the bucket
   * @param element The DOM element
   * @example
   * bucket.setDomElement(element);
   */
  setDomElement: (element: HTMLElement | null) => void
  /**
   * Whether the bucket is the most left bucket (i.e. bucket index is 0)
   */
  showMoveLeft: boolean
  /**
   * Whether the bucket is the most right bucket (i.e. bucket index is the last)
   */
  showMoveRight: boolean
  /**
   * Get an array of all the bucket items with headless UI functions
   */
  items: BucketItemElement<TItemValue>[]
  /**
   * Handle the drag over event
   * @param event The drag over event
   * @throws Error if called when a bucket item is not being dragged
   * @throws Error if new bucket index does not exist in the matrix (should not happen; the new bucket index is handled by library)
   * @example
   * bucket.onDragOver(event);
   */
  onDragOver: (event: { clientY: number; preventDefault: () => void }) => void
}

/**
 * The bucket item with headless UI functions
 */
export type BucketItemElement<TItemValue> = BucketItem<TItemValue> & {
  /**
   * The index of the bucket item within the matrix (second dimension)
   */
  index: number
  /**
   * Get the DOM element for the bucket item
   * @returns The DOM element
   * @example
   * const element = bucketItem.getDomElement();
   */
  getDomElement: () => HTMLElement | undefined
  /**
   * Set the DOM element for the bucket item
   * @param element The DOM element
   * @example
   * bucketItem.setDomElement(element);
   */
  setDomElement: (element: HTMLElement | null) => void
  /**
   * Whether the bucket item is being dragged
   */
  isDragging: () => boolean
  /**
   * Handle the drag start event
   * @param event The drag start event (not used)
   * @example
   * bucketItem.onDragStart(event);
   */
  onDragStart: (event?: any) => void
  /**
   * Handle the drag end event
   * @param event The drag end event (not used)
   * @example
   * bucketItem.onDragEnd(event);
   */
  onDragEnd: (event?: any) => void
  /**
   * Adjust the bucket index of an item
   * @param adjustBucketIndex The amount to adjust the bucket index by
   * @throws Error if item could not be found from the index pair (should not happen; the index pair is handled by library)
   * @example
   * bucketItem.moveItemToBucket(2); // move item to the right by 2 buckets
   */
  moveItemToBucket: (adjustBucketIndex: number) => void
  /**
   * Adjust the bucket index of an item to the left (i.e. -1)
   * @example
   * bucketItem.moveItemToLeftBucket();
   */
  moveItemToLeftBucket: () => void
  /**
   * Adjust the bucket index of an item to the right (i.e. +1)
   * @example
   * bucketItem.moveItemToRightBucket();
   */
  moveItemToRightBucket: () => void
  /**
   * Whether the bucket item is in the filter
   */
  inFilter: boolean
  /**
   * Whether the bucket item is in the global filter
   */
  inGlobalFilter: boolean
  /**
   * Whether the bucket item is focused in the filter
   */
  isFilterFocus: boolean
}
