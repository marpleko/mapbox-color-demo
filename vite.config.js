import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  console.log(mode)
  console.log(env.VITE_BASE_URL)
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), 
      }
    },
    base: mode === 'production' ? env.VITE_BASE_URL : '/',
  };
});