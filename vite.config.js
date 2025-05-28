import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base:'./',
  server: {
    host: '0.0.0.0',
  }
})

// export default defineConfig({
//   server: {
//     host: '0.0.0.0',
//     proxy: {
//       '/api': {
//         target: 'http://localhost:8083',
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, '')
//       }
//     }
//   }
// })