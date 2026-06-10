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
    // Demo runs on 8174 — chosen well away from vite's default 5173+
    // range so it never collides with the source production project
    // (or anything else that auto-roams in 5173/5174/5175). strictPort
    // so it fails loudly if 8174 is already in use rather than silently
    // roaming to a different number.
    port: 8174,
    strictPort: true,
    // Allow Vite dev server to read JSON from outside the eir/ project root
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
