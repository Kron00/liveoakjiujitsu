const {
  DEFAULT_ALLOWED_ORIGINS,
  applyRateLimit,
  createTimeoutSignal,
  getClientIp,
  getRequestOrigin,
  hasAllowedOrigin,
  parseAllowedOrigins,
  readJsonBody
} = require('./_lib/security');
const { waitUntil } = require('@vercel/functions');

const ALLOWED_SIGNUP_TYPES = new Set(['just_me', 'my_child', 'me_plus_other', 'me_plus_others']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[1-9]\d{9,14}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_DATE_PATTERN = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{4}$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const MAX_CONTACTS = 6;
const SIGNUP_WEBHOOK_TIMEOUT_MS = 9000;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function readString(value, field, maxLength, options = {}) {
  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    if (options.optional) {
      return '';
    }
    throw validationError(`${field} is required.`);
  }

  if (trimmed.length > maxLength) {
    throw validationError(`${field} is too long.`);
  }

  return trimmed;
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function configurationError(message) {
  const error = new Error(message);
  error.status = 500;
  return error;
}

function validateEmail(value, field) {
  const email = readString(value, field, 254);
  if (!EMAIL_PATTERN.test(email)) {
    throw validationError(`${field} must be a valid email address.`);
  }
  return email.toLowerCase();
}

function validatePhone(value, field) {
  const phone = readString(value, field, 20);
  if (!PHONE_PATTERN.test(phone)) {
    throw validationError(`${field} must be a valid phone number.`);
  }
  return phone;
}

function validateDob(value, field) {
  const dob = readString(value, field, 10);
  if (!ISO_DATE_PATTERN.test(dob) && !SLASH_DATE_PATTERN.test(dob)) {
    throw validationError(`${field} must use YYYY-MM-DD or MM/DD/YYYY format.`);
  }
  return dob;
}

function validateSlot(value) {
  const slot = readString(value, 'selectedSlot', 40);
  if (!ISO_DATE_TIME_PATTERN.test(slot)) {
    throw validationError('selectedSlot must be an ISO datetime.');
  }
  return slot;
}

function validateOptionalText(value, field, maxLength) {
  if (value == null || value === '') {
    return '';
  }

  return readString(value, field, maxLength, { optional: true });
}

function validateWebhookUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw configurationError('N8N_SIGNUP_WEBHOOK_URL is required.');
  }

  const webhookUrl = value.trim();
  if (webhookUrl.length > 2048) {
    throw configurationError('N8N_SIGNUP_WEBHOOK_URL is too long.');
  }

  let parsed;
  try {
    parsed = new URL(webhookUrl);
  } catch (error) {
    throw configurationError('Signup webhook URL is invalid.');
  }

  if (parsed.protocol !== 'https:') {
    throw configurationError('Signup webhook URL must use HTTPS.');
  }

  return parsed.toString();
}

function validateParent(parent) {
  if (!parent || typeof parent !== 'object' || Array.isArray(parent)) {
    throw validationError('parent is required for dependent contacts.');
  }

  return {
    firstName: readString(parent.firstName, 'parent.firstName', 80),
    lastName: readString(parent.lastName, 'parent.lastName', 80),
    phone: validatePhone(parent.phone, 'parent.phone'),
    email: validateEmail(parent.email, 'parent.email')
  };
}

function validateContact(contact) {
  if (!contact || typeof contact !== 'object' || Array.isArray(contact)) {
    throw validationError('Each contact must be an object.');
  }

  const role = readString(contact.role, 'role', 24);
  if (!['self', 'dependent'].includes(role)) {
    throw validationError('role must be self or dependent.');
  }

  const normalized = {
    role,
    firstName: readString(contact.firstName, 'firstName', 80),
    lastName: readString(contact.lastName, 'lastName', 80),
    dob: validateDob(contact.dob, 'dob'),
    phone: validatePhone(contact.phone, 'phone'),
    email: validateEmail(contact.email, 'email'),
    classDay: readString(contact.classDay, 'classDay', 40),
    classTime: readString(contact.classTime, 'classTime', 40),
    selectedSlot: validateSlot(contact.selectedSlot),
    medicalNotes: validateOptionalText(contact.medicalNotes, 'medicalNotes', 300),
    experience: validateOptionalText(contact.experience, 'experience', 40) || 'None'
  };

  if (role === 'dependent') {
    normalized.parent = validateParent(contact.parent);
  }

  return normalized;
}

function normalizeSignupPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError('Request body must be a JSON object.');
  }

  const honeypot = validateOptionalText(payload.website, 'website', 200);
  if (honeypot) {
    throw validationError('Spam submission rejected.');
  }

  const signupType = readString(payload.signup_type, 'signup_type', 40);
  if (!ALLOWED_SIGNUP_TYPES.has(signupType)) {
    throw validationError('signup_type is invalid.');
  }

  if (!Array.isArray(payload.contacts) || payload.contacts.length === 0) {
    throw validationError('contacts must include at least one participant.');
  }

  if (payload.contacts.length > MAX_CONTACTS) {
    throw validationError('Too many contacts submitted at once.');
  }

  return {
    signup_type: signupType,
    contacts: payload.contacts.map(validateContact),
    turnstileToken: validateOptionalText(payload.turnstileToken, 'turnstileToken', 4096)
  };
}

