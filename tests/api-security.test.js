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
        medicalNotes: '',
        experience: 'None'
      }
    ],
    ...overrides
  };
}

test.beforeEach(() => {
  security._private.getRateLimitStore().clear();
  availableSlots._private.getCalendarIdCache().clear();
  availableSlots._private.getSlotCache().clear();
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.GHL_API_KEY;
  delete process.env.GHL_LOCATION_ID;
  delete process.env.GHL_SPROUTS_CALENDAR_ID;
  delete process.env.GHL_YOUTH_CALENDAR_ID;
  delete process.env.GHL_ADULT_CALENDAR_ID;
  delete process.env.GHL_SPROUTS_CALENDAR_NAME;
  delete process.env.GHL_YOUTH_CALENDAR_NAME;
  delete process.env.GHL_ADULT_CALENDAR_NAME;
  delete process.env.N8N_SIGNUP_WEBHOOK_URL;
  delete process.env.NEXT_PUBLIC_WEBHOOK_URL;
  delete process.env.SIGNUP_SUBMIT_MODE;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.REQUIRE_TURNSTILE;
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
  process.env.SIGNUP_SUBMIT_MODE = 'sync';
  process.env.N8N_SIGNUP_WEBHOOK_URL = 'https://example.com/webhook';
  const webhookResult = {
    success: true,
    count: 1,
    results: [
      {
        index: 0,
        firstName: 'Alex',
        lastName: 'Lucas',
        role: 'self',
        success: true,
        message: 'Trial booked successfully',
        selectedSlot: '2026-04-21T01:00:00.000Z'
      }
    ]
  };

  let forwardedRequest;
  global.fetch = async (url, options) => {
    forwardedRequest = { url, options };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(webhookResult)
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

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, webhookResult);
  assert.equal(forwardedRequest.url, 'https://example.com/webhook');

  const forwardedPayload = JSON.parse(forwardedRequest.options.body);
  assert.equal(forwardedPayload.signup_type, 'me_plus_others');
  assert.equal(forwardedPayload.contacts[0].dob, '04/18/1990');
  assert.equal(forwardedPayload.contacts[0].selectedSlot, '2026-04-21T01:00:00.000Z');
  assert.equal(forwardedPayload.contacts[0].medicalNotes, '');
  assert.equal(forwardedPayload.contacts[0].experience, 'None');
  assert.equal(Object.hasOwn(forwardedPayload, 'website'), false);
  assert.equal(Object.hasOwn(forwardedPayload, 'turnstileToken'), false);
});

test('submit-signup does not use client-public webhook fallback variables', async () => {
  process.env.NEXT_PUBLIC_WEBHOOK_URL = 'https://example.com/public-webhook';

  const req = createMockReq({
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json'
    },
    body: createValidPayload()
  });
  const res = createMockRes();

  await submitSignup(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Server configuration error.' });
});

test('submit-signup requires a real Origin header for POST requests', async () => {
  process.env.N8N_SIGNUP_WEBHOOK_URL = 'https://example.com/webhook';

  const req = createMockReq({
    headers: {
      referer: 'http://localhost:3000/signup',
      'content-type': 'application/json'
    },
    body: createValidPayload()
  });
  const res = createMockRes();

  await submitSignup(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'Forbidden origin.' });
});

test('submit-signup verifies Turnstile when the secret is configured', async () => {
  process.env.SIGNUP_SUBMIT_MODE = 'sync';
  process.env.N8N_SIGNUP_WEBHOOK_URL = 'https://example.com/webhook';
  process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';

  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, options });

    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      assert.match(options.body, /secret=turnstile-secret/);
      assert.match(options.body, /response=token-123/);
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      };
    }

    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, results: [] })
    };
  };

  const req = createMockReq({
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json'
    },
    body: createValidPayload({ turnstileToken: 'token-123' })
  });
  const res = createMockRes();

  await submitSignup(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, 'https://example.com/webhook');
});

test('submit-signup blocks missing Turnstile tokens when verification is required', async () => {
  process.env.N8N_SIGNUP_WEBHOOK_URL = 'https://example.com/webhook';
  process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';

  const req = createMockReq({
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json'
    },
    body: createValidPayload()
  });
  const res = createMockRes();

  await submitSignup(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Bot verification is required.' });
});

test('submit-signup treats slow webhook confirmation as accepted', async () => {
  process.env.SIGNUP_SUBMIT_MODE = 'sync';
  process.env.N8N_SIGNUP_WEBHOOK_URL = 'https://example.com/webhook';

  global.fetch = async () => {
    const error = new Error('This operation was aborted');
    error.name = 'AbortError';
    throw error;
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

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.pending_confirmation, true);
  assert.equal(res.body.count, 1);
});

