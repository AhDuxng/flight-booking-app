import * as authQueries from './auth.queries.js';

const toAuthResponse = (user, session) => {
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name ?? null,
      role: user.app_metadata?.role ?? 'user',
    },
    token: session?.access_token ?? null,
    expiresAt: session?.expires_at ?? null,
  };
};

export const register = async (payload) => {
  const { user, session } = await authQueries.signUp(payload);

  if (user) {
    await authQueries.createProfile(user.id, payload.fullName);
  }

  return toAuthResponse(user, session);
};

export const login = async (payload) => {
  const { user, session } = await authQueries.signIn(payload);
  await authQueries.createProfile(user.id, user.user_metadata?.full_name ?? null);
  return toAuthResponse(user, session);
};

export const logout = async (accessToken) => {
  return authQueries.signOut(accessToken);
};
