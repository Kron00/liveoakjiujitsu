const DEFAULT_WEBHOOK_URL = 'https://optyxai.app.n8n.cloud/webhook/448fa0dd-d010-4f63-a1dc-73e5e8cae387';

module.exports = function handler(req, res) {
  const payload = {
    webhookUrl: process.env.NEXT_PUBLIC_WEBHOOK_URL || DEFAULT_WEBHOOK_URL
  };

  const body = [
    'window.__LIVE_OAK_CONFIG__ = Object.assign({}, window.__LIVE_OAK_CONFIG__, ',
    JSON.stringify(payload).replace(/</g, '\\u003c'),
    ');'
  ].join('');

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(body);
};