test('submit-signup returns immediately after queuing webhook forwarding', async () => {
  process.env.N8N_SIGNUP_WEBHOOK_URL = 'https://example.com/webhook';

  let forwardedRequest;
  let releaseFetch;
  const fetchCanFinish = new Promise((resolve) => {
    releaseFetch = resolve;
  });

  global.fetch = async (url, options) => {
    forwardedRequest = { url, options };
    await fetchCanFinish;
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, results: [] })
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

  assert.equal(res.statusCode, 202);
  assert.equal(res.body.success, true);
  assert.equal(res.body.accepted, true);
  assert.equal(res.body.pending_confirmation, true);
  assert.equal(forwardedRequest.url, 'https://example.com/webhook');
  assert.equal(JSON.parse(forwardedRequest.options.body).contacts[0].email, 'alex@example.com');

  releaseFetch();
});

test('normalizeSignupPayload accepts my_child dependent payloads', () => {
  const payload = createValidPayload({
    signup_type: 'my_child',
    contacts: [
      {
        role: 'dependent',
        firstName: 'Timothy',
        lastName: 'Sanders',
        dob: '06/27/2015',
        phone: '+19168860323',
        email: 'julian@example.com',
        classDay: 'Friday',
        classTime: '11:00 AM',
        selectedSlot: '2026-04-24T18:00:00.000Z',
        medicalNotes: 'Broken left pinky toe',
        experience: 'None',
        parent: {
          firstName: 'Julian',
          lastName: 'Sanders',
          phone: '+19168860323',
          email: 'julian@example.com'
        }
      }
    ]
  });

  const normalized = submitSignupPrivate.normalizeSignupPayload(payload);

  assert.equal(normalized.signup_type, 'my_child');
  assert.equal(normalized.contacts[0].role, 'dependent');
  assert.equal(normalized.contacts[0].selectedSlot, '2026-04-24T18:00:00.000Z');
  assert.equal(normalized.contacts[0].medicalNotes, 'Broken left pinky toe');
  assert.equal(normalized.contacts[0].experience, 'None');
  assert.equal(normalized.contacts[0].parent.firstName, 'Julian');
});

test('available-slots calendar mapping stays aligned with age boundaries', () => {
  assert.equal(availableSlots._private.getCalendarForAge(3).key, 'sprouts');
  assert.equal(availableSlots._private.getCalendarForAge(6).key, 'youth');
  assert.equal(availableSlots._private.getCalendarForAge(12).key, 'youth');
  assert.equal(availableSlots._private.getCalendarForAge(13).key, 'adult');
  assert.equal(availableSlots._private.getCalendarForAge(17).key, 'adult');
  assert.equal(availableSlots._private.getCalendarForAge(18).key, 'adult');
  assert.equal(availableSlots._private.getCalendarForAge(2), null);
});

test('available-slots uses the current calendar IDs by default', () => {
  assert.equal(availableSlots._private.getCalendarForAge(3).id, 'bd2gOYTWJQ8MbQ5eXeCr');
  assert.equal(availableSlots._private.getCalendarForAge(12).id, 'O7aMCGhEnCpYfOGpOsH4');
  assert.equal(availableSlots._private.getCalendarForAge(13).id, 'bdny8Ve5pWGgc8XCvlQH');
  assert.equal(availableSlots._private.getCalendarForAge(18).id, 'bdny8Ve5pWGgc8XCvlQH');
});

test('available-slots supports calendar ID environment overrides', () => {
  process.env.GHL_ADULT_CALENDAR_ID = 'adult-env-id';

  assert.equal(availableSlots._private.getCalendarForAge(18).id, 'adult-env-id');
});

test('available-slots converts GHL offset slot timestamps to UTC ISO values', () => {
  const calendar = availableSlots._private.getCalendarForAge(18);
  const result = availableSlots._private.transformSlotsResponse(calendar, {
    '2026-04-20': {
      slots: ['2026-04-20T06:30:00-07:00']
    }
  });

  assert.equal(result.days[0].slots[0].label, '6:30 AM');
  assert.equal(result.days[0].slots[0].value, '2026-04-20T13:30:00.000Z');
});

test('available-slots can match recreated calendars by configured names', () => {
  process.env.GHL_ADULT_CALENDAR_NAME = 'Adult Trial,Adults Trial Booking';

  const id = availableSlots._private.findMatchingCalendarId([
    { id: 'deleted-calendar', name: 'Adult Trial', deleted: true },
    { id: 'new-adult-calendar', name: 'Adults Trial Booking' }
  ], availableSlots._private.getCalendarForAge(18));

  assert.equal(id, 'new-adult-calendar');
});

test('available-slots caches duplicate calendar lookups inside the server runtime', async () => {
  const calendar = availableSlots._private.getCalendarForAge(18);
  let fetchCount = 0;

  global.fetch = async () => {
    fetchCount += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        '2026-04-20': {
          slots: ['2026-04-20T06:30:00-07:00']
        }
      })
    };
  };

  const first = await availableSlots._private.getCachedAvailableSlots(calendar, 'api-key', 1000);
  const second = await availableSlots._private.getCachedAvailableSlots(calendar, 'api-key', 1001);

  assert.deepEqual(second, first);
  assert.equal(fetchCount, 1);
});
