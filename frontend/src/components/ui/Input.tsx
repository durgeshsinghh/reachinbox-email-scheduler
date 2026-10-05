import { forwardRef, ReactNode } from 'react';
import { classNames } from '../../utils/helpers';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  textarea?: boolean;
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, icon, textarea, className, ...props }, ref) => {
    const Component = textarea ? 'textarea' : 'input';
    const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm';
    
    return (
      <div className={className}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <div className="relative rounded-md shadow-sm">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <Component
            ref={ref as any}
            className={classNames(
              baseClasses,
              icon ? 'pl-10' : '',
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300',
              textarea ? 'min-h-[100px]' : ''
            )}
            {...(props as any)}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
