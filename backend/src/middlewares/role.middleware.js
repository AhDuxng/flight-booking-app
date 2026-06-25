export const requireRole = (...role) => (req, res, next) => {
    const userRole = req.user?.user_metadata?.role;
    
    if (!role.includes(userRole)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
}