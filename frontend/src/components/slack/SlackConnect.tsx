import { useState, useEffect } from 'react';
import { slackApi } from '../../services/api';
import { SlackStatus } from '../../types';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

export default function SlackConnect() {
  const [status, setStatus] = useState<SlackStatus>({ connected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await slackApi.getStatus();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/slack/connect', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error('Failed to connect Slack');
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Slack?')) {
      try {
        await slackApi.disconnect();
        setStatus({ connected: false });
        toast.success('Slack disconnected');
      } catch (err) {
        toast.error('Failed to disconnect');
      }
    }
  };

  if (loading) return null;

  if (status.connected) {
    return (
      <Button variant="secondary" size="sm" onClick={handleDisconnect} title="Click to disconnect">
        <span className="text-green-600 mr-2">✓</span>
        Connected to {status.teamName || 'Slack'}
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleConnect}>
      Connect Slack
    </Button>
  );
}
