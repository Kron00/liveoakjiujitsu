import { defineConfig } from 'astro/config';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const devApiRoutes = new Map([
  ['/api/available-slots', './api/available-slots.js'],
  ['/api/available-slots.js', './api/available-slots.js'],
  ['/api/submit-signup', './api/submit-signup.js'],
  ['/api/submit-signup.js', './api/submit-signup.js']
]);

function attachVercelResponseHelpers(res) {
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };

  res.json = (body) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(body));
  };

  res.send = (body) => {
    res.end(body);
  };
}

function localVercelApiPlugin() {
  return {
    name: 'local-vercel-api',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url || '/', 'http://localhost');
        const routePath = devApiRoutes.get(requestUrl.pathname);

        if (!routePath) {
          next();
          return;
        }

        try {
          req.query = Object.fromEntries(requestUrl.searchParams);
          attachVercelResponseHelpers(res);
          const handler = require(routePath);
          await handler(req, res);
        } catch (error) {
          server.config.logger.error(error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          }
          res.end(JSON.stringify({ error: 'Local API handler failed.' }));
        }
      });
    }
  };
}

function assertProductionSecurityConfig() {
  if (process.env.VERCEL_ENV !== 'production') {
    return;
  }

  if (!process.env.PUBLIC_TURNSTILE_SITE_KEY) {
    throw new Error('PUBLIC_TURNSTILE_SITE_KEY is required for production builds.');
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN are required for production builds.');
  }
}

assertProductionSecurityConfig();

export default defineConfig({
  build: {
    format: 'file'
  },
  vite: {
    plugins: [localVercelApiPlugin()]
  }
});
