import { Response } from 'express';
import { AuthRequest } from '../types';
import { elasticsearchService } from '../services/elasticsearchService';

export const searchController = {
  searchEmails: async (req: AuthRequest, res: Response) => {
    try {
      const q = req.query.q as string;
      if (!q) {
        return res.json([]);
      }
      const results = await elasticsearchService.searchEmails(q, req.user!.id);
      res.json(results);
    } catch (error: any) {
      console.error('Search error', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
