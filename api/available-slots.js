const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const LOOKAHEAD_DAYS = 14;
const CALENDAR_TIMEZONE = 'America/Los_Angeles';
const DEFAULT_GHL_LOCATION_ID = 'ziXPD2awZnjPEyrzGL7k';
const SLOT_CACHE_TTL_MS = 5 * 60 * 1000;
const { applyRateLimit, createTimeoutSignal } = require('./_lib/security');

const CALENDARS = [
  {
    key: 'sprouts',
    label: 'Sprouts (Ages 3 to 5)',
    minAge: 3,
    maxAge: 5,
    id: 'bd2gOYTWJQ8MbQ5eXeCr',
    idEnv: 'GHL_SPROUTS_CALENDAR_ID',
    nameEnv: 'GHL_SPROUTS_CALENDAR_NAME',
    names: ['Sprouts Trial', 'Sprouts BJJ Trial', 'Sprouts']
  },
  {
    key: 'youth',
    label: 'Youth BJJ (Ages 6 to 12)',
    minAge: 6,
    maxAge: 12,
    id: 'O7aMCGhEnCpYfOGpOsH4',
    idEnv: 'GHL_YOUTH_CALENDAR_ID',
    nameEnv: 'GHL_YOUTH_CALENDAR_NAME',
    names: ['Youth Trial', 'Youth BJJ Trial', 'Youth BJJ']
  },
  {
    key: 'adult',
    label: 'Adult/Teen BJJ (Ages 13+)',
    minAge: 13,
    maxAge: Infinity,
    id: 'bdny8Ve5pWGgc8XCvlQH',
    idEnv: 'GHL_ADULT_CALENDAR_ID',
    nameEnv: 'GHL_ADULT_CALENDAR_NAME',
    names: ['Adult Trial', 'Adult BJJ Trial', 'Adult BJJ', 'Adult/Teen Trial', 'Adult/Teen BJJ']
  }
];

const CALENDAR_ID_CACHE_KEY = '__LIVE_OAK_GHL_CALENDAR_ID_CACHE__';
const SLOT_CACHE_KEY = '__LIVE_OAK_GHL_SLOT_CACHE__';

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  timeZone: CALENDAR_TIMEZONE
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: CALENDAR_TIMEZONE
});

function readEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function splitEnvList(name) {
  const value = readEnv(name);
  return value
    ? value.split(',').map((entry) => entry.trim()).filter(Boolean)
    : [];
}

function getCalendarMatchNames(calendar) {
  return splitEnvList(calendar.nameEnv).concat(calendar.names);
}

function withRuntimeCalendarConfig(calendar) {
  return {
    ...calendar,
    id: readEnv(calendar.idEnv) || calendar.id,
    matchNames: getCalendarMatchNames(calendar)
  };
}

function getCalendarIdCache() {
  if (!globalThis[CALENDAR_ID_CACHE_KEY]) {
    globalThis[CALENDAR_ID_CACHE_KEY] = new Map();
  }

  return globalThis[CALENDAR_ID_CACHE_KEY];
}

function getSlotCache() {
  if (!globalThis[SLOT_CACHE_KEY]) {
    globalThis[SLOT_CACHE_KEY] = new Map();
  }

  return globalThis[SLOT_CACHE_KEY];
}

function getSlotCacheKey(calendar) {
  return `${calendar.key}:${calendar.id}:${LOOKAHEAD_DAYS}`;
}

