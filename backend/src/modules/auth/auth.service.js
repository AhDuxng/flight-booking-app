import supabase from '../../config/supabase.js';
import * as queries from './auth.queries.js';

export const signup = async (userData) => {
  // 1. Create auth user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: { role: 'user', full_name: userData.full_name }
  });

  if (authError) {
    throw authError;
  }

  const userId = authData.user.id;

  // 2. Create corresponding profile in public.users
  const profileData = {
    id: userId,
    full_name: userData.full_name || null,
    phone: userData.phone || null,
    date_of_birth: userData.date_of_birth || null,
    gender: userData.gender || null,
    nationality: userData.nationality || null,
    passport_number: userData.passport_number || null
  };

  const userProfile = await queries.createUserProfile(profileData);

  return {
    user: {
      id: userId,
      email: userData.email,
      role: 'user'
    },
    profile: userProfile
  };
};

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  const profile = await queries.getUserProfileById(data.user.id);

  return {
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at
    },
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || data.user.app_metadata?.role || 'user'
    },
    profile
  };
};
