const crypto = require('node:crypto');

const PRODUCTION_ALLOWED_ORIGINS = [
  'https://www.liveoakjiujitsuacademy.com',
  'https://liveoakjiujitsuacademy.com'
];

const LOCAL_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

const DEFAULT_ALLOWED_ORIGINS = (
  process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
)
  ? PRODUCTION_ALLOWED_ORIGINS
  : PRODUCTION_ALLOWED_ORIGINS.concat(LOCAL_ALLOWED_ORIGINS);

const RATE_LIMIT_STORE_KEY = '__LIVE_OAK_RATE_LIMIT_STORE__';
const KV_RATE_LIMIT_TIMEOUT_MS = 2500;

function getRateLimitStore() {
  if (!globalThis[RATE_LIMIT_STORE_KEY]) {
    globalThis[RATE_LIMIT_STORE_KEY] = new Map();
  }

  return globalThis[RATE_LIMIT_STORE_KEY];
}

function pruneRateLimitStore(store, now) {
  for (const [key, entry] of store.entries()) {
    if (!entry || entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

function takeRateLimitToken(key, limit, windowMs, now = Date.now()) {
  const store = getRateLimitStore();
  pruneRateLimitStore(store, now);

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    store.set(key, fresh);
    return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, remaining: Math.max(limit - entry.count, 0), resetAt: entry.resetAt };
}

function readHeader(req, name) {
  const value = req.headers[name];
  if (Array.isArray(value)) {
    return value.find((entry) => typeof entry === 'string' && entry.trim()) || '';
  }

  return typeof value === 'string' ? value : '';
}

function getClientIp(req) {
  const forwarded = readHeader(req, 'x-forwarded-for');
  if (forwarded.trim()) {
    const entries = forwarded
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (entries.length) {
      return entries[entries.length - 1];
    }
  }

  const realIp = readHeader(req, 'x-real-ip');
  if (realIp.trim()) {
    return realIp.trim();
  }

  return req.socket && req.socket.remoteAddress
    ? req.socket.remoteAddress
    : 'unknown';
}

function getKvRateLimitConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

  if (!url || !token) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ''),
    token
  };
}

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

function requiresDistributedRateLimit() {
  return process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === 'true' || isProductionRuntime();
}

function createRateLimitKey(scope, ip) {
  const digest = crypto
    .createHash('sha256')
    .update(`${scope}:${ip}`)
    .digest('hex');

  return `live-oak:rate-limit:${scope}:${digest}`;
}

async function kvCommand(config, command) {
  const timeout = createTimeoutSignal(KV_RATE_LIMIT_TIMEOUT_MS);

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command),
      signal: timeout.signal
    });

    if (!response.ok) {
      const error = new Error(`Rate limit store failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    if (payload && payload.error) {
      const error = new Error(String(payload.error));
      error.status = 500;
      throw error;
    }

    return payload ? payload.result : null;
  } finally {
    timeout.clear();
  }
}

async function takeDistributedRateLimitToken(key, limit, windowMs, now = Date.now()) {
  const config = getKvRateLimitConfig();
  if (!config) {
    if (requiresDistributedRateLimit()) {
      const error = new Error('Distributed rate limit store is not configured.');
      error.status = 500;
      throw error;
    }

    return takeRateLimitToken(key, limit, windowMs, now);
  }

  const count = Number(await kvCommand(config, ['INCR', key]));
  if (count === 1) {
    await kvCommand(config, ['PEXPIRE', key, String(windowMs)]);
  }

  const ttlMs = Number(await kvCommand(config, ['PTTL', key]));
  const resetAt = now + (ttlMs > 0 ? ttlMs : windowMs);

  return {
    allowed: count <= limit,
    remaining: Math.max(limit - count, 0),
    resetAt
  };
}

async function applyRateLimit(req, res, options) {
  const ip = getClientIp(req);
  const scope = options.scope || 'default';
  const limit = options.limit;
  const windowMs = options.windowMs;
  let result;

  try {
    result = await takeDistributedRateLimitToken(createRateLimitKey(scope, ip), limit, windowMs);
  } catch (error) {
    console.error('Rate limit check failed.', {
      scope,
      message: error && error.message,
      status: error && error.status
    });
    res.status(503).json({ error: 'Rate limit temporarily unavailable.' });
    return false;
  }

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

  if (!result.allowed) {
    const retryAfterSeconds = Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1);
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({ error: options.message || 'Too many requests. Please try again soon.' });
    return false;
  }

  return true;
}

function parseAllowedOrigins(value) {
  if (!value || typeof value !== 'string') {
    return DEFAULT_ALLOWED_ORIGINS.slice();
  }

  const origins = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return origins.length ? origins : DEFAULT_ALLOWED_ORIGINS.slice();
}

function getRequestOrigin(req, options = {}) {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.trim()) {
    return origin.trim();
  }

  if (options.allowRefererFallback === false) {
    return '';
  }

  const referer = req.headers.referer;
  if (typeof referer === 'string' && referer.trim()) {
    try {
      return new URL(referer).origin;
    } catch (error) {
      return '';
    }
  }

  return '';
}

function hasAllowedOrigin(req, allowedOrigins, options = {}) {
  const requestOrigin = getRequestOrigin(req, options);
  if (!requestOrigin) {
    return false;
  }

  return allowedOrigins.includes(requestOrigin);
}

async function readJsonBody(req, options = {}) {
  const maxBytes = options.maxBytes || 16 * 1024;
  const contentType = req.headers['content-type'] || '';
  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    const error = new Error('Expected application/json payload.');
    error.status = 415;
    throw error;
  }

  if (req.body && typeof req.body === 'object') {
    if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > maxBytes) {
      const error = new Error('Payload too large.');
      error.status = 413;
      throw error;
    }

    return req.body;
  }

  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
      const error = new Error('Payload too large.');
      error.status = 413;
      throw error;
    }

    try {
      return JSON.parse(req.body);
    } catch (parseError) {
      const error = new Error('Invalid JSON payload.');
      error.status = 400;
      throw error;
    }
  }

  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > maxBytes) {
      const error = new Error('Payload too large.');
      error.status = 413;
      throw error;
    }

    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim();
  if (!rawBody) {
    const error = new Error('Request body is required.');
    error.status = 400;
    throw error;
  }

  try {
    return JSON.parse(rawBody);
  } catch (parseError) {
    const error = new Error('Invalid JSON payload.');
    error.status = 400;
    throw error;
  }
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timer);
    }
  };
}

module.exports = {
  DEFAULT_ALLOWED_ORIGINS,
  applyRateLimit,
  createTimeoutSignal,
  getClientIp,
  getRequestOrigin,
  hasAllowedOrigin,
  parseAllowedOrigins,
  readJsonBody,
  _private: {
    createRateLimitKey,
    getKvRateLimitConfig,
    getRateLimitStore,
    getRequestOrigin,
    isProductionRuntime,
    pruneRateLimitStore,
    requiresDistributedRateLimit,
    takeDistributedRateLimitToken,
    takeRateLimitToken
  }
};
