import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  'aria-label'?: string;
}

const triggerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  height: '36px',
  padding: 'var(--wr-space-2) var(--wr-space-3)',
  fontFamily: 'var(--wr-font-sans)',
  fontSize: 'var(--wr-text-base)',
  color: 'var(--wr-text-primary)',
  background: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-md)',
  cursor: 'pointer',
  outline: 'none',
  transition: 'border-color var(--wr-transition-fast)',
};

const contentStyle: React.CSSProperties = {
  overflow: 'hidden',
  background: 'var(--wr-bg-surface)',
  borderRadius: 'var(--wr-radius-md)',
  border: '1px solid var(--wr-border-default)',
  boxShadow: 'var(--wr-shadow-lg)',
  zIndex: 'var(--wr-z-dropdown)' as unknown as number,
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: 'var(--wr-space-2) var(--wr-space-3)',
  fontSize: 'var(--wr-text-base)',
  color: 'var(--wr-text-primary)',
  cursor: 'pointer',
  outline: 'none',
  userSelect: 'none',
};

export function Select({
  options,
  value,
  onValueChange,
  placeholder = 'Select…',
  disabled,
  error,
  'aria-label': ariaLabel,
}: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        style={{
          ...triggerStyle,
          ...(error ? { borderColor: 'var(--wr-error)' } : {}),
          ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        }}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon style={{ marginLeft: 'var(--wr-space-2)', color: 'var(--wr-text-muted)' }}>
          ▾
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content style={contentStyle} position="popper" sideOffset={4}>
          <RadixSelect.Viewport style={{ padding: 'var(--wr-space-1)' }}>
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                style={{
                  ...itemStyle,
                  ...(opt.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                }}
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
