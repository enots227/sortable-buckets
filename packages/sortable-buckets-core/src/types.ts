export interface BucketItem<TValue> {
  title: string
  value: TValue
}

export type Bucket = {
  title: string
}

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>
export type Updater<T> = T | ((old: T) => T)
export type OnChangeFn<T> = (updaterOrValue: Updater<T>) => void

export type BucketItemIndexPair = [bucketIndex: number, itemIndex: number]

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
  ) => BucketItem<TValue> | undefined
  /**
   * Get the bucket item from a value
   * @param itemValue The value of the bucket item
   * @returns The bucket item
   */
  getItemFromValue: (
    itemValue: TValue | undefined
  ) => BucketItem<TValue> | undefined
  getBuckets: () => Bucket[]
  /**
   * Moves a value from one bucket to another depending on the adjustment value
   * @param index The posiition of the item to move
   * @param index_0 The index of the bucket
   * @param index_1 The index of the item in the bucket
   * @param bucketAdjustment The amount to adjust the bucket index by
   * @param itemValue The value of the item being moved if not set will be retrieved from the index
   */
  moveItemToBucket: (
    index: BucketItemIndexPair,
    bucketAdjustment: number,
    itemValue?: TValue
  ) => void
}

export type InputState<TValue> = {
  // Core
  matrix: TValue[][]
  buckets: Bucket[]
  items: BucketItem<TValue>[]
  dragging: TValue | null
  // Filters
  globalFilter: string
  filterFocusIndex: number | undefined
  filterResults: BucketItemIndexPair[]
}
export type InitialInputState<TValue> = PartialKeys<
  InputState<TValue>,
  'dragging' | 'globalFilter'
>

export type Options<TValue> = {
  state: InitialInputState<TValue>
  remainingBucket?: number
  debugAll?: boolean
  debugInput?: boolean
  onStateChange?: OnChangeFn<InputState<TValue>>
  // Global Filter
  onGlobalFilterChange?: OnChangeFn<any>
}

export type ResolvedOptions<TValue> = RequiredKeys<
  Options<TValue>,
  'remainingBucket' | 'debugAll' | 'debugInput' | 'onGlobalFilterChange'
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
  // ref: (ref: HTMLLIElement | null) => void

  isDragging: boolean
  onDragStart: (e: any /*React.DragEvent<HTMLLIElement>*/) => void
  onDragEnd: (e: any /*React.DragEvent<HTMLLIElement>*/) => void

  onMove: (adj: number) => void
  onMoveLeft: () => void
  onMoveRight: () => void

  inFilter: boolean
  inGlobalFilter: boolean
  isFilterFocus: boolean
}
