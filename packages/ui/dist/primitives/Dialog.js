import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as RadixDialog from '@radix-ui/react-dialog';
export function Dialog({ children, open, onOpenChange }) {
    return (_jsx(RadixDialog.Root, { open: open, onOpenChange: onOpenChange, children: children }));
}
export const DialogTrigger = RadixDialog.Trigger;
const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'var(--wr-bg-overlay)',
    zIndex: 'var(--wr-z-modal)',
    animation: 'fadeIn var(--wr-transition-normal)',
};
const contentBaseStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'var(--wr-bg-surface)',
    borderRadius: 'var(--wr-radius-lg)',
    boxShadow: 'var(--wr-shadow-overlay)',
    padding: 'var(--wr-space-6)',
    zIndex: 'var(--wr-z-modal)',
    maxHeight: '85vh',
    overflowY: 'auto',
    animation: 'dialogIn var(--wr-transition-normal)',
};
const titleStyle = {
    fontSize: 'var(--wr-text-xl)',
    fontWeight: 'var(--wr-font-semibold)',
    color: 'var(--wr-text-primary)',
    marginBottom: 'var(--wr-space-1)',
};
const descriptionStyle = {
    fontSize: 'var(--wr-text-sm)',
    color: 'var(--wr-text-secondary)',
    marginBottom: 'var(--wr-space-4)',
};
const closeStyle = {
    position: 'absolute',
    top: 'var(--wr-space-4)',
    right: 'var(--wr-space-4)',
    width: '28px',
    height: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--wr-radius-sm)',
    color: 'var(--wr-text-muted)',
    fontSize: '18px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
};
export function DialogContent({ children, title, description, width = '480px' }) {
    return (_jsxs(RadixDialog.Portal, { children: [_jsx(RadixDialog.Overlay, { style: overlayStyle }), _jsxs(RadixDialog.Content, { style: { ...contentBaseStyle, width, maxWidth: '90vw' }, children: [_jsx(RadixDialog.Title, { style: titleStyle, children: title }), description && (_jsx(RadixDialog.Description, { style: descriptionStyle, children: description })), children, _jsx(RadixDialog.Close, { asChild: true, children: _jsx("button", { "aria-label": "Close", style: closeStyle, children: "\u2715" }) })] })] }));
}
const drawerBaseStyle = {
    position: 'fixed',
    top: 0,
    bottom: 0,
    background: 'var(--wr-bg-surface)',
    boxShadow: 'var(--wr-shadow-overlay)',
    padding: 'var(--wr-space-6)',
    zIndex: 'var(--wr-z-modal)',
    overflowY: 'auto',
    animation: 'slideIn var(--wr-transition-slow)',
};
export function DrawerContent({ children, title, description, side = 'right', width = '420px', }) {
    const sideStyle = side === 'right' ? { right: 0, borderLeft: '1px solid var(--wr-border-default)' } : { left: 0, borderRight: '1px solid var(--wr-border-default)' };
    return (_jsxs(RadixDialog.Portal, { children: [_jsx(RadixDialog.Overlay, { style: overlayStyle }), _jsxs(RadixDialog.Content, { style: { ...drawerBaseStyle, ...sideStyle, width, maxWidth: '90vw' }, children: [_jsx(RadixDialog.Title, { style: titleStyle, children: title }), description && (_jsx(RadixDialog.Description, { style: descriptionStyle, children: description })), children, _jsx(RadixDialog.Close, { asChild: true, children: _jsx("button", { "aria-label": "Close", style: closeStyle, children: "\u2715" }) })] })] }));
}
//# sourceMappingURL=Dialog.js.map