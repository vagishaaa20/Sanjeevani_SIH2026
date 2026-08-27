const { verifyAccessToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const header = req.get('authorization');
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

module.exports = authenticate;