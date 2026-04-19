const {
  DEFAULT_ALLOWED_ORIGINS,
  applyRateLimit,
  createTimeoutSignal,
  hasAllowedOrigin,
  parseAllowedOrigins,
  readJsonBody
} = require('./_lib/security');

const ALLOWED_SIGNUP_TYPES = new Set(['just_me', 'my_child', 'me_plus_other', 'me_plus_others']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[1-9]\d{9,14}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_DATE_PATTERN = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{4}$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const MAX_CONTACTS = 6;

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
    contacts: payload.contacts.map(validateContact)
  };
}

async function forwardSignup(webhookUrl, payload) {
  const timeout = createTimeoutSignal(10000);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: timeout.signal
    });

    if (!response.ok) {
      const body = await response.text();
      const error = new Error(`Signup webhook failed with ${response.status}`);
      error.status = response.status;
      error.body = body;
      throw error;
    }
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
  if (!hasAllowedOrigin(req, allowedOrigins)) {
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

  const webhookUrl = process.env.N8N_SIGNUP_WEBHOOK_URL || process.env.NEXT_PUBLIC_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('Missing N8N_SIGNUP_WEBHOOK_URL environment variable.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const payload = await readJsonBody(req, { maxBytes: 32 * 1024 });
    const normalizedPayload = normalizeSignupPayload(payload);

    await forwardSignup(webhookUrl, normalizedPayload);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ ok: true });
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
  normalizeSignupPayload,
  validateContact,
  validateParent
};
