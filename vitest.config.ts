import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'components/schools/**', 'app/**'],
      exclude: [
        'components/ui/**',
        'components/schools/school-map.tsx',
        'components/schools/school-map-wrapper.tsx',
        '*.config.*',
        'next-env.d.ts',
      ],
      thresholds: { lines: 70, functions: 70 },
    },
  },
})
