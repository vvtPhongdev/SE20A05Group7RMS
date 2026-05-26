import React from 'react';
import * as RadixScrollArea from '@radix-ui/react-scroll-area';

interface ScrollAreaProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  type?: 'auto' | 'always' | 'scroll' | 'hover';
}

const scrollbarStyle: React.CSSProperties = {
  display: 'flex',
  userSelect: 'none',
  touchAction: 'none',
  padding: '2px',
};

const thumbStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-full)',
  position: 'relative',
};

export function ScrollArea({ children, style, className, type = 'hover' }: ScrollAreaProps) {
  return (
    <RadixScrollArea.Root
      type={type}
      className={className}
      style={{ overflow: 'hidden', ...style }}
    >
      <RadixScrollArea.Viewport style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}>
        {children}
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        orientation="vertical"
        style={{ ...scrollbarStyle, width: '8px' }}
      >
        <RadixScrollArea.Thumb style={thumbStyle} />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Scrollbar
        orientation="horizontal"
        style={{ ...scrollbarStyle, height: '8px', flexDirection: 'column' }}
      >
        <RadixScrollArea.Thumb style={thumbStyle} />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  );
}
