import { createApp } from './app.js';
import { env } from './config/env.js';
import { startSeatHoldCleanupJob } from './jobs/seatHoldCleanup.job.js';
import { startScheduleGenerationJob } from './jobs/scheduleGeneration.job.js';
import { startOutboxJob } from './jobs/outbox.job.js';
import { startInventoryReconciliationJob } from './jobs/inventoryReconciliation.job.js';
import { startRefundReconciliationJob } from './jobs/refundReconciliation.job.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`);
  startSeatHoldCleanupJob();
  startScheduleGenerationJob();
  startOutboxJob();
  startInventoryReconciliationJob();
  startRefundReconciliationJob();
});
