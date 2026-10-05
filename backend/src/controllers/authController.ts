import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models';
import { AuthRequest } from '../types';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const authController = {
  googleLogin: async (req: AuthRequest, res: Response) => {
    try {
      const { credential } = req.body;
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload) {
        return res.status(400).json({ message: 'Invalid Google token' });
      }

      const { sub: googleId, email, name, picture: avatar } = payload;
      if (!email || !name) {
        return res.status(400).json({ message: 'Missing email or name from Google payload' });
      }

      let user = await User.findOne({ where: { googleId } });
      if (!user) {
        user = await User.create({
          googleId,
          email,
          name,
          avatar: avatar || null,
        });
      }

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user });
    } catch (error: any) {
      console.error('Google login error', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  getMe: async (req: AuthRequest, res: Response) => {
    res.json(req.user);
  },
};
