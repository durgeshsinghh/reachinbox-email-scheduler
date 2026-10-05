export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export type EmailStatus = 'scheduled' | 'queued' | 'sending' | 'sent' | 'failed' | 'rate_limited';

export interface Email {
  id: string;
  userId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt?: string;
  jobId?: string;
  batchId?: string;
  etherealUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
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

export interface SlackStatus {
  connected: boolean;
  teamName?: string;
  channelName?: string;
}
