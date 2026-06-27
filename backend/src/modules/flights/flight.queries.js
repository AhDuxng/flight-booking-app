import supabase from '../../config/supabase.js';

export const getAirportIdByCodeOrId = async (codeOrId) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeOrId);
  if (isUuid) return codeOrId;

  const { data, error } = await supabase
    .from('airports')
    .select('id')
    .eq('code', codeOrId.toUpperCase())
    .single();

  if (error) return null;
  return data?.id || null;
};

export const searchFlights = async ({ originId, destinationId, departureDate, passengers }) => {
  const startOfDay = `${departureDate}T00:00:00.000Z`;
  const endOfDay = `${departureDate}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('flights')
    .select(`
      *,
      airline:airlines(id, name, code, logo_url),
      aircraft:aircrafts(id, model, code, total_seats),
      origin_airport:airports!origin_airport_id(id, name, city, country, code, timezone),
      destination_airport:airports!destination_airport_id(id, name, city, country, code, timezone)
    `)
    .eq('origin_airport_id', originId)
    .eq('destination_airport_id', destinationId)
    .gte('departure_time', startOfDay)
    .lte('departure_time', endOfDay)
    .gte('available_seats', passengers);

  if (error) throw error;
  return data;
};

export const getFlightById = async (id) => {
  const { data, error } = await supabase
    .from('flights')
    .select(`
      *,
      airline:airlines(id, name, code, logo_url),
      aircraft:aircrafts(id, model, code, total_seats),
      origin_airport:airports!origin_airport_id(id, name, city, country, code, timezone),
      destination_airport:airports!destination_airport_id(id, name, city, country, code, timezone)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};
