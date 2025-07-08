import React from 'react';
import { cn } from '@/lib/utils';

interface AlertProps {
  variant?: 'default' | 'destructive';
  title: string;
  description: string;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'default', title, description }) => {
  const variantStyles = {
    default: 'bg-gray-800 text-white',
    destructive: 'bg-red-600 text-white',
  };

  return (
    <div className={cn('p-4 rounded-md', variantStyles[variant])}>
      <h5 className="font-bold mb-2">{title}</h5>
      <p>{description}</p>
    </div>
  );
};
