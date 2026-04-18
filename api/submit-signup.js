const {
  checkRateLimit,
  createHttpError,
  getClientIp,
  getRequestId,
  isAllowedOrigin,
  readJsonBody
} = require('./_security');

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_REQUEST_BYTES = 32 * 1024;
const MAX_CONTACTS = 6;
const MAX_NAME_LENGTH = 60;
const MAX_EMAIL_LENGTH = 254;
const MAX_MEDICAL_NOTES_LENGTH = 300;
const MAX_LABEL_LENGTH = 64;

const VALID_SIGNUP_TYPES = new Set(['just_me', 'someone_else', 'me_plus_others']);
const VALID_ROLES = new Set(['self', 'dependent']);
const VALID_EXPERIENCE = new Set(['None', 'Less than 1 year', '1-3 years', '3+ years']);
const SIGNUP_RATE_LIMITS = [
  { windowMs: 60 * 60 * 1000, max: 5 },
  { windowMs: 24 * 60 * 60 * 1000, max: 20 }
];

function sendJson(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(payload);
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateText(value, fieldName, maxLength) {
  const trimmed = trimString(value);
  if (!trimmed) {
    throw createHttpError(400, `${fieldName} is required.`);
  }
  if (trimmed.length > maxLength) {
    throw createHttpError(400, `${fieldName} is too long.`);
  }
  return trimmed;
}

function validateOptionalText(value, maxLength) {
  const trimmed = trimString(value);
  if (!trimmed) return '';
  if (trimmed.length > maxLength) {
    throw createHttpError(400, 'Medical notes are too long.');
  }
  return trimmed;
}

function validateEmail(value) {
  const email = validateText(value, 'Email', MAX_EMAIL_LENGTH);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createHttpError(400, 'Please provide a valid email address.');
  }
  return email;
}

function normalizeUsPhone(value) {
  const digits = trimString(value).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.charAt(0) === '1') return `+${digits}`;
  throw createHttpError(400, 'Please provide a valid phone number.');
}

function validateDob(value) {
  const dob = trimString(value);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob);
  if (!match) {
    throw createHttpError(400, 'Please provide a valid date of birth.');
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw createHttpError(400, 'Please provide a valid date of birth.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    throw createHttpError(400, 'Date of birth cannot be in the future.');
  }

  return dob;
}

function validateLabel(value, fieldName) {
  return validateText(value, fieldName, MAX_LABEL_LENGTH);
}

function validateExperience(value) {
  const trimmed = trimString(value);
  if (!trimmed) return 'None';
  if (!VALID_EXPERIENCE.has(trimmed)) {
    throw createHttpError(400, 'Experience must be a supported value.');
  }
  return trimmed;
}

function validateParent(parent) {
  if (!parent || typeof parent !== 'object' || Array.isArray(parent)) {
    throw createHttpError(400, 'Parent contact details are required.');
  }

  return {
    firstName: validateText(parent.firstName, 'Parent first name', MAX_NAME_LENGTH),
    lastName: validateText(parent.lastName, 'Parent last name', MAX_NAME_LENGTH),
    phone: normalizeUsPhone(parent.phone),
    email: validateEmail(parent.email)
  };
}

function validateContact(contact) {
  if (!contact || typeof contact !== 'object' || Array.isArray(contact)) {
    throw createHttpError(400, 'Each contact must be an object.');
  }

  const role = trimString(contact.role);
  if (!VALID_ROLES.has(role)) {
    throw createHttpError(400, 'Each contact role must be supported.');
  }

  const sanitized = {
    role,
    firstName: validateText(contact.firstName, 'First name', MAX_NAME_LENGTH),
    lastName: validateText(contact.lastName, 'Last name', MAX_NAME_LENGTH),
    dob: validateDob(contact.dob),
    phone: normalizeUsPhone(contact.phone),
    email: validateEmail(contact.email),
    classDay: validateLabel(contact.classDay, 'Class day'),
    classTime: validateLabel(contact.classTime, 'Class time'),
    selectedSlot: validateLabel(contact.selectedSlot, 'Selected slot'),
    medicalNotes: validateOptionalText(contact.medicalNotes, MAX_MEDICAL_NOTES_LENGTH),
    experience: validateExperience(contact.experience)
  };

  if (role === 'dependent') {
    sanitized.parent = validateParent(contact.parent);
  } else if (contact.parent) {
    throw createHttpError(400, 'Parent information is only allowed for dependent contacts.');
  }

  return sanitized;
}

function sanitizePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'Request body must be an object.');
  }

  const signupType = trimString(body.signup_type);
  if (!VALID_SIGNUP_TYPES.has(signupType)) {
    throw createHttpError(400, 'Signup type must be supported.');
  }

  if (!Array.isArray(body.contacts) || !body.contacts.length) {
    throw createHttpError(400, 'At least one contact is required.');
  }

  if (body.contacts.length > MAX_CONTACTS) {
    throw createHttpError(400, 'Too many contacts were submitted.');
  }

  const turnstileToken = trimString(body.turnstileToken);
  if (!turnstileToken) {
    throw createHttpError(400, 'Please complete the verification and try again.');
  }

  const website = trimString(body.website);
  if (website) {
    throw createHttpError(400, 'Submission could not be accepted.');
  }

  return {
    signup_type: signupType,
    contacts: body.contacts.map(validateContact),
    turnstileToken
  };
}

async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw createHttpError(500, 'Server configuration error.');
  }

  const payload = new URLSearchParams({
    secret,
    response: token
  });

  if (remoteIp && remoteIp !== 'unknown') {
    payload.set('remoteip', remoteIp);
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload.toString()
  });

  if (!response.ok) {
    throw createHttpError(502, 'Verification service failed.');
  }

  const result = await response.json();
  if (!result.success) {
    throw createHttpError(403, 'Please complete the verification and try again.');
  }
}

async function forwardSignup(payload) {
  const webhookUrl = process.env.SIGNUP_WEBHOOK_URL;
  if (!webhookUrl) {
    throw createHttpError(500, 'Server configuration error.');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      signup_type: payload.signup_type,
      contacts: payload.contacts
    })
  });

  if (!response.ok) {
    const error = createHttpError(502, 'Failed to submit signup.');
    error.downstreamStatus = response.status;
    throw error;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const requestId = getRequestId(req);
  const clientIp = getClientIp(req);

  if (!isAllowedOrigin(req)) {
    console.error('Rejected signup submission due to origin.', {
      endpoint: '/api/submit-signup',
      requestId,
      clientIp
    });
    return sendJson(res, 403, { error: 'Submission could not be accepted.' });
  }

  const rateLimit = checkRateLimit('submit-signup', clientIp, SIGNUP_RATE_LIMITS);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    console.error('Rejected signup submission due to rate limit.', {
      endpoint: '/api/submit-signup',
      requestId,
      clientIp
    });
    return sendJson(res, 429, { error: 'Too many signup attempts. Please try again later.' });
  }

  try {
    const body = await readJsonBody(req, MAX_REQUEST_BYTES);
    const payload = sanitizePayload(body);

    await verifyTurnstile(payload.turnstileToken, clientIp);
    await forwardSignup(payload);

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    const status = error && error.status ? error.status : 500;
    const message = status >= 500
      ? 'Something went wrong. Please try again or call us at (707) 755-7247.'
      : error.message;

    console.error('Signup submission failed.', {
      endpoint: '/api/submit-signup',
      requestId,
      clientIp,
      status,
      downstreamStatus: error && error.downstreamStatus ? error.downstreamStatus : null
    });

    return sendJson(res, status, { error: message });
  }
};
