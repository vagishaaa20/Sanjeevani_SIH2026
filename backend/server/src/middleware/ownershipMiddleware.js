function requireOwnership(getOwnerId) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    try {
      const ownerId = await getOwnerId(req);
      if (!ownerId || String(ownerId) !== String(req.user.id)) return res.status(403).json({ error: 'Resource access denied' });
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { requireOwnership };