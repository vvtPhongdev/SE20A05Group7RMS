import React from 'react';
import { Slot } from '@radix-ui/react-slot';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--wr-accent-primary)',
    color: 'var(--wr-accent-primary-text)',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--wr-accent-primary)',
    border: '1px solid var(--wr-border-default)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--wr-text-primary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--wr-error)',
    color: 'var(--wr-text-inverse)',
    border: '1px solid transparent',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: 'var(--wr-space-1) var(--wr-space-2)',
    fontSize: 'var(--wr-text-sm)',
    height: '28px',
  },
  md: {
    padding: 'var(--wr-space-2) var(--wr-space-4)',
    fontSize: 'var(--wr-text-base)',
    height: '36px',
  },
  lg: {
    padding: 'var(--wr-space-3) var(--wr-space-6)',
    fontSize: 'var(--wr-text-md)',
    height: '44px',
  },
};

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--wr-space-2)',
  borderRadius: 'var(--wr-radius-md)',
  fontFamily: 'var(--wr-font-sans)',
  fontWeight: 500,
  lineHeight: 1,
  cursor: 'pointer',
  transition: 'background var(--wr-transition-fast), border-color var(--wr-transition-fast), opacity var(--wr-transition-fast)',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', asChild = false, style, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        disabled={disabled}
        style={{
          ...baseStyle,
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...(disabled ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
          ...style,
        }}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
