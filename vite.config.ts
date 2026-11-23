import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_APP_PROT) || 3001
  const proxyTarget = env.VITE_APP_PROXY_TARGET || 'http://127.0.0.1:8090'

  return {
    plugins: [vue(), vueJsx()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: true,
      port,
      strictPort: false,
      proxy: {
        // 前端 VITE_APP_API_BASEURL=/api，由 vite 转发到 mock 后端（或真实后端）
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    },
    build: {
      // 把三方库拆出主包：naive-ui / vue 运行时变化少，利于浏览器长期缓存
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            naive: ['naive-ui']
          }
        }
      }
    }
  }
})
