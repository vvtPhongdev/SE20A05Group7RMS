import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as RadixTooltip from '@radix-ui/react-tooltip';
const contentStyle = {
    padding: 'var(--wr-space-1) var(--wr-space-2)',
    fontSize: 'var(--wr-text-sm)',
    fontFamily: 'var(--wr-font-sans)',
    color: 'var(--wr-text-inverse)',
    background: 'var(--wr-text-primary)',
    borderRadius: 'var(--wr-radius-sm)',
    boxShadow: 'var(--wr-shadow-md)',
    maxWidth: '280px',
    lineHeight: 'var(--wr-leading-normal)',
    zIndex: 'var(--wr-z-toast)',
    animationDuration: '200ms',
};
const arrowStyle = {
    fill: 'var(--wr-text-primary)',
};
export function TooltipProvider({ children }) {
    return _jsx(RadixTooltip.Provider, { delayDuration: 300, children: children });
}
export function Tooltip({ children, content, side = 'top', align = 'center', delayDuration, }) {
    return (_jsxs(RadixTooltip.Root, { delayDuration: delayDuration, children: [_jsx(RadixTooltip.Trigger, { asChild: true, children: children }), _jsx(RadixTooltip.Portal, { children: _jsxs(RadixTooltip.Content, { side: side, align: align, sideOffset: 4, style: contentStyle, children: [content, _jsx(RadixTooltip.Arrow, { style: arrowStyle, width: 10, height: 5 })] }) })] }));
}
//# sourceMappingURL=Tooltip.js.map