import supabase from '../../config/supabase.js';

export const getAdminLogs = async (limit, offset) => {
  const { data, error } = await supabase
    .from('admin_logs')
    .select(`
      *,
      admin:users(full_name)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

export const getDashboardStats = async () => {
  const { count: flightsCount } = await supabase.from('flights').select('*', { count: 'exact', head: true });
  const { count: bookingsCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
  const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  
  const { data: revenueData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'success');

  const totalRevenue = (revenueData || []).reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    flights: flightsCount || 0,
    bookings: bookingsCount || 0,
    users: usersCount || 0,
    revenue: totalRevenue
  };
};
export const createLog = async (logData) => {
  const { data, error } = await supabase
    .from('admin_logs')
    .insert(logData)
    .select()
    .single();
  if (error) throw error;
  return data;
};
