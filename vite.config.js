import { defineConfig } from 'vite'

export default defineConfig({
  // config options
  base: "/nasijarven-jaat",
  build: {
    outDir: 'docs'
  },
  server: {
    open: "index.html",
  },
})

