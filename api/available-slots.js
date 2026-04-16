const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const LOOKAHEAD_DAYS = 14;
const CALENDAR_TIMEZONE = 'America/Los_Angeles';

const CALENDARS = [
  {
    key: 'sprouts',
    label: 'Sprouts (Ages 3–5)',
    minAge: 3,
    maxAge: 5,
    id: 'AYvj0FnPIrV2tVHSnAfG'
  },
  {
    key: 'youth',
    label: 'Youth BJJ (Ages 6–17)',
    minAge: 6,
    maxAge: 17,
    id: 'FBZx2VkRCnSo30gRRwz8'
  },
  {
    key: 'adult',
    label: 'Adult BJJ (Ages 18+)',
    minAge: 18,
    maxAge: Infinity,
    id: 'BRchGSNTKsjodFsm8s5u'
  }
];

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

function getCalendarForAge(age) {
  for (const calendar of CALENDARS) {
    if (age >= calendar.minAge && age <= calendar.maxAge) {
      return calendar;
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
        slots: slots.map((slotValue) => ({
          label: timeFormatter.format(new Date(slotValue)),
          value: slotValue
        }))
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

async function fetchAvailableSlots(calendar, apiKey) {
  const startDate = Date.now();
  const endDate = startDate + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000;
  const url = new URL(`${GHL_BASE_URL}/calendars/${calendar.id}/free-slots`);

  url.searchParams.set('startDate', String(startDate));
  url.searchParams.set('endDate', String(endDate));
  url.searchParams.set('timezone', CALENDAR_TIMEZONE);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: '2021-04-15'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`GHL free-slots request failed with ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return response.json();
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const age = Number.parseInt(req.query.age, 10);
  if (Number.isNaN(age)) {
    return res.status(400).json({ error: 'Age is required and must be a number.' });
  }

  if (age < 3) {
    return res.status(400).json({ error: 'Participants must be at least 3 years old.' });
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
    const rawSlots = await fetchAvailableSlots(calendar, apiKey);
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=60');
    return res.status(200).json(transformSlotsResponse(calendar, rawSlots));
  } catch (error) {
    console.error('Failed to load available slots from GHL.', {
      calendarId: calendar.id,
      message: error && error.message,
      status: error && error.status,
      body: error && error.body
    });
    return res.status(502).json({ error: 'Failed to load class times.' });
  }
}

module.exports = handler;
module.exports._private = {
  CALENDARS,
  CALENDAR_TIMEZONE,
  getCalendarForAge,
  transformSlotsResponse
};
