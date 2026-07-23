import * as userQueries from './user.queries.js';
import { createHttpError } from '../../utils/error.js';

const isAvatarStoragePath = (value, userId) => value?.startsWith(`${userId}/`);

const hasValidAvatarSignature = (file) => {
  const { buffer, mimetype } = file;
  const isJpeg =
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  return (
    (mimetype === 'image/jpeg' && isJpeg) ||
    (mimetype === 'image/png' && isPng) ||
    (mimetype === 'image/webp' && isWebp)
  );
};

const toProfile = async (profile, user) => {
  const avatarUrl = isAvatarStoragePath(profile.avatar_url, user.id)
    ? await userQueries.createAvatarSignedUrl(profile.avatar_url)
    : profile.avatar_url;

  return {
    ...profile,
    avatar_url: avatarUrl,
    email: user.email,
    role: user.app_metadata?.role ?? 'user',
  };
};

export const getMyProfile = async (user) => {
  let profile = await userQueries.findById(user.id);

  if (!profile) {
    profile = await userQueries.upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? null,
    });
  }

  return toProfile(profile, user);
};

export const updateMyProfile = async (user, payload) => {
  const profilePayload = {
    ...(payload.fullName !== undefined && { full_name: payload.fullName }),
    ...(payload.phone !== undefined && { phone: payload.phone }),
    ...(payload.dateOfBirth !== undefined && { date_of_birth: payload.dateOfBirth }),
    ...(payload.gender !== undefined && { gender: payload.gender }),
    ...(payload.nationality !== undefined && { nationality: payload.nationality }),
    ...(payload.passportNumber !== undefined && { passport_number: payload.passportNumber }),
  };
  const existing = await userQueries.findById(user.id);
  const profile = existing
    ? await userQueries.update(user.id, profilePayload)
    : await userQueries.upsert({ id: user.id, ...profilePayload });

  return toProfile(profile, user);
};

export const uploadMyAvatar = async (user, file) => {
  if (!file) {
    throw createHttpError(400, 'Avatar file is required');
  }

  if (!hasValidAvatarSignature(file)) {
    throw createHttpError(400, 'Avatar file content is invalid');
  }

  const existing = await userQueries.findById(user.id);
  const avatarPath = await userQueries.uploadAvatar(user.id, file);

  let profile;
  try {
    profile = existing
      ? await userQueries.update(user.id, { avatar_url: avatarPath })
      : await userQueries.upsert({ id: user.id, avatar_url: avatarPath });
  } catch (error) {
    await userQueries.removeAvatar(avatarPath).catch(() => {});
    throw error;
  }

  if (isAvatarStoragePath(existing?.avatar_url, user.id)) {
    await userQueries.removeAvatar(existing.avatar_url).catch(() => {});
  }

  return toProfile(profile, user);
};
