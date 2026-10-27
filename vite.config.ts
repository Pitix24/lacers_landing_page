import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Sirve las Functions de api/ dentro de `npm run dev` (en Vercel las sirve la plataforma).
 * Carga .env.local en process.env del servidor: sin DATABASE_URL la API usa memoria.
 */
function vercelApiDev(): Plugin {
  return {
    name: 'lacers-api-dev',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()
        let mod: Record<string, ((request: Request) => Promise<Response>) | undefined>
        try {
          mod = await server.ssrLoadModule(`/api/${url.pathname.slice(5).replace(/\/$/, '')}.ts`)
        } catch {
          res.statusCode = 404
          return res.end()
        }
        try {
          const handler = mod[req.method ?? 'GET']
          if (!handler) {
            res.statusCode = 405
            return res.end()
          }
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const response = await handler(
            new Request(new URL(req.url ?? '/', `http://${req.headers.host}`), {
              method: req.method,
              headers: req.headers as Record<string, string>,
              body: chunks.length ? Buffer.concat(chunks) : undefined,
            }),
          )
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          server.config.logger.error(String(err))
          res.statusCode = 500
          res.end()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), vercelApiDev()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
