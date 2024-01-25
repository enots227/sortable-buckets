export type BucketItem<TItemValue> = {
  title: string
  value: TItemValue
} & (TItemValue extends ID ? { id?: ID } : { id: ID })

export type ResolvedBucketItem<TItemValue> = Omit<
  BucketItem<TItemValue>,
  'id'
> & {
  id: ID
}

export type Bucket = {
  id: ID
  title?: string
}

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Updater<T> = T | ((old: T) => T)
export type OnChangeFn<T> = (updaterOrValue: Updater<T>) => void

export type BucketItemIndexPair = readonly [
  bucketIndex: number,
  itemIndex: number,
]

export type BucketItemIDPair = readonly [bucketId: ID, itemId: ID]

export type ID = string | number

export type InputInstance<TItemValue> = {
  initialState: InputState<TItemValue>
  onMatrixChange?: (updater: Updater<TItemValue[][]>) => void
  isFiltering: () => boolean
  reset: () => void
  options: ResolvedOptions<TItemValue>
  setOptions: (newOptions: Updater<Options<TItemValue>>) => void
  getState: () => InputState<TItemValue>
  setState: (updater: Updater<InputState<TItemValue>>) => void
  getBucket: (bucketIndex: number) => Bucket
  getItemFromIndexPair: (
    indexPair: BucketItemIndexPair
  ) => ResolvedBucketItem<TItemValue> | undefined
  /**
   * Get the bucket item from a value
   * @param itemValue The value of the bucket item
   * @returns The bucket item
   */
  getItem: (id: ID | undefined) => ResolvedBucketItem<TItemValue> | undefined
  getBuckets: () => BucketElement<TItemValue>[]
  /**
   * Moves a value from one bucket to another depending on the adjustment value
   * @param bucketItemIndexPair The posiition of the item to move
   * @param index_0 The index of the bucket
   * @param index_1 The index of the item in the bucket
   * @param adjustBucketIndex The amount to adjust the bucket index by
   * @param _itemValue The value of the item at the bucketItemIndexPair (internal use only - speeds up result by not locating the value using the bucketItemIndexPair against the matrix)
   */
  moveItemToBucket: (
    bucketItemIndexPair: BucketItemIndexPair,
    adjustBucketIndex: number,
    _itemId?: ID
  ) => void
  // Filter
  clearFilters: () => void
  setGlobalFilter: (serach: string) => void
  onFilterEnter: (event: { key: string }) => void
}

export type InputState<TItemValue> = {
  // Core
  matrix: ID[][]
  buckets: Bucket[]
  items: ResolvedBucketItem<TItemValue>[]
  dragging: {
    item: ResolvedBucketItem<TItemValue>
    indexPair: BucketItemIndexPair
  } | null
  // Filters
  globalFilter: string
  filterFocusIndex: number
  filterResults: BucketItemIDPair[]
}
export type SimpleInputState<TItemValue> = PartialKeys<
  Omit<InputState<TItemValue>, 'items' | 'dragging' | 'filterResults'>,
  'globalFilter' | 'filterFocusIndex'
> & { items: BucketItem<TItemValue>[] }

export type onStateChange<TItemValue> = OnChangeFn<InputState<TItemValue>>
export type Options<TItemValue> = {
  state: InputState<TItemValue>
  remainingBucket?: number
  debugAll?: boolean
  debugInput?: boolean
  _onGetDomItemElement?: (itemId: ID) => HTMLElement | undefined
  _onSetDomItemElement?: (
    itemId: ID,
    element: HTMLElement | null | undefined
  ) => void
  _onGetDomBucketElement?: (bucketId: ID) => HTMLElement | undefined
  _onSetDomBucketElement?: (
    bucketId: ID,
    element: HTMLElement | null | undefined
  ) => void
  // State Function
  onStateChange?: onStateChange<TItemValue>
  // Filter
  onFilterEnter?: (event: KeyboardEvent) => void
  // Global Filter
  onGlobalFilterChange?: OnChangeFn<any>
}

export type ResolvedOptions<TItemValue> = Required<Options<TItemValue>>

export type BucketElement<TItemValue> = Bucket & {
  id: number
  getDomElement: () => HTMLElement | undefined
  setDomElement: (element: HTMLElement | null) => void
  showMoveLeft: boolean
  showMoveRight: boolean
  items: BucketItemElement<TItemValue>[]
  onDragOver: (e: any /*React.DragEvent<HTMLUListElement>*/) => void
}

export type BucketItemElement<TItemValue> = BucketItem<TItemValue> & {
  id: number
  getDomElement: () => HTMLElement | undefined
  setDomElement: (element: HTMLElement | null) => void

  isDragging: boolean
  onDragStart: (e: any /*React.DragEvent<HTMLLIElement>*/) => void
  onDragEnd: (e: any /*React.DragEvent<HTMLLIElement>*/) => void

  moveItemToBucket: (adjustBucketIndex: number) => void
  moveItemToLeftBucket: () => void
  moveItemToRightBucket: () => void

  inFilter: boolean
  inGlobalFilter: boolean
  isFilterFocus: boolean
}
