// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.js'

export default defineConfig(
  buildConfigs({
    name: 'sortable-buckets-core',
    jsName: 'SortableBucketsCore',
    outputFile: 'index',
    entryFile: 'src/index.ts',
    external: [],
    globals: {},
  })
)
