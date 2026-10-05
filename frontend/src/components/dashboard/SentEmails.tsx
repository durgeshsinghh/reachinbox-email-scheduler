import Table from '../ui/Table';
import Badge from '../ui/Badge';
import { Email } from '../../types';
import { formatDate } from '../../utils/helpers';
import { CheckCircle } from 'lucide-react';

interface Props {
  emails: Email[];
  loading: boolean;
}

export default function SentEmails({ emails, loading }: Props) {
  const columns = [
    { header: 'Recipient', accessor: 'recipientEmail' as const },
    { header: 'Subject', accessor: 'subject' as const },
    { 
      header: 'Sent Time', 
      accessor: (email: Email) => email.sentAt ? formatDate(email.sentAt) : '-'
    },
    { 
      header: 'Status', 
      accessor: (email: Email) => <Badge status={email.status} />
    },
    {
      header: 'Preview',
      accessor: (email: Email) => email.etherealUrl ? (
        <a href={email.etherealUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">View</a>
      ) : '-'
    }
  ];

  return (
    <Table 
      columns={columns} 
      data={emails} 
      loading={loading}
      emptyMessage="No sent emails yet"
      emptyIcon={<CheckCircle size={24} />}
    />
  );
}
