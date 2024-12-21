import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  plugins: [react(), vue()],
  resolve: {
    alias: {
      '@': '/src', // 如果需要路径别名，可以在这里配置
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  },
});