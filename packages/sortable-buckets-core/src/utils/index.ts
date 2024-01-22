import { Bucket, BucketItem } from '../types'

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

  const currentValues = result[index];
  if (currentValues === undefined) {
    throw Error(
      `[addRemainingValues] the remainingBucketIndex provided does not exist\nremainingBucketIndex: ${remainingBucketIndex}\nbuckets.length: ${buckets.length}`
    )
  }

  result[index] = [...currentValues, ...remainingValues]

  return result
}
