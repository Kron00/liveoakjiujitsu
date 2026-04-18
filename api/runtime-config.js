module.exports = function handler(req, res) {
  const body = [
    'window.__LIVE_OAK_CONFIG__ = Object.assign({}, window.__LIVE_OAK_CONFIG__, ',
    JSON.stringify({}).replace(/</g, '\\u003c'),
    ');'
  ].join('');

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(body);
};
