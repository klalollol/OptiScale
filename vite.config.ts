import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      input: {
        main:      new URL('index.html',     import.meta.url).pathname,
        terms:     new URL('terms.html',     import.meta.url).pathname,
        upload:    new URL('upload.html',    import.meta.url).pathname,
        analyze:   new URL('analyze.html',   import.meta.url).pathname,
        optimize:  new URL('optimize.html',  import.meta.url).pathname,
        benchmark: new URL('benchmark.html', import.meta.url).pathname,
        prove:     new URL('prove.html',     import.meta.url).pathname,
      },
    },
  },
});
