import React from 'react';
import * as RadixSeparator from '@radix-ui/react-separator';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function Separator({
  orientation = 'horizontal',
  decorative = true,
  style,
  className,
}: SeparatorProps) {
  const baseStyle: React.CSSProperties =
    orientation === 'horizontal'
      ? { height: '1px', width: '100%', background: 'var(--wr-border-subtle)' }
      : { width: '1px', height: '100%', background: 'var(--wr-border-subtle)' };

  return (
    <RadixSeparator.Root
      orientation={orientation}
      decorative={decorative}
      className={className}
      style={{ ...baseStyle, ...style }}
    />
  );
}
