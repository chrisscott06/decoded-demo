import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const pipelineData = path.resolve(__dirname, '../pipeline/dist/eir')
const pipelineStatic = path.resolve(__dirname, '../pipeline')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pipeline-data': pipelineData,
      '@pipeline-static': pipelineStatic,
    },
  },
  server: {
    // Demo runs on 5174 to avoid colliding with the production IVG project
    // on 5173. strictPort so it fails loudly if 5174 is already in use
    // rather than silently roaming to a different number.
    port: 5174,
    strictPort: true,
    // Allow Vite dev server to read JSON from outside the eir/ project root
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
