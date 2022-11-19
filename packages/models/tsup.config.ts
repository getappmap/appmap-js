import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  sourcemap: true,
  format: ['cjs', 'esm'],
  env: {
    NODE_ENV: 'production'
  },
  minify: true
});
