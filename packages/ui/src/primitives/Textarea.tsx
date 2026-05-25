import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const baseStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '80px',
  padding: 'var(--wr-space-2) var(--wr-space-3)',
  fontFamily: 'var(--wr-font-sans)',
  fontSize: 'var(--wr-text-base)',
  lineHeight: 'var(--wr-leading-relaxed)',
  color: 'var(--wr-text-primary)',
  background: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-md)',
  transition: 'border-color var(--wr-transition-fast), box-shadow var(--wr-transition-fast)',
  outline: 'none',
  resize: 'vertical',
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, style, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        style={{
          ...baseStyle,
          ...(error ? { borderColor: 'var(--wr-error)', boxShadow: '0 0 0 1px var(--wr-error)' } : {}),
          ...(props.disabled ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--wr-bg-elevated)' } : {}),
          ...style,
        }}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
