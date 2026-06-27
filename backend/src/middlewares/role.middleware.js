export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Authentication required' });
    }

    const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!rolesList.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

export const isAdmin = requireRole(['admin']);

export default requireRole;
