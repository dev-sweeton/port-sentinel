import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    charts: ['recharts'],
                    icons: ['lucide-react'],
                    flow: ['reactflow']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    },
    server: {
        // Proxy removed for Simulation Mode
    }
})
