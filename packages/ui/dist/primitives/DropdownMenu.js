import { jsx as _jsx } from "react/jsx-runtime";
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
const contentStyle = {
    minWidth: '180px',
    padding: 'var(--wr-space-1)',
    background: 'var(--wr-bg-surface)',
    border: '1px solid var(--wr-border-default)',
    borderRadius: 'var(--wr-radius-md)',
    boxShadow: 'var(--wr-shadow-lg)',
    zIndex: 'var(--wr-z-dropdown)',
};
const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--wr-space-2)',
    padding: 'var(--wr-space-2) var(--wr-space-3)',
    fontSize: 'var(--wr-text-base)',
    fontFamily: 'var(--wr-font-sans)',
    color: 'var(--wr-text-primary)',
    borderRadius: 'var(--wr-radius-sm)',
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
};
const separatorStyle = {
    height: '1px',
    margin: 'var(--wr-space-1) 0',
    background: 'var(--wr-border-subtle)',
};
const labelStyle = {
    padding: 'var(--wr-space-1) var(--wr-space-3)',
    fontSize: 'var(--wr-text-xs)',
    fontWeight: 500,
    color: 'var(--wr-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};
export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;
export function DropdownMenuContent({ children, style, ...props }) {
    return (_jsx(RadixDropdown.Portal, { children: _jsx(RadixDropdown.Content, { sideOffset: 4, style: { ...contentStyle, ...style }, ...props, children: children }) }));
}
export function DropdownMenuItem({ children, style, ...props }) {
    return (_jsx(RadixDropdown.Item, { style: { ...itemStyle, ...style }, ...props, children: children }));
}
export function DropdownMenuSeparator({ style, ...props }) {
    return _jsx(RadixDropdown.Separator, { style: { ...separatorStyle, ...style }, ...props });
}
export function DropdownMenuLabel({ children, style, ...props }) {
    return (_jsx(RadixDropdown.Label, { style: { ...labelStyle, ...style }, ...props, children: children }));
}
//# sourceMappingURL=DropdownMenu.js.map