function isAbortError(error) {
  return Boolean(
    error &&
    (
      error.name === 'AbortError' ||
      error.code === 'ABORT_ERR' ||
      error.message === 'This operation was aborted'
    )
  );
}

function createAcceptedSignupResponse(payload) {
  return {
    success: true,
    accepted: true,
    pending_confirmation: true,
    count: payload.contacts.length,
    results: [],
    message: 'Signup request accepted.'
  };
}

function logSignupForwardingError(error) {
  console.error('Failed to submit signup payload.', {
    message: error && error.message,
    status: error && error.status,
    body: error && error.body
  });
}

function isTurnstileRequired() {
  return process.env.REQUIRE_TURNSTILE === 'true' ||
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production';
}

async function verifyTurnstileToken(token, req) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const required = isTurnstileRequired();

  if (!secret) {
    if (required) {
      const error = new Error('Bot verification is not configured.');
      error.status = 500;
      throw error;
    }

    return { skipped: true };
  }

  if (!token) {
    const error = new Error('Bot verification is required.');
    error.status = 400;
    throw error;
  }

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);

  const ip = getClientIp(req);
  if (ip && ip !== 'unknown') {
    params.set('remoteip', ip);
  }

  const timeout = createTimeoutSignal(5000);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      signal: timeout.signal
    });

    if (!response.ok) {
      const error = new Error('Bot verification failed.');
      error.status = 400;
      throw error;
    }

    const result = await response.json();
    if (!result || result.success !== true) {
      const error = new Error('Bot verification failed.');
      error.status = 400;
      throw error;
    }

    return result;
  } finally {
    timeout.clear();
  }
}

function sanitizeForwardPayload(payload) {
  return {
    signup_type: payload.signup_type,
    contacts: payload.contacts
  };
}

function logSignupAccepted(req, payload) {
  console.info('Signup request accepted.', {
    ip: getClientIp(req),
    origin: getRequestOrigin(req, { allowRefererFallback: false }),
    signupType: payload.signup_type,
    contactCount: payload.contacts.length
  });
}

function queueSignupForward(webhookUrl, payload) {
  const task = forwardSignup(webhookUrl, payload).catch(logSignupForwardingError);
  waitUntil(task);
  return task;
}

async function forwardSignup(webhookUrl, payload) {
  const timeout = createTimeoutSignal(SIGNUP_WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sanitizeForwardPayload(payload)),
      signal: timeout.signal
    });

    const bodyText = await response.text();
    if (!response.ok) {
      const error = new Error(`Signup webhook failed with ${response.status}`);
      error.status = response.status;
      error.body = bodyText;
      throw error;
    }

    if (!bodyText) {
      return { success: true, count: payload.contacts.length, results: [] };
    }

    try {
      return JSON.parse(bodyText);
    } catch (error) {
      return {
        success: true,
        count: payload.contacts.length,
        results: [],
        raw: bodyText
      };
    }
  } catch (error) {
    if (isAbortError(error)) {
      return {
        success: true,
        pending_confirmation: true,
        count: payload.contacts.length,
        results: [],
        message: 'Signup request was accepted, but webhook confirmation timed out.'
      };
    }

    throw error;
  } finally {
    timeout.clear();
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
  if (!hasAllowedOrigin(req, allowedOrigins, { allowRefererFallback: false })) {
    return res.status(403).json({ error: 'Forbidden origin.' });
  }

  if (!applyRateLimit(req, res, {
    scope: 'submit-signup',
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many signup attempts. Please wait a few minutes and try again.'
  })) {
    return;
  }

  if (!process.env.N8N_SIGNUP_WEBHOOK_URL) {
    console.error('Missing N8N_SIGNUP_WEBHOOK_URL environment variable.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  if (isTurnstileRequired() && !process.env.TURNSTILE_SECRET_KEY) {
    console.error('Missing TURNSTILE_SECRET_KEY environment variable.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const webhookUrl = validateWebhookUrl(process.env.N8N_SIGNUP_WEBHOOK_URL);
    const payload = await readJsonBody(req, { maxBytes: 32 * 1024 });
    const normalizedPayload = normalizeSignupPayload(payload);
    await verifyTurnstileToken(normalizedPayload.turnstileToken, req);
    logSignupAccepted(req, normalizedPayload);

    if (process.env.SIGNUP_SUBMIT_MODE !== 'sync') {
      queueSignupForward(webhookUrl, normalizedPayload);

      res.setHeader('Cache-Control', 'no-store');
      return res.status(202).json(createAcceptedSignupResponse(normalizedPayload));
    }

    const webhookResult = await forwardSignup(webhookUrl, normalizedPayload);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(webhookResult);
  } catch (error) {
    if (error && error.status && error.status < 500) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Failed to submit signup payload.', {
      message: error && error.message,
      status: error && error.status,
      body: error && error.body
    });
    return res.status(502).json({ error: 'Unable to submit signup request right now.' });
  }
}

module.exports = handler;
module.exports._private = {
  DEFAULT_ALLOWED_ORIGINS,
  MAX_CONTACTS,
  SIGNUP_WEBHOOK_TIMEOUT_MS,
  createAcceptedSignupResponse,
  forwardSignup,
  isAbortError,
  isTurnstileRequired,
  normalizeSignupPayload,
  queueSignupForward,
  sanitizeForwardPayload,
  validateContact,
  validateParent,
  validateWebhookUrl,
  verifyTurnstileToken
};
