import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

const listStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid var(--wr-border-default)',
  gap: 0,
};

const triggerStyle: React.CSSProperties = {
  padding: 'var(--wr-space-2) var(--wr-space-4)',
  fontFamily: 'var(--wr-font-sans)',
  fontSize: 'var(--wr-text-base)',
  fontWeight: 500,
  color: 'var(--wr-text-secondary)',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  transition: 'color var(--wr-transition-fast), border-color var(--wr-transition-fast)',
  outline: 'none',
};

const contentStyle: React.CSSProperties = {
  padding: 'var(--wr-space-4) 0',
};

export function Tabs({ children, ...props }: RadixTabs.TabsProps) {
  return <RadixTabs.Root {...props}>{children}</RadixTabs.Root>;
}

export function TabsList({ children, style, ...props }: RadixTabs.TabsListProps) {
  return (
    <RadixTabs.List style={{ ...listStyle, ...style }} {...props}>
      {children}
    </RadixTabs.List>
  );
}

export function TabsTrigger({ children, style, ...props }: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger style={{ ...triggerStyle, ...style }} {...props}>
      {children}
    </RadixTabs.Trigger>
  );
}

export function TabsContent({ children, style, ...props }: RadixTabs.TabsContentProps) {
  return (
    <RadixTabs.Content style={{ ...contentStyle, ...style }} {...props}>
      {children}
    </RadixTabs.Content>
  );
}
