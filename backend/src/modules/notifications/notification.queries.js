import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const NOTIFICATION_COLUMNS = 'id, user_id, type, title, body, payload, read_at, created_at';

export const findByUserId = async (userId, from, to) => {
  const { data, error, count } = await supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS, { count: 'exact' })
    .eq('user_id', userId)
    .range(from, to)
    .order('created_at', { ascending: false });

  throwDatabaseError(error, 'Unable to load notifications');
  return { data, count };
};

export const insert = async (payload) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(payload)
    .select(NOTIFICATION_COLUMNS)
    .single();

  throwDatabaseError(error, 'Unable to create notification');
  return data;
};

export const markRead = async (notificationId, userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select(NOTIFICATION_COLUMNS)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to update notification');
  return data;
};

export const markAllRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  throwDatabaseError(error, 'Unable to update notifications');
};
