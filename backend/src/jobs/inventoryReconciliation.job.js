import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { bumpCacheVersion } from '../config/cache.js';
import { logger } from '../utils/logger.js';

let timer;
let running = false;

const runOnce = async () => {
  if (running) return;
  running = true;
  try {
    const { data, error } = await supabase.rpc('reconcile_flight_inventory', {
      p_auto_repair: env.inventoryReconciliationAutoRepair,
      p_limit: 500,
    });
    if (error) throw error;
    if (Number(data?.mismatches) > 0) {
      logger.warn('inventory_mismatch', data);
      if (Number(data?.repairs) > 0) await bumpCacheVersion('flight-search');
    }
  } catch (error) {
    logger.error('inventory_reconciliation_failed', { error: error.message });
  } finally {
    running = false;
  }
};

export const startInventoryReconciliationJob = () => {
  if (env.nodeEnv === 'test' || timer) return;
  void runOnce();
  timer = setInterval(() => void runOnce(), env.inventoryReconciliationIntervalMs);
  timer.unref();
};
