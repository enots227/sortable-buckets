// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.js'

export default defineConfig(
  buildConfigs({
    name: 'sortable-buckets-react',
    jsName: 'ReactSortableBuckets',
    outputFile: 'index',
    entryFile: 'src/index.tsx',
    external: ['react', 'sortable-buckets-core'],
    globals: {
      react: 'React',
    },
  })
)
