import { sourceMapsEnabled } from 'process'
import {
  Bucket,
  BucketItem,
  SimpleInputState,
  InputState,
  ResolvedBucketItem,
} from '../types'

export function prepareState<TValue>(
  simpleState: SimpleInputState<TValue>
): InputState<TValue> {
  const defaultState: Omit<
    InputState<TValue>,
    'matrix' | 'buckets' | 'items'
  > = {
    dragging: null,
    globalFilter: '',
    filterFocusIndex: -1,
    filterResults: [],
  }
  const state: InputState<TValue> = {
    ...defaultState,
    ...simpleState,
    items: simpleState.items.map(item => {
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
      return <ResolvedBucketItem<TValue>>{
        ...item,
        id: item.id ?? item.value,
      }
    }),
  }
  return state
}

/**
 * Adds the remaining items to a specified bucket if not specified the last bucket
 * @param options The core input options
 * @returns The data with the remaining items added to a bucket
 */
export function addRemainingValues<TValue>(
  valueMatrix: TValue[][],
  buckets: Bucket[],
  items: BucketItem<TValue>[],
  remainingBucketIndex?: number
): TValue[][] {
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
