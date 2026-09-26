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
        root:      new URL('index.html',                        import.meta.url).pathname,
        main:      new URL('src/pages/home/index.html',         import.meta.url).pathname,
        terms:     new URL('src/pages/terms/index.html',        import.meta.url).pathname,
        app:       new URL('src/pages/app/index.html',          import.meta.url).pathname,
        upload:    new URL('src/pages/upload/index.html',       import.meta.url).pathname,
        analyze:   new URL('src/pages/analyze/index.html',      import.meta.url).pathname,
        optimize:  new URL('src/pages/optimize/index.html',     import.meta.url).pathname,
        benchmark: new URL('src/pages/benchmark/index.html',    import.meta.url).pathname,
        prove:     new URL('src/pages/prove/index.html',        import.meta.url).pathname,
      },
    },
  },
});
