import * as authQueries from './auth.queries.js';
import { env } from '../../config/env.js';

const toAuthResponse = (user, session) => {
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name ?? null,
      role: user.app_metadata?.role ?? 'user',
    },
    token: session?.access_token ?? null,
    refreshToken: session?.refresh_token ?? null,
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

export const refreshSession = async (refreshToken) => {
  const { user, session } = await authQueries.refreshSession(refreshToken);
  await authQueries.createProfile(user.id, user.user_metadata?.full_name ?? null);
  return toAuthResponse(user, session);
};

export const requestPasswordReset = async (email) => {
  await authQueries.sendPasswordResetEmail(email, `${env.frontendUrl}/reset-password`);
};

export const resetPassword = async ({ accessToken, password }) => {
  await authQueries.updatePasswordWithRecoveryToken(accessToken, password);
};

export const getOAuthUrl = async (provider) => {
  return authQueries.createOAuthUrl(provider, `${env.frontendUrl}/auth/callback`);
};

export const getSession = async (user, accessToken) => {
  await authQueries.createProfile(user.id, user.user_metadata?.full_name ?? null);
  return toAuthResponse(user, { access_token: accessToken });
};

export const logout = async (accessToken) => {
  return authQueries.signOut(accessToken);
};
