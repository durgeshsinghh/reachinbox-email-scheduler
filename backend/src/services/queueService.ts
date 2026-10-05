import { Queue } from 'bullmq';
import { bullMQRedisConnection } from '../config/redis';

class QueueService {
  private static instance: QueueService;
  private emailQueue: Queue;

  private constructor() {
    this.emailQueue = new Queue('email-queue', {
      connection: bullMQRedisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public async addEmailJob(emailId: string, delayMs: number, maxPerHour: number) {
    return this.emailQueue.add(
      'send-email',
      { emailId, maxPerHour },
      { delay: delayMs, jobId: emailId }
    );
  }

  public async addBulkEmailJobs(jobs: { emailId: string, delayMs: number, maxPerHour: number }[]) {
    return this.emailQueue.addBulk(
      jobs.map(job => ({
        name: 'send-email',
        data: { emailId: job.emailId, maxPerHour: job.maxPerHour },
        opts: { delay: job.delayMs, jobId: job.emailId }
      }))
    );
  }

  public getQueue() {
    return this.emailQueue;
  }
}

export const queueService = QueueService.getInstance();
