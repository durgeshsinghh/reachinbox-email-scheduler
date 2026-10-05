import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';

import { env } from './config/env';
import { sequelize } from './models';
import { queueService } from './services/queueService';
import { startWorker } from './workers/emailWorker';
import { etherealService } from './services/etherealService';
import { elasticsearchService } from './services/elasticsearchService';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import emailRoutes from './routes/email';
import slackRoutes from './routes/slack';
import searchRoutes from './routes/search';

const app = express();

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api/search', searchRoutes);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(queueService.getQueue())],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
app.use(errorHandler);

const init = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced');

    await etherealService.initialize();
    console.log('Ethereal service initialized');

    await elasticsearchService.createIndex();
    console.log('Elasticsearch index initialized');

    startWorker();
    console.log('Email worker started');

    app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Initialization failed', error);
    process.exit(1);
  }
};

init();
