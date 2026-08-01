import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { bumpCacheVersion } from '../config/cache.js';

let running = false;

export const generateScheduledFlights = async () => {
  if (running) return 0;
  running = true;
  try {
    const { data, error } = await supabase.rpc('generate_scheduled_flights', {
      p_horizon_days: env.scheduleGenerationHorizonDays,
    });
    if (error) throw error;
    if (Number(data) > 0) await bumpCacheVersion('flight-search');
    return Number(data ?? 0);
  } finally {
    running = false;
  }
};

export const startScheduleGenerationJob = () => {
  generateScheduledFlights().catch((error) => console.error('Schedule generation failed', error));
  const timer = setInterval(() => {
    generateScheduledFlights().catch((error) => console.error('Schedule generation failed', error));
  }, env.scheduleGenerationIntervalMs);
  timer.unref?.();
  return timer;
};
