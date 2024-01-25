import { sourceMapsEnabled } from 'process'
import {
  Bucket,
  BucketItem,
  SimpleInputState,
  InputState,
  ResolvedBucketItem,
} from '../types'

export function prepareState<TItemValue>(
  simpleState: SimpleInputState<TItemValue>
): InputState<TItemValue> {
  const defaultState: Omit<
    InputState<TItemValue>,
    'matrix' | 'buckets' | 'items'
  > = {
    dragging: null,
    globalFilter: '',
    filterFocusIndex: -1,
    filterResults: [],
  }
  const state: InputState<TItemValue> = {
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
      return <ResolvedBucketItem<TItemValue>>{
        ...item,
        id: item.id ?? item.value,
      }
    }),
    buckets: simpleState.buckets.map(bucket => ({
      ...bucket,
      title: bucket.title ?? <string>bucket.id,
    })),
  }
  return state
}

/**
 * Adds the remaining items to a specified bucket if not specified the last bucket
 * @param options The core input options
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
