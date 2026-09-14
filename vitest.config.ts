import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: false,
    // @nuxt/test-utils keeps one process-wide E2E context; test files must not overlap.
    fileParallelism: false,
  },
})
