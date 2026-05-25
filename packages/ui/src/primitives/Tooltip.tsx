import React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
}

const contentStyle: React.CSSProperties = {
  padding: 'var(--wr-space-1) var(--wr-space-2)',
  fontSize: 'var(--wr-text-sm)',
  fontFamily: 'var(--wr-font-sans)',
  color: 'var(--wr-text-inverse)',
  background: 'var(--wr-text-primary)',
  borderRadius: 'var(--wr-radius-sm)',
  boxShadow: 'var(--wr-shadow-md)',
  maxWidth: '280px',
  lineHeight: 'var(--wr-leading-normal)',
  zIndex: 'var(--wr-z-toast)' as unknown as number,
  animationDuration: '200ms',
};

const arrowStyle: React.CSSProperties = {
  fill: 'var(--wr-text-primary)',
};

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <RadixTooltip.Provider delayDuration={300}>{children}</RadixTooltip.Provider>;
}

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration,
}: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content side={side} align={align} sideOffset={4} style={contentStyle}>
          {content}
          <RadixTooltip.Arrow style={arrowStyle} width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
