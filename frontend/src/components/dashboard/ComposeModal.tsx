import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { parseCSVEmails } from '../../utils/helpers';
import { emailsApi } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComposeModal({ isOpen, onClose, onSuccess }: Props) {
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [delay, setDelay] = useState(2);
  const [maxPerHour, setMaxPerHour] = useState(200);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const emails = await parseCSVEmails(file);
        setParsedEmails(emails);
        toast.success(`Found ${emails.length} emails in file`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to parse CSV');
      }
    }
  };

  const handleSubmit = async () => {
    let finalRecipients = parsedEmails;
    if (recipientsText) {
      const manualEmails = recipientsText.split(',').map(e => e.trim()).filter(Boolean);
      finalRecipients = [...new Set([...finalRecipients, ...manualEmails])];
    }

    if (!senderEmail || !subject || !body || !scheduledAt || finalRecipients.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await emailsApi.schedule({
        senderEmail,
        subject,
        body,
        scheduledAt: new Date(scheduledAt).toISOString(),
        recipients: finalRecipients.map(email => ({ email })),
        delayBetweenEmails: delay,
        maxPerHour
      });
      toast.success('Emails scheduled successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Emails" size="lg">
      <div className="space-y-4 mt-4">
        <Input label="Sender Email *" type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} />
        <Input label="Subject *" value={subject} onChange={e => setSubject(e.target.value)} />
        <Input label="Body *" textarea value={body} onChange={e => setBody(e.target.value)} />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipients (Upload CSV or manually enter)</label>
          <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 mb-2" />
          {parsedEmails.length > 0 && <p className="text-sm text-green-600 mb-2">{parsedEmails.length} emails detected from file</p>}
          <Input placeholder="Comma-separated emails" value={recipientsText} onChange={e => setRecipientsText(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Schedule Time *" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          <Input label="Delay (seconds)" type="number" min="1" value={delay} onChange={e => setDelay(Number(e.target.value))} />
          <Input label="Max Per Hour" type="number" min="1" value={maxPerHour} onChange={e => setMaxPerHour(Number(e.target.value))} />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Schedule</Button>
        </div>
      </div>
    </Modal>
  );
}
