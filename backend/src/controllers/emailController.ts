import { Response } from 'express';
import { AuthRequest, ScheduleEmailRequest } from '../types';
import { emailService } from '../services/emailService';
import { parse } from 'csv-parse/sync';

export const emailController = {
  scheduleEmails: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      let data: ScheduleEmailRequest = req.body;
      
      if (req.file) {
        const csvData = req.file.buffer.toString('utf-8');
        const records = parse(csvData, { columns: true, skip_empty_lines: true });
        const recipients = records.map((record: any) => ({ email: record.email || record.Email }));
        data.recipients = recipients;
      }
      
      if (!data.recipients || data.recipients.length === 0) {
        return res.status(400).json({ message: 'No recipients provided' });
      }

      const createdEmails = await emailService.scheduleEmails(userId, data);
      res.status(201).json(createdEmails);
    } catch (error: any) {
      console.error('Schedule emails error', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  getScheduledEmails: async (req: AuthRequest, res: Response) => {
    try {
      const emails = await emailService.getScheduledEmails(req.user!.id);
      res.json(emails);
    } catch (error: any) {
      console.error('Get scheduled emails error', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  getSentEmails: async (req: AuthRequest, res: Response) => {
    try {
      const emails = await emailService.getSentEmails(req.user!.id);
      res.json(emails);
    } catch (error: any) {
      console.error('Get sent emails error', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
