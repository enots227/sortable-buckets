import { Bucket, BucketElement, BucketItem, BucketItemElement, Options, InputInstance, InputState, Updater, OnChangeFn, ResolvedOptions, BucketItemIndexPair } from '../types';

export function createSortableBuckets<TValue>(options: Options<TValue>): InputInstance<TValue> {
    if (options.debugAll || options.debugInput) {
        console.info('Creating Sortable Buckets Input Instance...')
    }

    const lastBucketIndex = options.state.buckets.length - 1;
    const defaultOptions: Omit<ResolvedOptions<TValue>, 'state'> = {
        remainingBucket: lastBucketIndex,
        debugAll: false,
        debugInput: false,
        onStateChange: (_updater: Updater<InputState<TValue>>) => {},
        // Global Filter
        onGlobalFilterChange: (_updater: any): void => {}
    };
    const resolvedOptions: ResolvedOptions<TValue> = {
        ...defaultOptions,
        ...options,
    };

    const defaultState: Omit<InputState<TValue>, 'matrix' | 'buckets' | 'items'> = {
        dragging: null,
        globalFilter: "",
    };
    const state: InputState<TValue> = {
        ...defaultState,
        ...options.state,
    };

    const instance: InputInstance<TValue> = {
        options: resolvedOptions,
        initialState: structuredClone(state),
        isFiltering: (): boolean => {
            return state.globalFilter.length > 0;
        },
        reset: function (): void {
            instance.setState(instance.initialState);
        },
        setOptions: function (newOptions: Updater<Options<TValue>>): void {
            throw new Error('Function not implemented.');
        },
        getState: function (): InputState<TValue> {
            throw new Error('Function not implemented.');
        },
        setState: function (updater: Updater<InputState<TValue>>): void {
            throw new Error('Function not implemented.');
        },
        getBucket: function (bucketIndex: number): Bucket {
            throw new Error('Function not implemented.');
        },
        getItem: function ([bucketIndex, itemIndex]: BucketItemIndexPair): BucketItem<TValue> {
            return state.items[bucketIndex][itemIndex];
        },
        getItemFromValue: function (itemValue: TValue): BucketItem<TValue> | undefined {
            return state.items.find(i => i.value === itemValue);
        },
        getBuckets: (): Bucket[] => {
            return state.buckets.reduce<BucketElement<TValue>[]>((res, bucket, b) => {
                const values = state.matrix[b] ?? []

                res.push({
                    ...bucket,
                    id: b,
                    ref: (ref: HTMLUListElement | null) => bucketRefs.current[b] = ref,
                    showMoveLeft: b > 0,
                    showMoveRight: b < options.buckets.length - 1,
                    onDragOver: (e: React.DragEvent<HTMLUListElement>) => onDragOver(b, e),
                    items: values.reduce<BucketItemElement<TValue>[]>((items, val, v) => {
                        const itm = instance.getItemFromValue(val)

                        if (!itm)
                            return items

                        const inGlobalFilter = instance.isFiltering() && itm.title.toLowerCase().includes(state.globalFilter.toLowerCase())

                        items.push({
                            ...itm,

                            id: v,
                            ref: (ref: HTMLLIElement | null) => {
                                if (ref === null) return

                                if (!itemsRef.current[b])
                                    itemsRef.current[b] = []

                                itemsRef.current[b][v] = ref
                            },

                            isDragging: dragging === val,
                            onDragStart: () => onDragStart(b, v),
                            onDragEnd: () => onDragEnd(),

                            onMove: (adj: number) => instance.adjustItem onMoveGroup(val, v, b, adj),
                            onMoveLeft: () => onMoveGroup(val, v, b, -1),
                            onMoveRight: () => onMoveGroup(val, v, b, 1),

                            inSearch: inSearch,
                            isSearchFocus: inSearch && searchFocus === searchResults.findIndex(res => res[0] === b && res[1] === v),
                        })

                        return items
                    }, [])
                })

                return res
            }, [])
        },
        moveItemToBucket: ([bucketIndex, itemIndex]: BucketItemIndexPair, bucketAdjustment: number, itemValue?: TValue) => {
            const value = itemValue ?? instance.getItem([bucketIndex, itemIndex]).value;
            const matrix = [...state.matrix]

            // remove from current group
            matrix[bucketIndex].splice(itemIndex, 1)

            // add to new group
            const newBucketIndex = bucketIndex + bucketAdjustment
            if (matrix[newBucketIndex].length < itemIndex)
                matrix[newBucketIndex].push(value)
            else
                matrix[newBucketIndex].splice(itemIndex, 0, value)
        }
    };

    const getDragAfterElement = (g: number, dV: number, y: number) => {
        let draggableElements: HTMLLIElement[] = []
        try {
            //const 
            draggableElements = itemsRef.current[g].filter((itm, v) => v !== dV)
        } catch (e) {
            console.log(g, dV, y)
            console.log(itemsRef.current)
            throw e
        }
        return draggableElements.reduce((closest: { offset: number, element: HTMLLIElement | null, v: number }, child: HTMLLIElement, v: number) => {
            const box = child.getBoundingClientRect()
            const offset = y - box.top - box.height / 2
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child, v: v }
            } else {
                return closest
            }
        }, { offset: Number.NEGATIVE_INFINITY, element: null, v: -1 }).v
    }

    const onDragStart = (g: number, v: number) => {
        setDragging(data[g][v] ?? null)
        draggingRef.current = { dG: g, dV: v }
    }

    const onDragEnd = () => {
        setDragging(null)
        draggingRef.current = null
    }

    const onDragOver = (g: number, e: React.DragEvent<HTMLUListElement>) => {
        if (dragging === null || draggingRef.current === null) return;

        const { dG, dV } = draggingRef.current

        const afterElement = getDragAfterElement(g, dV, e.clientY)

        if (dG === g && afterElement === dV) return;

        const res = [...data]

        // remove from group
        res[dG].splice(dV, 1)

        if (afterElement === -1) {
            // add to new group
            res[g].push(dragging)

            draggingRef.current = { dG: g, dV: res[g].length - 1 }
        } else {
            // adjust position in group
            res[g].splice(afterElement, 0, dragging)

            draggingRef.current = { dG: g, dV: afterElement }
        }

        setData(res)
    }

    return {
        data,
        setData,
        getBuckets: () => {
            return options.buckets.reduce<BucketElement<TValue>[]>((res, bucket, b) => {
                const values = data[b] ?? []

                res.push({
                    ...bucket,
                    id: b,
                    ref: (ref: HTMLUListElement | null) => bucketRefs.current[b] = ref,
                    showMoveLeft: b > 0,
                    showMoveRight: b < options.buckets.length - 1,
                    onDragOver: (e: React.DragEvent<HTMLUListElement>) => onDragOver(b, e),
                    items: values.reduce<BucketItemElement<TValue>[]>((items, val, v) => {
                        const itm = valueToItem(val)

                        if (!itm)
                            return items

                        const inSearch = isSearching && itm.title.toLowerCase().includes(search.toLowerCase())

                        items.push({
                            ...itm,

                            id: v,
                            ref: (ref: HTMLLIElement | null) => {
                                if (ref === null) return

                                if (!itemsRef.current[b])
                                    itemsRef.current[b] = []

                                itemsRef.current[b][v] = ref
                            },

                            isDragging: dragging === val,
                            onDragStart: () => onDragStart(b, v),
                            onDragEnd: () => onDragEnd(),

                            onMove: (adj: number) => onMoveGroup(val, v, b, adj),
                            onMoveLeft: () => onMoveGroup(val, v, b, -1),
                            onMoveRight: () => onMoveGroup(val, v, b, 1),

                            inSearch: inSearch,
                            isSearchFocus: inSearch && searchFocus === searchResults.findIndex(res => res[0] === b && res[1] === v),
                        })

                        return items
                    }, [])
                })

                return res
            }, [])
        },
        search: search,
        isSearching: isSearching,
        searchFocus: searchFocus,
        searchTotal: search.length,
        onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value

            setSearch(value)
            setSearchFocus(0)
            setSearchResults((() => {
                if (value.length === 0)
                    return []

                const res: [number, number][] = []
                for (let r = 0; r < options.items.length; r++) {
                    for (let c = 0; c < options.buckets.length; c++) {
                        if (data[c].length <= r) continue;
                        const itm = valueToItem(data[c][r])
                        if (itm?.title.toLowerCase().includes(value.toLowerCase()))
                            res.push([c, r])
                    }
                }
                return res
            })())
        },
        onSearchEnter: (e: React.KeyboardEvent) => {
            if (isSearching && e.key === "Enter" && searchResults.length > 0) {
                // get next result to focus
                const nextFocus = searchFocus + 1 >= searchResults.length ? 0 : searchFocus + 1
                setSearchFocus(nextFocus)

                // scroll to result
                const [g, v] = searchResults[nextFocus]
                const itm = itemsRef.current[g][v]
                if (itm) {
                    const group = bucketRefs.current[g]
                    if (group) {
                        const gbox = group.getBoundingClientRect()
                        const ibox = itm.getBoundingClientRect()
                        group.scrollTop = itm.offsetTop - group.offsetTop - gbox.height / 2 + ibox.height / 2
                    }
                }
            }
        },
    }
}