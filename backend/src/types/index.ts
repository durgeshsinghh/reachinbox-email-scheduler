import { Request } from 'express';

export enum EmailStatus {
  scheduled = 'scheduled',
  queued = 'queued',
  sending = 'sending',
  sent = 'sent',
  failed = 'failed',
  rate_limited = 'rate_limited'
}

export interface EmailAttributes {
  id: string;
  userId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: Date;
  sentAt: Date | null;
  jobId: string | null;
  batchId: string | null;
  etherealUrl: string | null;
  errorMessage: string | null;
}

export interface UserAttributes {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}

export interface SlackIntegrationAttributes {
  id: string;
  userId: string;
  teamId: string;
  teamName: string;
  accessToken: string;
  webhookUrl: string | null;
  channelId: string;
  channelName: string;
}

export interface ScheduleEmailRequest {
  senderEmail: string;
  recipients: { email: string }[];
  subject: string;
  body: string;
  scheduledAt: string;
  delayBetweenEmails: number;
  maxPerHour: number;
}

export interface AuthRequest extends Request {
  user?: UserAttributes;
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  retryAfterMs: number;
}
