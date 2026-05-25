import React from 'react';
import * as RadixToast from '@radix-ui/react-toast';

type ToastVariant = 'default' | 'success' | 'warning' | 'error';

interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode;
}

const variantBorders: Record<ToastVariant, string> = {
  default: 'var(--wr-border-default)',
  success: 'var(--wr-success-border)',
  warning: 'var(--wr-warning-border)',
  error: 'var(--wr-error-border)',
};

const variantAccents: Record<ToastVariant, string> = {
  default: 'var(--wr-text-primary)',
  success: 'var(--wr-success)',
  warning: 'var(--wr-warning)',
  error: 'var(--wr-error)',
};

const rootStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--wr-space-3)',
  padding: 'var(--wr-space-4)',
  background: 'var(--wr-bg-surface)',
  borderRadius: 'var(--wr-radius-md)',
  boxShadow: 'var(--wr-shadow-lg)',
  borderLeft: '3px solid',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-base)',
  fontWeight: 500,
  fontFamily: 'var(--wr-font-sans)',
  color: 'var(--wr-text-primary)',
};

const descStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  fontFamily: 'var(--wr-font-sans)',
  color: 'var(--wr-text-secondary)',
  marginTop: 'var(--wr-space-1)',
};

const viewportStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 'var(--wr-space-8)',
  right: 'var(--wr-space-8)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--wr-space-2)',
  width: '360px',
  maxWidth: '90vw',
  zIndex: 'var(--wr-z-toast)' as unknown as number,
  listStyle: 'none',
  padding: 0,
  margin: 0,
  outline: 'none',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <RadixToast.Provider swipeDirection="right">
      {children}
      <RadixToast.Viewport style={viewportStyle} />
    </RadixToast.Provider>
  );
}

export function Toast({
  open,
  onOpenChange,
  title,
  description,
  variant = 'default',
  duration = 5000,
  action,
}: ToastProps) {
  return (
    <RadixToast.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      style={{
        ...rootStyle,
        borderLeftColor: variantBorders[variant],
      }}
    >
      <div style={{ flex: 1 }}>
        <RadixToast.Title style={{ ...titleStyle, color: variantAccents[variant] }}>
          {title}
        </RadixToast.Title>
        {description && <RadixToast.Description style={descStyle}>{description}</RadixToast.Description>}
      </div>
      {action && <RadixToast.Action asChild altText="Action">{action}</RadixToast.Action>}
      <RadixToast.Close
        aria-label="Dismiss"
        style={{
          alignSelf: 'flex-start',
          color: 'var(--wr-text-muted)',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          padding: 0,
        }}
      >
        ✕
      </RadixToast.Close>
    </RadixToast.Root>
  );
}
