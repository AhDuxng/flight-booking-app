import { supabase } from '../config/supabase.js';

export const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const [scheme, token] = authorization.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  req.user = data.user;
  return next();
};