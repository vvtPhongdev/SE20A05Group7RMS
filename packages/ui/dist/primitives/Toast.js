import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as RadixToast from '@radix-ui/react-toast';
const variantBorders = {
    default: 'var(--wr-border-default)',
    success: 'var(--wr-success-border)',
    warning: 'var(--wr-warning-border)',
    error: 'var(--wr-error-border)',
};
const variantAccents = {
    default: 'var(--wr-text-primary)',
    success: 'var(--wr-success)',
    warning: 'var(--wr-warning)',
    error: 'var(--wr-error)',
};
const rootStyle = {
    display: 'flex',
    gap: 'var(--wr-space-3)',
    padding: 'var(--wr-space-4)',
    background: 'var(--wr-bg-surface)',
    borderRadius: 'var(--wr-radius-md)',
    boxShadow: 'var(--wr-shadow-lg)',
    borderLeft: '3px solid',
};
const titleStyle = {
    fontSize: 'var(--wr-text-base)',
    fontWeight: 500,
    fontFamily: 'var(--wr-font-sans)',
    color: 'var(--wr-text-primary)',
};
const descStyle = {
    fontSize: 'var(--wr-text-sm)',
    fontFamily: 'var(--wr-font-sans)',
    color: 'var(--wr-text-secondary)',
    marginTop: 'var(--wr-space-1)',
};
const viewportStyle = {
    position: 'fixed',
    bottom: 'var(--wr-space-8)',
    right: 'var(--wr-space-8)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--wr-space-2)',
    width: '360px',
    maxWidth: '90vw',
    zIndex: 'var(--wr-z-toast)',
    listStyle: 'none',
    padding: 0,
    margin: 0,
    outline: 'none',
};
export function ToastProvider({ children }) {
    return (_jsxs(RadixToast.Provider, { swipeDirection: "right", children: [children, _jsx(RadixToast.Viewport, { style: viewportStyle })] }));
}
export function Toast({ open, onOpenChange, title, description, variant = 'default', duration = 5000, action, }) {
    return (_jsxs(RadixToast.Root, { open: open, onOpenChange: onOpenChange, duration: duration, style: {
            ...rootStyle,
            borderLeftColor: variantBorders[variant],
        }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx(RadixToast.Title, { style: { ...titleStyle, color: variantAccents[variant] }, children: title }), description && _jsx(RadixToast.Description, { style: descStyle, children: description })] }), action && _jsx(RadixToast.Action, { asChild: true, altText: "Action", children: action }), _jsx(RadixToast.Close, { "aria-label": "Dismiss", style: {
                    alignSelf: 'flex-start',
                    color: 'var(--wr-text-muted)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    padding: 0,
                }, children: "\u2715" })] }));
}
//# sourceMappingURL=Toast.js.map