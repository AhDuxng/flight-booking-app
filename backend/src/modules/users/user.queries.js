import supabase from '../../config/supabase.js';

export const getProfile = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data || null;
};

export const updateProfile = async (id, profileData) => {
  const { data, error } = await supabase
    .from('users')
    .update(profileData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};
