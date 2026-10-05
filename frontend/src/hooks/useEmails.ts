import { useState, useCallback } from 'react';
import { Email } from '../types';
import { emailsApi, searchApi } from '../services/api';
import { toast } from 'react-hot-toast';

export const useEmails = () => {
  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [searchResults, setSearchResults] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduled = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await emailsApi.getScheduled();
      setScheduledEmails(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch scheduled emails');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSent = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await emailsApi.getSent();
      setSentEmails(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch sent emails');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchEmails = useCallback(async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await searchApi.searchEmails(query);
      setSearchResults(data);
    } catch (err: any) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    scheduledEmails,
    sentEmails,
    searchResults,
    loading,
    error,
    fetchScheduled,
    fetchSent,
    searchEmails,
  };
};
