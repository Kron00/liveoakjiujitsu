const RATE_LIMIT_STORE = globalThis.__LIVE_OAK_RATE_LIMIT_STORE__ || (globalThis.__LIVE_OAK_RATE_LIMIT_STORE__ = new Map());

function getHeader(req, name) {
  const value = req.headers && req.headers[name];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function getClientIp(req) {
  const forwardedFor = getHeader(req, 'x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.remoteAddress) || 'unknown';
}

function getRequestId(req) {
  return getHeader(req, 'x-request-id') || getHeader(req, 'x-vercel-id') || '';
}

function getCurrentOrigin(req) {
  const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host');
  if (!host) return '';
  const proto = getHeader(req, 'x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

function isAllowedOrigin(req) {
  const allowedOrigins = new Set([
    getCurrentOrigin(req),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ]);

  if (process.env.VERCEL_URL) {
    allowedOrigins.add(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.SITE_ORIGIN) {
    allowedOrigins.add(process.env.SITE_ORIGIN);
  }

  const origin = getHeader(req, 'origin');
  if (origin && allowedOrigins.has(origin)) {
    return true;
  }

  const referer = getHeader(req, 'referer');
  if (!referer) return false;

  try {
    const refererOrigin = new URL(referer).origin;
    return allowedOrigins.has(refererOrigin);
  } catch (error) {
    return false;
  }
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function readJsonBody(req, maxBytes) {
  const contentType = (getHeader(req, 'content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    throw createHttpError(415, 'Content-Type must be application/json.');
  }

  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      throw createHttpError(413, 'Request body too large.');
    }
    chunks.push(Buffer.from(chunk));
  }

  if (!chunks.length) {
    throw createHttpError(400, 'Request body is required.');
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    throw createHttpError(400, 'Request body must be valid JSON.');
  }
}

function checkRateLimit(namespace, key, rules) {
  const now = Date.now();
  const states = [];
  let retryAfterSeconds = 0;

  for (const rule of rules) {
    const bucketKey = `${namespace}:${key}:${rule.windowMs}`;
    const timestamps = RATE_LIMIT_STORE.get(bucketKey) || [];
    const freshTimestamps = timestamps.filter((timestamp) => now - timestamp < rule.windowMs);

    if (freshTimestamps.length >= rule.max) {
      const nextRetry = Math.ceil((freshTimestamps[0] + rule.windowMs - now) / 1000);
      retryAfterSeconds = Math.max(retryAfterSeconds, Math.max(1, nextRetry));
    }

    states.push({ bucketKey, freshTimestamps });
  }

  for (const state of states) {
    if (state.freshTimestamps.length) {
      RATE_LIMIT_STORE.set(state.bucketKey, state.freshTimestamps);
    } else {
      RATE_LIMIT_STORE.delete(state.bucketKey);
    }
  }

  if (retryAfterSeconds > 0) {
    return { allowed: false, retryAfterSeconds };
  }

  for (const state of states) {
    state.freshTimestamps.push(now);
    RATE_LIMIT_STORE.set(state.bucketKey, state.freshTimestamps);
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

module.exports = {
  checkRateLimit,
  createHttpError,
  getClientIp,
  getHeader,
  getRequestId,
  isAllowedOrigin,
  readJsonBody
};
