import { Worker } from 'bullmq';
import { env } from '../config/env';
import { bullMQRedisConnection } from '../config/redis';
import { Email } from '../models';
import { EmailStatus } from '../types';
import { rateLimiterService } from '../services/rateLimiter';
import { slackService } from '../services/slackService';
import { etherealService } from '../services/etherealService';
import { elasticsearchService } from '../services/elasticsearchService';
import { queueService } from '../services/queueService';

export const startWorker = () => {
  const worker = new Worker(
    'email-queue',
    async (job) => {
      const { emailId, maxPerHour } = job.data;
      const email = await Email.findByPk(emailId);

      if (!email || email.status === EmailStatus.sent) {
        return;
      }

      email.status = EmailStatus.sending;
      await email.save();

      const limit = maxPerHour || env.MAX_EMAILS_PER_HOUR;
      const rateLimitCheck = await rateLimiterService.checkAndIncrement(email.senderEmail, limit);

      if (!rateLimitCheck.allowed) {
        email.status = EmailStatus.rate_limited;
        await email.save();

        await slackService.notifyRateLimit(
          email.userId,
          email.senderEmail,
          rateLimitCheck.currentCount,
          limit
        );

        const jitter = Math.floor(Math.random() * 5000);
        await queueService.addEmailJob(emailId, rateLimitCheck.retryAfterMs + jitter, limit);
        return;
      }

      try {
        const result = await etherealService.sendEmail(
          email.senderEmail,
          email.recipientEmail,
          email.subject,
          email.body
        );

        email.status = EmailStatus.sent;
        email.sentAt = new Date();
        email.etherealUrl = result.previewUrl || null;
        await email.save();

        await elasticsearchService.indexEmail(email);
        console.log(`Email ${emailId} sent successfully. Preview URL: ${result.previewUrl}`);
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
    {
      connection: bullMQRedisConnection,
      concurrency: env.WORKER_CONCURRENCY,
    }
  );

  worker.on('failed', async (job, err) => {
    if (job && job.data.emailId) {
      const email = await Email.findByPk(job.data.emailId);
      if (email) {
        email.status = EmailStatus.failed;
        email.errorMessage = err.message;
        await email.save();
        await elasticsearchService.indexEmail(email);
      }
    }
  });

  return worker;
};
