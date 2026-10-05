import { v4 as uuidv4 } from 'uuid';
import { Email, User } from '../models';
import { ScheduleEmailRequest, EmailStatus } from '../types';
import { queueService } from './queueService';
import { elasticsearchService } from './elasticsearchService';
import { Op } from 'sequelize';

class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async scheduleEmails(userId: string, data: ScheduleEmailRequest) {
    const batchId = uuidv4();
    const scheduledAtBase = new Date(data.scheduledAt).getTime();
    const now = Date.now();
    
    const emailsToCreate = data.recipients.map((recipient, index) => {
      const delayMs = index * data.delayBetweenEmails;
      const scheduledAt = new Date(scheduledAtBase + delayMs);
      return {
        userId,
        senderEmail: data.senderEmail,
        recipientEmail: recipient.email,
        subject: data.subject,
        body: data.body,
        status: EmailStatus.scheduled,
        scheduledAt,
        batchId,
      };
    });

    const createdEmails = await Email.bulkCreate(emailsToCreate);
    const jobs = createdEmails.map((email) => {
      const scheduledTime = new Date(email.scheduledAt).getTime();
      const delayMs = Math.max(0, scheduledTime - now);
      return {
        emailId: email.id,
        delayMs,
        maxPerHour: data.maxPerHour,
      };
    });

    await queueService.addBulkEmailJobs(jobs);

    for (const email of createdEmails) {
      email.status = EmailStatus.queued;
      email.jobId = email.id;
      await email.save();
      await elasticsearchService.indexEmail(email);
    }

    return createdEmails;
  }

  public async getScheduledEmails(userId: string) {
    return await Email.findAll({
      where: {
        userId,
        status: {
          [Op.in]: [EmailStatus.scheduled, EmailStatus.queued, EmailStatus.rate_limited]
        }
      },
      order: [['scheduledAt', 'ASC']],
    });
  }

  public async getSentEmails(userId: string) {
    return await Email.findAll({
      where: {
        userId,
        status: {
          [Op.in]: [EmailStatus.sent, EmailStatus.failed]
        }
      },
      order: [['sentAt', 'DESC']],
    });
  }

  public async getEmailById(id: string) {
    return await Email.findByPk(id);
  }

  public async updateEmailStatus(id: string, status: EmailStatus, extra: any = {}) {
    await Email.update({ status, ...extra }, { where: { id } });
  }
}

export const emailService = EmailService.getInstance();
