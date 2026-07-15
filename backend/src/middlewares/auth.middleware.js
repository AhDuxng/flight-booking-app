import { supabase } from '../config/supabase.js';

export const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const parts = authorization.trim().split(/\s+/);
  const [scheme, token] = parts;

  if (parts.length !== 2 || scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    req.user = data.user;
    req.accessToken = token;
    return next();
  } catch (error) {
    return next(error);
  }
};
