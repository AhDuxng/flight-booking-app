import supabase from '../../config/supabase.js';

export const createReview = async (reviewData) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getReviewsByFlightId = async (flightId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:users(full_name, avatar_url)
    `)
    .eq('flight_id', flightId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
