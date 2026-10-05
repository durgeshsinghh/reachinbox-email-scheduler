import { classNames, getStatusColor } from '../../utils/helpers';
import { EmailStatus } from '../../types';

export default function Badge({ status }: { status: EmailStatus }) {
  const colors = getStatusColor(status);
  
  return (
    <span className={classNames(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      colors.bg,
      colors.text
    )}>
      <span className={classNames('mr-1 h-1.5 w-1.5 rounded-full', colors.dot)} />
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
    </span>
  );
}