function pruneSlotCache(now = Date.now()) {
  const cache = getSlotCache();

  for (const [key, entry] of cache.entries()) {
    if (!entry || entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

function normalizeCalendarName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function getCalendarObjectName(calendarObject) {
  return calendarObject && (
    calendarObject.name ||
    calendarObject.title ||
    calendarObject.calendarName ||
    calendarObject.eventTitle
  );
}

function getCalendarObjectId(calendarObject) {
  return calendarObject && (
    calendarObject.id ||
    calendarObject._id ||
    calendarObject.calendarId
  );
}

function isDeletedCalendarObject(calendarObject) {
  if (!calendarObject) return false;

  return Boolean(calendarObject.deleted || calendarObject.isDeleted) ||
    normalizeCalendarName(calendarObject.status) === 'deleted';
}

function extractCalendarList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const candidates = [
    payload.calendars,
    payload.data,
    payload.items,
    payload.results,
    payload.calendarList
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function findMatchingCalendarId(calendars, calendar) {
  const wantedNames = calendar.matchNames.map(normalizeCalendarName).filter(Boolean);

  for (const calendarObject of calendars) {
    if (isDeletedCalendarObject(calendarObject)) continue;

    const candidateName = normalizeCalendarName(getCalendarObjectName(calendarObject));
    const candidateId = getCalendarObjectId(calendarObject);
    if (!candidateName || !candidateId) continue;

    if (wantedNames.some((wantedName) => (
      candidateName === wantedName ||
      candidateName.includes(wantedName) ||
      wantedName.includes(candidateName)
    ))) {
      return candidateId;
    }
  }

  return '';
}

function getCalendarForAge(age) {
  for (const calendar of CALENDARS) {
    if (age >= calendar.minAge && age <= calendar.maxAge) {
      return withRuntimeCalendarConfig(calendar);
    }
  }

  return null;
}

function createDateFromKey(dateKey) {
  const parts = dateKey.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12));
}

function transformSlotsResponse(calendar, rawSlots) {
  const days = Object.keys(rawSlots)
    .filter((key) => key !== 'traceId')
    .sort()
    .map((dateKey) => {
      const value = rawSlots[dateKey];
      const slots = Array.isArray(value && value.slots) ? value.slots : [];
      const formattedDay = dayFormatter.format(createDateFromKey(dateKey));
      const dayName = formattedDay.split(',')[0];

      return {
        date: dateKey,
        dayName,
        label: formattedDay,
        shortLabel: formattedDay.replace(`${dayName}, `, ''),
        slots: slots.map((slotValue) => {
          const slotDate = new Date(slotValue);

          return {
            label: timeFormatter.format(slotDate),
            value: slotDate.toISOString()
          };
        })
      };
    })
    .filter((day) => day.slots.length > 0);

  return {
    calendarKey: calendar.key,
    calendarLabel: calendar.label,
    timezone: CALENDAR_TIMEZONE,
    days
  };
}

async function fetchJson(url, apiKey, timeoutMs) {
  const timeout = createTimeoutSignal(timeoutMs);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: '2021-04-15'
    },
    signal: timeout.signal
  }).finally(() => {
    timeout.clear();
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`GHL request failed with ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return response.json();
}

async function fetchCalendarList(apiKey) {
  const locationId = readEnv('GHL_LOCATION_ID') || DEFAULT_GHL_LOCATION_ID;
  const url = new URL(`${GHL_BASE_URL}/calendars/`);

  url.searchParams.set('locationId', locationId);

  return extractCalendarList(await fetchJson(url, apiKey, 8000));
}

async function resolveCalendarId(calendar, apiKey) {
  const cache = getCalendarIdCache();
  const cacheKey = calendar.key;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const calendars = await fetchCalendarList(apiKey);
  const calendarId = findMatchingCalendarId(calendars, calendar);

  if (calendarId) {
    cache.set(cacheKey, calendarId);
  }

  return calendarId;
}

function isDeletedCalendarError(error) {
  return error &&
    error.status === 400 &&
    typeof error.body === 'string' &&
    /calendar is deleted/i.test(error.body);
}

async function fetchCalendarSlots(calendar, apiKey) {
  const startDate = Date.now();
  const endDate = startDate + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000;
  const url = new URL(`${GHL_BASE_URL}/calendars/${calendar.id}/free-slots`);

  url.searchParams.set('startDate', String(startDate));
  url.searchParams.set('endDate', String(endDate));
  url.searchParams.set('timezone', CALENDAR_TIMEZONE);

  return fetchJson(url, apiKey, 8000);
}

async function fetchAvailableSlots(calendar, apiKey) {
  try {
    return await fetchCalendarSlots(calendar, apiKey);
  } catch (error) {
    if (!isDeletedCalendarError(error)) {
      throw error;
    }

    const resolvedCalendarId = await resolveCalendarId(calendar, apiKey);
    if (!resolvedCalendarId || resolvedCalendarId === calendar.id) {
      throw error;
    }

    return fetchCalendarSlots({ ...calendar, id: resolvedCalendarId }, apiKey);
  }
}

async function getCachedAvailableSlots(calendar, apiKey, now = Date.now()) {
  pruneSlotCache(now);

  const cache = getSlotCache();
  const cacheKey = getSlotCacheKey(calendar);
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = fetchAvailableSlots(calendar, apiKey).catch((error) => {
    cache.delete(cacheKey);
    throw error;
  });

  cache.set(cacheKey, {
    expiresAt: now + SLOT_CACHE_TTL_MS,
    promise
  });

  return promise;
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!await applyRateLimit(req, res, {
    scope: 'available-slots',
    limit: 30,
    windowMs: 5 * 60 * 1000,
    message: 'Too many schedule lookups. Please wait a minute and try again.'
  })) {
    return;
  }

  const age = Number.parseInt(req.query.age, 10);
  if (Number.isNaN(age)) {
    return res.status(400).json({ error: 'Age is required and must be a number.' });
  }

  if (age < 3) {
    return res.status(400).json({ error: 'Participants must be at least 3 years old.' });
  }

  if (age > 120) {
    return res.status(400).json({ error: 'Age must be 120 or younger.' });
  }

  const calendar = getCalendarForAge(age);
  if (!calendar) {
    return res.status(400).json({ error: 'Unable to determine the calendar for that age.' });
  }

  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) {
    console.error('Missing GHL_API_KEY environment variable.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const rawSlots = await getCachedAvailableSlots(calendar, apiKey);
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(transformSlotsResponse(calendar, rawSlots));
  } catch (error) {
    console.error('Failed to load available slots from GHL.', {
      calendarId: calendar.id,
      calendarKey: calendar.key,
      calendarNameCandidates: calendar.matchNames,
      message: error && error.message,
      status: error && error.status
    });
    return res.status(502).json({ error: 'Failed to load class times.' });
  }
}

module.exports = handler;
module.exports._private = {
  CALENDARS,
  CALENDAR_TIMEZONE,
  DEFAULT_GHL_LOCATION_ID,
  SLOT_CACHE_TTL_MS,
  extractCalendarList,
  findMatchingCalendarId,
  getCalendarIdCache,
  getCalendarForAge,
  getCachedAvailableSlots,
  getSlotCache,
  transformSlotsResponse
};
