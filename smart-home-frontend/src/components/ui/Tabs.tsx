import React, { useState, ReactNode, ReactElement, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: ReactNode;
}

interface TabsListProps {
  className?: string;
  children: ReactNode;
  selected: string;
  setSelected: (value: string) => void;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: ReactNode;
  selected?: string;
  onClick?: () => void;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: ReactNode;
  selected?: string;
}

const Tabs: React.FC<TabsProps> = ({ value, onValueChange, className, children }) => {
  return (
    <div className={cn('tabs', className)} data-selected={value}>
      {React.Children.map(children, (child) =>
        isValidElement(child) && (child.type === TabsList || child.type === TabsContent)
          ? cloneElement(child as ReactElement<any>, { selected: value, setSelected: onValueChange })
          : child
      )}
    </div>
  );
};

const TabsList: React.FC<TabsListProps> = ({ className, children, selected, setSelected }) => (
  <div className={cn('tabs-list', className)}>
    {React.Children.map(children, (child) =>
      isValidElement(child) && child.type === TabsTrigger
        ? cloneElement(child as ReactElement<any>, {
            selected,
            onClick: () => setSelected(child.props.value),
          })
        : child
    )}
  </div>
);

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className, children, selected, onClick }) => (
  <button className={cn('tabs-trigger', className, { 'is-active': selected === value })} onClick={onClick}>
    {children}
  </button>
);

const TabsContent: React.FC<TabsContentProps> = ({ value, className, children, selected }) => (
  <div className={cn('tabs-content', className, { 'is-active': selected === value })}>
    {children}
  </div>
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
