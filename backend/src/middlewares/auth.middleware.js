import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // In Supabase, the user ID is 'sub'. 
    // Role is expected in user_metadata based on schema RLS: (auth.jwt() -> 'user_metadata' ->> 'role')
    const role = decoded.user_metadata?.role || decoded.app_metadata?.role || decoded.role || 'user';
    
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: role,
      decoded
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authorization token', error: error.message });
  }
};

export default authMiddleware;
