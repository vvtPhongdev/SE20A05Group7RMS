import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as RadixScrollArea from '@radix-ui/react-scroll-area';
const scrollbarStyle = {
    display: 'flex',
    userSelect: 'none',
    touchAction: 'none',
    padding: '2px',
};
const thumbStyle = {
    flex: 1,
    background: 'var(--wr-border-default)',
    borderRadius: 'var(--wr-radius-full)',
    position: 'relative',
};
export function ScrollArea({ children, style, className, type = 'hover' }) {
    return (_jsxs(RadixScrollArea.Root, { type: type, className: className, style: { overflow: 'hidden', ...style }, children: [_jsx(RadixScrollArea.Viewport, { style: { width: '100%', height: '100%', borderRadius: 'inherit' }, children: children }), _jsx(RadixScrollArea.Scrollbar, { orientation: "vertical", style: { ...scrollbarStyle, width: '8px' }, children: _jsx(RadixScrollArea.Thumb, { style: thumbStyle }) }), _jsx(RadixScrollArea.Scrollbar, { orientation: "horizontal", style: { ...scrollbarStyle, height: '8px', flexDirection: 'column' }, children: _jsx(RadixScrollArea.Thumb, { style: thumbStyle }) }), _jsx(RadixScrollArea.Corner, {})] }));
}
//# sourceMappingURL=ScrollArea.js.map