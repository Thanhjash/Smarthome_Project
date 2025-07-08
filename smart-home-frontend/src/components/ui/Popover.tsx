import React from 'react';

interface PopoverProps {
  children: React.ReactNode;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
}

interface PopoverTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({ children }) => {
  return (
    <div className="relative">
      {children}
    </div>
  );
};

export const PopoverContent: React.FC<PopoverContentProps> = ({ children, className }) => {
  return (
    <div className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg ${className}`}>
      {children}
    </div>
  );
};

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
};
