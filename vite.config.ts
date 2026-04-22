import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import contentCollections from '@content-collections/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  server: {
    allowedHosts: ['emurdagames.elijah-hoffman.org'],
    proxy: {
      '/ws': {
        target: 'ws://localhost:3002',
        ws: true,
      },
    },
  },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    contentCollections(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
