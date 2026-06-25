import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import router from './routes/index.js';
import { env } from './config/env.js';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', router);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = status < 500 ? err.message : 'Internal server error';

    console.error(err);
    res.status(status).json({ error: message });
  });

  return app;
};