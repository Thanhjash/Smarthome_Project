import React from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends React.HTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ className, children, ...props }) => {
  return (
    <label className={cn("block text-sm font-medium text-gray-700 dark:text-gray-300", className)} {...props}>
      {children}
    </label>
  );
};
