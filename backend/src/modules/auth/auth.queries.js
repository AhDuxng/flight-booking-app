import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

export const signUp = async ({ email, password, fullName }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    const errorCode = error.code ?? error.error_code;
    const isRateLimited = errorCode === 'over_email_send_rate_limit';
    const isEmailProviderDisabled = errorCode === 'email_provider_disabled';

    throw Object.assign(
      new Error(
        isRateLimited
          ? 'Too many confirmation emails requested. Please try again later.'
          : isEmailProviderDisabled
            ? 'Đăng ký bằng email đang tạm thời không khả dụng.'
            : 'Unable to create account',
      ),
      { status: isRateLimited ? 429 : 400 },
    );
  }

  return data;
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const isEmailUnconfirmed = error.code === 'email_not_confirmed';

    throw Object.assign(
      new Error(isEmailUnconfirmed ? 'Vui lòng xác nhận email trước khi đăng nhập.' : 'Invalid email or password'),
      { status: isEmailUnconfirmed ? 403 : 401 },
    );
  }

  if (!data.session || !data.user) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  return data;
};

export const refreshSession = async (refreshToken) => {
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session || !data.user) {
    throw Object.assign(new Error('Session has expired. Please sign in again'), { status: 401 });
  }

  return data;
};

export const sendPasswordResetEmail = async (email, redirectTo) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    throw Object.assign(new Error('Unable to send password reset email'), { status: 400 });
  }
};

export const updatePasswordWithRecoveryToken = async (accessToken, password) => {
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw Object.assign(new Error('Password reset link is invalid or has expired'), { status: 401 });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, { password });

  if (updateError) {
    throw Object.assign(new Error('Unable to update password'), { status: 400 });
  }
};

export const createOAuthUrl = async (provider, redirectTo) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error || !data.url) {
    throw Object.assign(new Error(`Unable to start ${provider} sign in`), { status: 400 });
  }

  return data.url;
};

export const createProfile = async (id, fullName) => {
  const { error } = await supabase
    .from('users')
    .upsert({ id, full_name: fullName }, { onConflict: 'id', ignoreDuplicates: true });

  throwDatabaseError(error, 'Unable to create user profile');
};

export const signOut = async (accessToken) => {
  const { error } = await supabase.auth.admin.signOut(accessToken, 'local');

  if (error) {
    throw Object.assign(new Error('Unable to sign out'), { status: 400 });
  }
};
