import { InputFeature, InputState, OnChangeFn } from "../types"

export type FiltersInputState = {
    globalFilter: string
}

export type FiltersOptions = {
    // Global Filter
    onGlobalFilterChange: OnChangeFn<any>
}

export type FiltersInstance = {
    onGlobalFilterChange: OnChangeFn<any>
}

export const Filters: InputFeature<any> = {
    getInitialState: (state: InputState<any>): InputState<any> => ({
        globalFilter: ''
    }),
    getDefaultOptions: () => ({
        onGlobalFilterChange: () => {}
    }),
};
