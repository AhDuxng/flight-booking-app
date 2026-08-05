const readJwtRole = (value) => {
  const parts = String(value ?? '').split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role ?? null;
  } catch {
    return null;
  }
};

export const isSupabaseServerKey = (value) => {
  const key = String(value ?? '').trim();
  if (key.startsWith('sb_secret_')) return true;
  if (key.startsWith('sb_publishable_')) return false;
  return readJwtRole(key) === 'service_role';
};
