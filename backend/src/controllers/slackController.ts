import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { SlackIntegration } from '../models';
import { AuthRequest } from '../types';

export const slackController = {
  connect: (req: AuthRequest, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const slackOAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${env.SLACK_CLIENT_ID}&redirect_uri=${env.SLACK_REDIRECT_URI}&scope=chat:write,channels:read&state=${token}`;
    res.json({ url: slackOAuthUrl });
  },

  callback: async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }

    try {
      const tokenResponse = await axios.post(
        'https://slack.com/api/oauth.v2.access',
        new URLSearchParams({
          client_id: env.SLACK_CLIENT_ID,
          client_secret: env.SLACK_CLIENT_SECRET,
          code: code as string,
          redirect_uri: env.SLACK_REDIRECT_URI,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const data = tokenResponse.data;
      if (!data.ok) {
        console.error('Slack OAuth Error', data);
        return res.redirect(`${env.FRONTEND_URL}/dashboard?slack=error`);
      }

      const decoded = jwt.verify(state as string, env.JWT_SECRET) as { userId: string };
      const userId = decoded.userId;

      await SlackIntegration.upsert({
        userId,
        teamId: data.team.id,
        teamName: data.team.name,
        accessToken: data.access_token,
        webhookUrl: data.incoming_webhook?.url || null,
        channelId: data.incoming_webhook?.channel_id || '',
        channelName: data.incoming_webhook?.channel || '',
      });

      res.redirect(`${env.FRONTEND_URL}/dashboard?slack=connected`);
    } catch (error: any) {
      console.error('Slack callback error', error);
      res.redirect(`${env.FRONTEND_URL}/dashboard?slack=error`);
    }
  },

  getStatus: async (req: AuthRequest, res: Response) => {
    try {
      const integration = await SlackIntegration.findOne({ where: { userId: req.user!.id } });
      if (integration) {
        res.json({ connected: true, teamName: integration.teamName, channelName: integration.channelName });
      } else {
        res.json({ connected: false });
      }
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  disconnect: async (req: AuthRequest, res: Response) => {
    try {
      await SlackIntegration.destroy({ where: { userId: req.user!.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
