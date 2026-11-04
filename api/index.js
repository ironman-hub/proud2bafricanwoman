// Vercel entry point: every /api/* request is handled by the Express app in server.js.
// The web pages themselves are served straight from the public/ folder by Vercel.
const app = require('../server.js');

module.exports = (req, res) => {
  // vercel.json rewrites /api/<route> to this function as /api?path=<route>; restore the original route for Express
  const u = new URL(req.url, 'http://localhost');
  const p = u.searchParams.get('path');
  u.searchParams.delete('path');
  if (!u.pathname.startsWith('/api/') && p != null) u.pathname = '/api/' + p;
  req.url = u.pathname + u.search;
  return app(req, res);
};
