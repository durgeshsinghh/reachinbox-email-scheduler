import { classNames } from '../../utils/helpers';

export default function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={classNames('inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] text-primary-600 motion-reduce:animate-[spin_1.5s_linear_infinite]', sizes[size], className)} />
  );
}
