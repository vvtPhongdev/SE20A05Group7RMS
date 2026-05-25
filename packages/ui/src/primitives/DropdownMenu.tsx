import React from 'react';
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';

const contentStyle: React.CSSProperties = {
  minWidth: '180px',
  padding: 'var(--wr-space-1)',
  background: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-md)',
  boxShadow: 'var(--wr-shadow-lg)',
  zIndex: 'var(--wr-z-dropdown)' as unknown as number,
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--wr-space-2)',
  padding: 'var(--wr-space-2) var(--wr-space-3)',
  fontSize: 'var(--wr-text-base)',
  fontFamily: 'var(--wr-font-sans)',
  color: 'var(--wr-text-primary)',
  borderRadius: 'var(--wr-radius-sm)',
  cursor: 'pointer',
  outline: 'none',
  userSelect: 'none',
};

const separatorStyle: React.CSSProperties = {
  height: '1px',
  margin: 'var(--wr-space-1) 0',
  background: 'var(--wr-border-subtle)',
};

const labelStyle: React.CSSProperties = {
  padding: 'var(--wr-space-1) var(--wr-space-3)',
  fontSize: 'var(--wr-text-xs)',
  fontWeight: 500,
  color: 'var(--wr-text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({
  children,
  style,
  ...props
}: RadixDropdown.DropdownMenuContentProps) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content sideOffset={4} style={{ ...contentStyle, ...style }} {...props}>
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  children,
  style,
  ...props
}: RadixDropdown.DropdownMenuItemProps) {
  return (
    <RadixDropdown.Item style={{ ...itemStyle, ...style }} {...props}>
      {children}
    </RadixDropdown.Item>
  );
}

export function DropdownMenuSeparator({ style, ...props }: RadixDropdown.DropdownMenuSeparatorProps) {
  return <RadixDropdown.Separator style={{ ...separatorStyle, ...style }} {...props} />;
}

export function DropdownMenuLabel({ children, style, ...props }: RadixDropdown.DropdownMenuLabelProps) {
  return (
    <RadixDropdown.Label style={{ ...labelStyle, ...style }} {...props}>
      {children}
    </RadixDropdown.Label>
  );
}
