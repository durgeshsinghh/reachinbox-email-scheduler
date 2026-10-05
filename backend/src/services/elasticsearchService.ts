import { esClient } from '../config/elasticsearch';

export class ElasticsearchService {
  private static instance: ElasticsearchService;

  private constructor() {}

  public static getInstance(): ElasticsearchService {
    if (!ElasticsearchService.instance) {
      ElasticsearchService.instance = new ElasticsearchService();
    }
    return ElasticsearchService.instance;
  }

  public async createIndex() {
    try {
      const exists = await esClient.indices.exists({ index: 'emails' });
      if (!exists) {
        await esClient.indices.create({
          index: 'emails',
          body: {
            mappings: {
              properties: {
                recipientEmail: { type: 'keyword' },
                senderEmail: { type: 'keyword' },
                subject: { type: 'text' },
                body: { type: 'text' },
                status: { type: 'keyword' },
                scheduledAt: { type: 'date' },
                sentAt: { type: 'date' },
                userId: { type: 'keyword' },
              },
            },
          },
        });
      }
    } catch (error) {
      console.error('Elasticsearch index creation failed', error);
    }
  }

  public async indexEmail(email: any) {
    try {
      await esClient.index({
        index: 'emails',
        id: email.id,
        document: {
          recipientEmail: email.recipientEmail,
          senderEmail: email.senderEmail,
          subject: email.subject,
          body: email.body,
          status: email.status,
          scheduledAt: email.scheduledAt,
          sentAt: email.sentAt,
          userId: email.userId,
        },
      });
    } catch (error) {
      console.error('Failed to index email', error);
    }
  }

  public async searchEmails(query: string, userId: string) {
    try {
      const result = await esClient.search({
        index: 'emails',
        body: {
          query: {
            bool: {
              must: [
                { term: { userId } },
                {
                  multi_match: {
                    query,
                    fields: ['subject', 'body', 'recipientEmail', 'senderEmail'],
                  },
                },
              ],
            },
          },
        },
      });
      return result.hits.hits.map((h: any) => h._source);
    } catch (error) {
      console.error('Search failed', error);
      return [];
    }
  }
}

export const elasticsearchService = ElasticsearchService.getInstance();
