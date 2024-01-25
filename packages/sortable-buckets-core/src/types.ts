export type BucketItem<TValue> = {
  title: string
  value: TValue
} & (TValue extends ItemID ? { id?: ItemID } : { id: ItemID })

export type ResolvedBucketItem<TValue> = Omit<BucketItem<TValue>, 'id'> & {
  id: ItemID
}

export type Bucket = {
  title: string
}

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>
export type Updater<T> = T | ((old: T) => T)
export type OnChangeFn<T> = (updaterOrValue: Updater<T>) => void

export type BucketItemIndexPair = readonly [
  bucketIndex: number,
  itemIndex: number,
]

export type ItemID = string | number

export type InputInstance<TValue> = {
  initialState: InputState<TValue>
  onMatrixChange?: (updater: Updater<TValue[][]>) => void
  isFiltering: () => boolean
  reset: () => void
  options: ResolvedOptions<TValue>
  setOptions: (newOptions: Updater<Options<TValue>>) => void
  getState: () => InputState<TValue>
  setState: (updater: Updater<InputState<TValue>>) => void
  getBucket: (bucketIndex: number) => Bucket
  getItemFromIndexPair: (
    indexPair: BucketItemIndexPair
  ) => ResolvedBucketItem<TValue> | undefined
  /**
   * Get the bucket item from a value
   * @param itemValue The value of the bucket item
   * @returns The bucket item
   */
  getItem: (id: ItemID | undefined) => ResolvedBucketItem<TValue> | undefined
  getBuckets: () => BucketElement<TValue>[]
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
    _itemId?: ItemID
  ) => void
}

export type InputState<TValue> = {
  // Core
  matrix: ItemID[][]
  buckets: Bucket[]
  items: ResolvedBucketItem<TValue>[]
  dragging: {
    item: ResolvedBucketItem<TValue>
    indexPair: BucketItemIndexPair
  } | null
  // Filters
  globalFilter: string
  filterFocusIndex: number
  filterResults: BucketItemIndexPair[]
}
export type SimpleInputState<TValue> = PartialKeys<
  Omit<InputState<TValue>, 'items' | 'dragging' | 'filterResults'>,
  'globalFilter' | 'filterFocusIndex'
> & { items: BucketItem<TValue>[] }

export type onStateChange<TValue> = OnChangeFn<InputState<TValue>>
export type Options<TValue> = {
  state: InputState<TValue>
  remainingBucket?: number
  debugAll?: boolean
  debugInput?: boolean
  _onGetDomElement?: (itemId: ItemID) => HTMLElement | undefined
  _onSetDomElement?: (
    itemId: ItemID,
    element: HTMLElement | null | undefined
  ) => void
  // State Function
  onStateChange?: onStateChange<TValue>
  // Global Filter
  onGlobalFilterChange?: OnChangeFn<any>
}

export type ResolvedOptions<TValue> = RequiredKeys<
  Options<TValue>,
  | 'remainingBucket'
  | 'debugAll'
  | 'debugInput'
  | '_onGetDomElement'
  | '_onSetDomElement'
  | 'onStateChange'
  | 'onGlobalFilterChange'
>

export type BucketElement<TValue> = Bucket & {
  id: number
  // ref: (ref: HTMLUListElement | null) => void
  showMoveLeft: boolean
  showMoveRight: boolean
  items: BucketItemElement<TValue>[]
  onDragOver: (e: any /*React.DragEvent<HTMLUListElement>*/) => void
}

export type BucketItemElement<TValue> = BucketItem<TValue> & {
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
