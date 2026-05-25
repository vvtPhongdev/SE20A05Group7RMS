import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

/* ─── Dialog ───────────────────────────────────────────────────── */

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
}

export const DialogTrigger = RadixDialog.Trigger;

interface DialogContentProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  width?: string;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'var(--wr-bg-overlay)',
  zIndex: 'var(--wr-z-modal)' as unknown as number,
  animation: 'fadeIn var(--wr-transition-normal)',
};

const contentBaseStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'var(--wr-bg-surface)',
  borderRadius: 'var(--wr-radius-lg)',
  boxShadow: 'var(--wr-shadow-overlay)',
  padding: 'var(--wr-space-6)',
  zIndex: 'var(--wr-z-modal)' as unknown as number,
  maxHeight: '85vh',
  overflowY: 'auto',
  animation: 'dialogIn var(--wr-transition-normal)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xl)',
  fontWeight: 'var(--wr-font-semibold)' as unknown as number,
  color: 'var(--wr-text-primary)',
  marginBottom: 'var(--wr-space-1)',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-secondary)',
  marginBottom: 'var(--wr-space-4)',
};

const closeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'var(--wr-space-4)',
  right: 'var(--wr-space-4)',
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--wr-radius-sm)',
  color: 'var(--wr-text-muted)',
  fontSize: '18px',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
};

export function DialogContent({ children, title, description, width = '480px' }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay style={overlayStyle} />
      <RadixDialog.Content style={{ ...contentBaseStyle, width, maxWidth: '90vw' }}>
        <RadixDialog.Title style={titleStyle}>{title}</RadixDialog.Title>
        {description && (
          <RadixDialog.Description style={descriptionStyle}>{description}</RadixDialog.Description>
        )}
        {children}
        <RadixDialog.Close asChild>
          <button aria-label="Close" style={closeStyle}>
            ✕
          </button>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

/* ─── Drawer (side-panel variant) ──────────────────────────────── */

interface DrawerContentProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  side?: 'right' | 'left';
  width?: string;
}

const drawerBaseStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  background: 'var(--wr-bg-surface)',
  boxShadow: 'var(--wr-shadow-overlay)',
  padding: 'var(--wr-space-6)',
  zIndex: 'var(--wr-z-modal)' as unknown as number,
  overflowY: 'auto',
  animation: 'slideIn var(--wr-transition-slow)',
};

export function DrawerContent({
  children,
  title,
  description,
  side = 'right',
  width = '420px',
}: DrawerContentProps) {
  const sideStyle: React.CSSProperties =
    side === 'right' ? { right: 0, borderLeft: '1px solid var(--wr-border-default)' } : { left: 0, borderRight: '1px solid var(--wr-border-default)' };

  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay style={overlayStyle} />
      <RadixDialog.Content style={{ ...drawerBaseStyle, ...sideStyle, width, maxWidth: '90vw' }}>
        <RadixDialog.Title style={titleStyle}>{title}</RadixDialog.Title>
        {description && (
          <RadixDialog.Description style={descriptionStyle}>{description}</RadixDialog.Description>
        )}
        {children}
        <RadixDialog.Close asChild>
          <button aria-label="Close" style={closeStyle}>
            ✕
          </button>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
