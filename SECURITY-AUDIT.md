# Security Audit Report

> Status note: This report predates the follow-up hardening work that moved signup
> submission behind `/api/submit-signup`, removed `/api/runtime-config.js`, and
> migrated static pages into Astro under `src/pages`. Keep the findings below as
> historical context, not a current-state assessment.

**Target:** Live Oak Jiu Jitsu Academy website  
**Repo:** `/Users/julian/Documents/Projects/Business/liveoakjiujitsu`  
**Audit date:** 2026-04-14  
**Audit scope:** Static pages, client-side signup flow, Vercel serverless endpoints, deployment headers, and live production behavior at `https://liveoakjiujitsu.vercel.app`

## Executive Summary

Overall risk is **moderate to high**.

The site is small and avoids some common problems: the GoHighLevel API key stays server-side, the slot lookup endpoint only allows `GET`, and production responses already include `HSTS`, `X-Frame-Options`, and `X-Content-Type-Options`.

The main weakness is the signup flow. The browser downloads a live n8n webhook URL from `/api/runtime-config.js` and then posts all signup data directly to that third-party endpoint, including names, DOBs, phone numbers, email addresses, and optional medical notes. That creates a public ingestion endpoint with no reliable place to enforce server-side validation, rate limiting, origin checks, spam controls, or audit logging under your control.

## Methodology

- Reviewed local source files: [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html), [api/runtime-config.js](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/api/runtime-config.js), [api/available-slots.js](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/api/available-slots.js), [vercel.json](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/vercel.json), [.gitignore](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/.gitignore), [.env.example](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/.env.example)
- Verified live response headers and runtime behavior with `curl` against production on 2026-04-14
- Traced how user-controlled data moves from form fields to outbound requests

## Positive Findings

- `GHL_API_KEY` is not exposed to the browser; it is only used server-side in [api/available-slots.js](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/api/available-slots.js:136).
- `/api/available-slots` rejects non-`GET` methods and returns `405` with `Allow: GET` in [api/available-slots.js](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/api/available-slots.js:116).
- Production responses currently include `Strict-Transport-Security`, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.
- User-facing success cards escape dynamic content before writing it with `innerHTML` in [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:1839).

## Findings

### 1. Public signup webhook is exposed to every visitor

**Severity:** High

The live webhook endpoint is embedded in the runtime config served to the browser:

- [api/runtime-config.js](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/api/runtime-config.js:1)
- [api/runtime-config.js](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/api/runtime-config.js:3)
- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:862)
- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:872)
- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:1686)
- [.env.example](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/.env.example:2)

Verified live response on 2026-04-14:

```javascript
window.__LIVE_OAK_CONFIG__ = Object.assign({}, window.__LIVE_OAK_CONFIG__, {"webhookUrl":"[redacted previously exposed webhook URL]"});
```

Impact:

- Anyone who can load the site can discover the webhook URL.
- Attackers can submit arbitrary payloads directly to the booking workflow.
- You cannot keep this endpoint secret once it is delivered to the browser.

Recommendation:

- Stop exposing the webhook to the client.
- Create a first-party submission endpoint such as `/api/submit-signup`.
- Store the n8n URL only in a server-side environment variable.
- Rotate the currently exposed n8n webhook after the proxy is in place.

### 2. Sensitive signup data is posted directly from the browser to a third party

**Severity:** High

The form collects contact data, dates of birth, and optional medical notes:

- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:610)
- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:618)
- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:689)
- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:787)

That data is assembled into JSON and sent directly to the webhook from the browser:

- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:1631)
- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:1647)
- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:1697)

Impact:

- No server-side validation under your control before third-party ingestion.
- No first-party audit trail for suspicious or abusive submissions.
- No controlled place to add signing, origin checks, IP throttling, or bot detection.
- Health-related notes are leaving the browser directly to third-party infrastructure.

Recommendation:

- Route submissions through a Vercel function you own.
- Validate required fields server-side and reject oversized payloads.
- Log minimal security metadata server-side for abuse monitoring.
- Review whether collecting medical notes at signup is necessary at this stage.

### 3. No abuse controls on signup submission flow

**Severity:** High

The current design provides no effective anti-automation control before a submission hits the third-party webhook. The only gating in the browser is UI validation and consent checkboxes:

- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:1665)
- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:1723)

Impact:

- Bot signups can flood n8n and downstream CRM systems.
- Checkbox-based consent can be trivially bypassed by direct POSTs.
- A public webhook URL plus no CAPTCHA/rate limit is a common spam target.

Recommendation:

- Add server-side rate limiting on the new `/api/submit-signup` endpoint.
- Add bot mitigation such as Cloudflare Turnstile or hCaptcha.
- Add a honeypot field as a low-cost secondary filter.
- Validate `Origin` and reject unexpected origins on the server-side proxy.

### 4. `/api/available-slots` can be abused to burn third-party API quota

**Severity:** Medium

The slot lookup endpoint is public and unauthenticated, and each request can trigger a GoHighLevel API call:

- [api/available-slots.js](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/api/available-slots.js:89)
- [api/available-slots.js](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/api/available-slots.js:98)
- [api/available-slots.js](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/api/available-slots.js:116)

Verified live behavior on 2026-04-14:

- `GET /api/available-slots?age=13` returns live class availability
- `POST /api/available-slots?age=13` correctly returns `405`

Impact:

- Attackers can repeatedly query the endpoint to drive GHL API traffic.
- Repeated abuse could degrade availability or exhaust third-party quotas.

Recommendation:

- Add per-IP rate limiting.
- Cache responses more aggressively for identical age buckets.
- Consider returning precomputed age-group schedules unless live availability is strictly required.

### 5. Content Security Policy is missing in the repo and absent in production responses

**Severity:** Medium

`vercel.json` only defines `X-Content-Type-Options` and `X-Frame-Options` for global responses:

- [vercel.json](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/vercel.json:41)

Verified live on 2026-04-14:

- `Content-Security-Policy` is absent on `/`
- `Content-Security-Policy` is absent on `/signup`
- `Content-Security-Policy` is absent on `/api/runtime-config.js`

This matters more because the site uses a large inline script block in [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:863).

Impact:

- Any future XSS bug would have no CSP backstop.
- The signup page handles sensitive user data, so XSS impact would be high.

Recommendation:

- Add a CSP in `vercel.json`.
- Longer term, move inline JS into external files and use nonces or hashes so you can avoid `'unsafe-inline'` for scripts.

Baseline starting point:

```text
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

If you keep posting directly to n8n, `connect-src` would also need the n8n origin, which is another reason to move submission server-side.

### 6. `Referrer-Policy` and `Permissions-Policy` are missing

**Severity:** Low

These headers are not defined in [vercel.json](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/vercel.json:5) and were absent in live responses on 2026-04-14.

Impact:

- Browsers will use default referrer behavior rather than an explicit privacy posture.
- Unused browser capabilities are not proactively restricted.

Recommendation:

- Add `Referrer-Policy: strict-origin-when-cross-origin`
- Add a restrictive `Permissions-Policy`, for example:

```text
camera=(), microphone=(), geolocation=()
```

### 7. `.gitignore` does not protect local secret files

**Severity:** Medium

The repo currently ignores `.vercel/` and `node_modules/`, but not `.env` files:

- [.gitignore](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/.gitignore:1)

This is relevant because the project expects secrets such as `GHL_API_KEY`:

- [.env.example](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/.env.example:1)

Impact:

- A developer can accidentally commit real environment files containing production secrets.

Recommendation:

Add:

```gitignore
.env
.env.*
!.env.example
```

## Priority Remediation Plan

1. Replace the direct browser-to-n8n submission with a Vercel API proxy and rotate the exposed webhook URL.
2. Add server-side validation, per-IP rate limiting, origin checks, and CAPTCHA/Turnstile on the new submission endpoint.
3. Add a CSP and explicit `Referrer-Policy` and `Permissions-Policy` headers in `vercel.json`.
4. Add `.env` protections to `.gitignore`.
5. Decide whether optional medical notes should be collected later in the intake flow instead of on the public signup page.

## Residual Notes

- `Strict-Transport-Security` is present in production even though it is not declared in `vercel.json`, which suggests it is currently platform-managed by Vercel.
- I did not send test signup payloads to the live webhook, because that would create fake records in a real downstream system.
