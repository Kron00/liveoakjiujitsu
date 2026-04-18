const test = require('node:test');
const assert = require('node:assert/strict');

const submitSignup = require('../api/submit-signup');
const submitSignupPrivate = submitSignup._private;
const availableSlots = require('../api/available-slots');
const security = require('../api/_lib/security');

function createMockReq(overrides = {}) {
  return {
    method: overrides.method || 'POST',
    headers: overrides.headers || {},
    body: overrides.body,
    query: overrides.query || {},
    socket: {
      remoteAddress: overrides.remoteAddress || '127.0.0.1'
    },
    [Symbol.asyncIterator]: async function* () {}
  };
}

function createMockRes() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

function createValidPayload(overrides = {}) {
  return {
    signup_type: 'me_plus_others',
    contacts: [
      {
        role: 'self',
        firstName: 'Alex',
        lastName: 'Lucas',
        dob: '04/18/1990',
        phone: '+17075557247',
        email: 'alex@example.com',
        classDay: 'Monday',
        classTime: '6:00 PM',
        selectedSlot: '2026-04-21T01:00:00.000Z',
        allergies: '',
        experience: 'None'
      }
    ],
    ...overrides
  };
}

test.beforeEach(() => {
  security._private.getRateLimitStore().clear();
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.N8N_SIGNUP_WEBHOOK_URL;
  delete process.env.NEXT_PUBLIC_WEBHOOK_URL;
  delete global.fetch;
});

test('normalizeSignupPayload accepts the current client payload shape', () => {
  const payload = createValidPayload({
    contacts: [
      {
        role: 'dependent',
        firstName: 'Mia',
        lastName: 'Lucas',
        dob: '04/18/2018',
        phone: '+17075557247',
        email: 'parent@example.com',
        classDay: 'Tuesday',
        classTime: '5:00 PM',
        selectedSlot: '2026-04-22T00:00:00.000Z',
        parent: {
          firstName: 'Alex',
          lastName: 'Lucas',
          phone: '+17075557247',
          email: 'parent@example.com'
        }
      }
    ]
  });

  const normalized = submitSignupPrivate.normalizeSignupPayload(payload);

  assert.equal(normalized.signup_type, 'me_plus_others');
  assert.equal(normalized.contacts.length, 1);
  assert.equal(normalized.contacts[0].dob, '04/18/2018');
  assert.equal(normalized.contacts[0].parent.firstName, 'Alex');
});

test('normalizeSignupPayload rejects honeypot spam submissions', () => {
  assert.throws(
    () => submitSignupPrivate.normalizeSignupPayload(createValidPayload({ website: 'spam.example' })),
    /Spam submission rejected/
  );
});

test('submit-signup rejects requests from unapproved origins', async () => {
  process.env.N8N_SIGNUP_WEBHOOK_URL = 'https://example.com/webhook';

  const req = createMockReq({
    headers: {
      origin: 'https://evil.example',
      'content-type': 'application/json'
    },
    body: createValidPayload()
  });
  const res = createMockRes();

  await submitSignup(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'Forbidden origin.' });
});

test('submit-signup forwards sanitized payloads through the first-party endpoint', async () => {
  process.env.N8N_SIGNUP_WEBHOOK_URL = 'https://example.com/webhook';

  let forwardedRequest;
  global.fetch = async (url, options) => {
    forwardedRequest = { url, options };
    return {
      ok: true,
      status: 201,
      text: async () => ''
    };
  };

  const req = createMockReq({
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json'
    },
    body: createValidPayload({ website: '' })
  });
  const res = createMockRes();

  await submitSignup(req, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(forwardedRequest.url, 'https://example.com/webhook');

  const forwardedPayload = JSON.parse(forwardedRequest.options.body);
  assert.equal(forwardedPayload.signup_type, 'me_plus_others');
  assert.equal(forwardedPayload.contacts[0].dob, '04/18/1990');
  assert.equal(Object.hasOwn(forwardedPayload, 'website'), false);
});

test('available-slots calendar mapping stays aligned with age boundaries', () => {
  assert.equal(availableSlots._private.getCalendarForAge(3).key, 'sprouts');
  assert.equal(availableSlots._private.getCalendarForAge(12).key, 'youth');
  assert.equal(availableSlots._private.getCalendarForAge(13).key, 'adult');
  assert.equal(availableSlots._private.getCalendarForAge(2), null);
});
