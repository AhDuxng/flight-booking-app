import supabase from '../../config/supabase.js';

export const createUserProfile = async (profile) => {
  const { data, error } = await supabase
    .from('users')
    .insert(profile)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  return data;
};

export const getUserProfileById = async (id) => {
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
