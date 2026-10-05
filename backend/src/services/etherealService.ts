import nodemailer from 'nodemailer';
import { etherealTransporter, createEtherealAccount } from '../config/ethereal';

export class EtherealService {
  private static instance: EtherealService;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {}

  public static getInstance(): EtherealService {
    if (!EtherealService.instance) {
      EtherealService.instance = new EtherealService();
    }
    return EtherealService.instance;
  }

  public async initialize() {
    await createEtherealAccount();
    this.transporter = etherealTransporter;
  }

  public async sendEmail(from: string, to: string, subject: string, body: string) {
    if (!this.transporter) throw new Error('Ethereal service not initialized');
    
    const info = await this.transporter.sendMail({
      from,
      to,
      subject,
      text: body,
      html: body,
    });

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  }
}

export const etherealService = EtherealService.getInstance();
