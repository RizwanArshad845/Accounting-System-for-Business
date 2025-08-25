// // vite.config.js
// import { defineConfig } from "vite"
// import react from "@vitejs/plugin-react"

// export default defineConfig({
//   plugins: [react()],
//   base: './',   // <-- add this for Electron
//   server: {
//     proxy: {
//       "/invoices": {
//         target: "http://localhost:4000",
//         changeOrigin: true,
//       },
//       "/users": {
//         target: "http://localhost:4000",
//         changeOrigin: true,
//       },
//       "/varieties": {
//         target: "http://localhost:4000",
//         changeOrigin: true,
//       }
//     }
//   }
// })
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron
  server: {
    proxy: {
      "/invoices": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/users": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/varieties": {
        target: "http://localhost:4000",
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      external: [
        'electron',
        'fs',
        'path',
        'child_process',
        'os',
        'crypto',
        'buffer',
        'stream',
        'util',
        'url',
        'querystring'
      ]
    }
  },
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    exclude: ['electron']
  }
})