import {
  Bucket,
  BucketItem,
  InputState,
  ResolvedBucketItem,
  ResolvedInputState,
} from '../types'

/**
 * Prepares the state
 * * Adding the id to the items if not provided and the value is of type string or number
 * @param state The state provided by the user
 * @returns
 */
export function prepareState<TItemValue>(
  state: InputState<TItemValue>
): ResolvedInputState<TItemValue> {
  const defaultState: Omit<
    ResolvedInputState<TItemValue>,
    'matrix' | 'buckets' | 'items'
  > = {
    draggingItem: null,
    globalFilter: '',
    filterFocusIndex: -1,
    filterResults: [],
  }
  const resolvedState: ResolvedInputState<TItemValue> = {
    ...defaultState,
    ...state,
    items: state.items.map(item => {
      const valueType = typeof item.value
      if (
        item.id === undefined &&
        valueType !== 'string' &&
        valueType !== 'number'
      ) {
        throw new Error(
          'the item provided does not have an id nor is the value of type string or number to be used as the id'
        )
      }
      return <ResolvedBucketItem<TItemValue>>{
        ...item,
        id: item.id ?? item.value,
      }
    }),
    buckets: state.buckets.map(bucket => ({
      ...bucket,
      title: bucket.title ?? bucket.id.toString(),
    })),
  }
  return resolvedState
}

/**
 * Adds the remaining items to a specified bucket, if no bucket specified the last bucket
 * @param options The core input options
 * @throws Error if the remainingBucketIndex provided does not exist
 * @returns The data with the remaining items added to a bucket
 */
export function addRemainingValues<TItemValue>(
  valueMatrix: TItemValue[][],
  buckets: Bucket[],
  items: BucketItem<TItemValue>[],
  remainingBucketIndex?: number
): TItemValue[][] {
  const result = buckets.map((_, b) => valueMatrix[b] ?? [])

  const index = remainingBucketIndex ?? buckets.length - 1
  const remainingValues = items
    .map(itm => itm.value)
    .filter(val => !valueMatrix.some(bucket => bucket.includes(val)))

  const currentValues = result[index]
  if (currentValues === undefined) {
    throw Error(
      `[addRemainingValues] the remainingBucketIndex provided does not exist\nremainingBucketIndex: ${remainingBucketIndex}\nbuckets.length: ${buckets.length}`
    )
  }

  result[index] = [...currentValues, ...remainingValues]

  return result
}
