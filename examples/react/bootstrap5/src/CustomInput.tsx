import React from 'react'
import { Form, Button, InputGroup } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons'
import { Bucket, BucketItem } from 'sortable-buckets-core'
import { useSortableBuckets } from 'sortable-buckets-react'
import { highlightText } from './utils/highlightText'

import './CustomInput.css'

const buckets: Bucket[] = [{ title: 'Active' }, { title: 'Inactive' }]

const items: BucketItem<number>[] = [
  { title: 'a', value: 1 },
  { title: 'b', value: 2 },
  { title: 'c', value: 3 },
  { title: 'd', value: 4 },
  { title: 'e', value: 5 },
  { title: 'f', value: 6 },
  { title: 'g', value: 7 },
  { title: 'h', value: 8 },
  { title: 'i', value: 9 },
  { title: 'j', value: 10 },
  { title: 'k', value: 11 },
  { title: 'l', value: 12 },
  { title: 'm', value: 13 },
  { title: 'n', value: 14 },
  { title: 'o', value: 15 },
  { title: 'p', value: 16 },
  { title: 'q', value: 17 },
  { title: 'r', value: 18 },
]

const defaultMatrix: number[][] = [[1, 2, 3, 4], []]

const MySortableItemBucketInput = () => {
  const input = useSortableBuckets<number>({
    state: {
      matrix: defaultMatrix,
      buckets,
      items,
    },
  })
  const state = input.getState()

  return (
    <div className="orderable-toggler">
      <div className="orderable-toggler-search">
        <Form.Control
          type="text"
          placeholder="Search"
          // onChange={input.onSearchChange}
          // onKeyUp={input.onSearchEnter}
        />
        {input.isFiltering() && (
          <label>
            {state.filterFocusIndex + 1} / {state.filterResults.length}
          </label>
        )}
      </div>
      <div className="orderable-toggler-groups">
        {input.getBuckets().map(bucket => {
          return (
            <div key={bucket.id} className="orderable-toggler-group">
              <h6 className="d-flex justify-content-center text-muted">
                {bucket.title}
              </h6>
              <ul /*ref={bucket.ref}*/ onDragOver={bucket.onDragOver}>
                {bucket.items.map(item => {
                  return (
                    <li
                      key={item.id}
                      className={
                        'orderable-togger-item' +
                        (item.inFilter ? ' orderable-togger-item-found' : '') +
                        (item.isDragging
                          ? ' orderable-toggler-item-dragging'
                          : '') +
                        (item.isFilterFocus
                          ? ' orderable-toggler-item-found-focus'
                          : '')
                      }
                      ref={item.setDomElement}
                      draggable={true}
                      onDragStart={item.onDragStart}
                      onDragEnd={item.onDragEnd}
                    >
                      <InputGroup>
                        {bucket.showMoveLeft && (
                          <Button
                            variant="orderable-toggler-toggler"
                            onClick={item.moveItemToLeftBucket}
                          >
                            <FontAwesomeIcon icon={faCaretLeft} />
                          </Button>
                        )}
                        <div className="orderable-toggler-item-content-2">
                          {(() => {
                            if (input.isFiltering()) {
                              if (item.inFilter) {
                                return highlightText(
                                  item.title,
                                  state.globalFilter
                                )
                              }
                              return item.title
                            }
                            return <b>{item.title}</b>
                          })()}
                        </div>
                        {bucket.showMoveRight && (
                          <Button
                            variant="orderable-toggler-toggler"
                            onClick={item.moveItemToRightBucket}
                          >
                            <FontAwesomeIcon icon={faCaretRight} />
                          </Button>
                        )}
                      </InputGroup>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MySortableItemBucketInput
