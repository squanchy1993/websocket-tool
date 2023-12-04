/*
 * @Date: 2023-12-04 09:01:07
 * @LastEditors: zhusisheng zhusisheng@shenhaoinfo.com
 * @LastEditTime: 2023-12-04 10:30:07
 * @FilePath: \websocket-tool\vite.config.ts
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        // 禁用浏览器缓存，确保每次都获取最新的代码
        manualChunks: () => 'everything.js',
      },
    },
  }

})
