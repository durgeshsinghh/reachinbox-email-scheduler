import Table from '../ui/Table';
import Badge from '../ui/Badge';
import { Email } from '../../types';
import { formatDate } from '../../utils/helpers';
import { Calendar } from 'lucide-react';

interface Props {
  emails: Email[];
  loading: boolean;
}

export default function ScheduledEmails({ emails, loading }: Props) {
  const columns = [
    { header: 'Recipient', accessor: 'recipientEmail' as const },
    { header: 'Subject', accessor: 'subject' as const },
    { 
      header: 'Scheduled Time', 
      accessor: (email: Email) => formatDate(email.scheduledAt)
    },
    { 
      header: 'Status', 
      accessor: (email: Email) => <Badge status={email.status} />
    }
  ];

  return (
    <Table 
      columns={columns} 
      data={emails} 
      loading={loading}
      emptyMessage="No scheduled emails"
      emptyIcon={<Calendar size={24} />}
    />
  );
}
