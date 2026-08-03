const getUserRoles = (user) => {
  const role = user?.app_metadata?.role;
  const roles = user?.app_metadata?.roles;

  if (Array.isArray(roles)) {
    return new Set(roles);
  }

  if (role) {
    return new Set([role]);
  }

  return new Set();
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = getUserRoles(req.user);
    const hasRequiredRole = roles.some((role) => userRoles.has(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
