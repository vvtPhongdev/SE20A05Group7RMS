import { jsx as _jsx } from "react/jsx-runtime";
import * as RadixTabs from '@radix-ui/react-tabs';
const listStyle = {
    display: 'flex',
    borderBottom: '1px solid var(--wr-border-default)',
    gap: 0,
};
const triggerStyle = {
    padding: 'var(--wr-space-2) var(--wr-space-4)',
    fontFamily: 'var(--wr-font-sans)',
    fontSize: 'var(--wr-text-base)',
    fontWeight: 500,
    color: 'var(--wr-text-secondary)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'color var(--wr-transition-fast), border-color var(--wr-transition-fast)',
    outline: 'none',
};
const contentStyle = {
    padding: 'var(--wr-space-4) 0',
};
export function Tabs({ children, ...props }) {
    return _jsx(RadixTabs.Root, { ...props, children: children });
}
export function TabsList({ children, style, ...props }) {
    return (_jsx(RadixTabs.List, { style: { ...listStyle, ...style }, ...props, children: children }));
}
export function TabsTrigger({ children, style, ...props }) {
    return (_jsx(RadixTabs.Trigger, { style: { ...triggerStyle, ...style }, ...props, children: children }));
}
export function TabsContent({ children, style, ...props }) {
    return (_jsx(RadixTabs.Content, { style: { ...contentStyle, ...style }, ...props, children: children }));
}
//# sourceMappingURL=Tabs.js.map