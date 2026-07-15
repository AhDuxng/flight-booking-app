import { createApp } from './app.js';
import { env } from './config/env.js';
import { startSeatHoldCleanupJob } from './jobs/seatHoldCleanup.job.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`);
  startSeatHoldCleanupJob();
});
