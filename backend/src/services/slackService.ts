import axios from 'axios';
import { SlackIntegration } from '../models';

class SlackService {
  private static instance: SlackService;

  private constructor() {}

  public static getInstance(): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService();
    }
    return SlackService.instance;
  }

  public async getIntegration(userId: string) {
    return await SlackIntegration.findOne({ where: { userId } });
  }

  public async sendMessage(accessToken: string, channelId: string, text: string) {
    try {
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel: channelId, text },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (error) {
      console.error('Failed to send Slack message', error);
    }
  }

  public async notifyRateLimit(userId: string, senderEmail: string, currentCount: number, limit: number) {
    try {
      const integration = await this.getIntegration(userId);
      if (!integration) return;

      const message = `:warning: Rate Limit Hit! Sender ${senderEmail} has reached ${currentCount}/${limit} emails this hour. Remaining emails have been rescheduled.`;
      await this.sendMessage(integration.accessToken, integration.channelId, message);
    } catch (error) {
      console.error('Failed to notify Slack', error);
    }
  }
}

export const slackService = SlackService.getInstance();
