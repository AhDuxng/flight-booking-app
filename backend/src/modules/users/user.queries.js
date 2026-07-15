import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';
import { randomUUID } from 'node:crypto';

const USER_COLUMNS = 'id, full_name, phone, avatar_url, date_of_birth, gender, nationality, passport_number, created_at, updated_at';
const AVATAR_BUCKET = 'avatars';
const AVATAR_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const findById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select(USER_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load user profile');
  return data;
};

export const upsert = async (payload) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'id' })
    .select(USER_COLUMNS)
    .single();

  throwDatabaseError(error, 'Unable to save user profile');
  return data;
};

export const update = async (id, payload) => {
  const { data, error } = await supabase
    .from('users')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(USER_COLUMNS)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to update user profile');
  return data;
};

export const uploadAvatar = async (userId, file) => {
  const extension = AVATAR_EXTENSIONS[file.mimetype];
  const path = `${userId}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file.buffer, {
      cacheControl: '31536000',
      contentType: file.mimetype,
      upsert: false,
    });

  throwDatabaseError(error, 'Unable to store avatar');
  return path;
};

export const createAvatarSignedUrl = async (path) => {
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, 15 * 60);

  throwDatabaseError(error, 'Unable to load avatar');
  return data.signedUrl;
};

export const removeAvatar = async (path) => {
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  throwDatabaseError(error, 'Unable to remove previous avatar');
};
