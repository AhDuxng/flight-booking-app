import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import router from './routes/index.js';
import { env } from './config/env.js';
import { publicRateLimiter } from './middlewares/rateLimiter.middleware.js';

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return env.corsOrigins.includes(origin);
};

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');

  if (env.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(express.json({ limit: env.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: env.bodyLimit, parameterLimit: 50 }));
  app.use(cookieParser());

  if (env.nodeEnv !== 'production') {
    app.use(morgan('dev'));
  }

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', publicRateLimiter, router);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = status < 500 ? err.message : 'Internal server error';

    if (env.nodeEnv !== 'test') {
      console.error(err);
    }

    res.status(status).json({ error: message });
  });

  return app;
};
