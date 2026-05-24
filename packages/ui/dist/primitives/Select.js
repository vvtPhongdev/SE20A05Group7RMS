import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as RadixSelect from '@radix-ui/react-select';
const triggerStyle = {
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
const contentStyle = {
    overflow: 'hidden',
    background: 'var(--wr-bg-surface)',
    borderRadius: 'var(--wr-radius-md)',
    border: '1px solid var(--wr-border-default)',
    boxShadow: 'var(--wr-shadow-lg)',
    zIndex: 'var(--wr-z-dropdown)',
};
const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--wr-space-2) var(--wr-space-3)',
    fontSize: 'var(--wr-text-base)',
    color: 'var(--wr-text-primary)',
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
};
export function Select({ options, value, onValueChange, placeholder = 'Select…', disabled, error, 'aria-label': ariaLabel, }) {
    return (_jsxs(RadixSelect.Root, { value: value, onValueChange: onValueChange, disabled: disabled, children: [_jsxs(RadixSelect.Trigger, { "aria-label": ariaLabel, style: {
                    ...triggerStyle,
                    ...(error ? { borderColor: 'var(--wr-error)' } : {}),
                    ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                }, children: [_jsx(RadixSelect.Value, { placeholder: placeholder }), _jsx(RadixSelect.Icon, { style: { marginLeft: 'var(--wr-space-2)', color: 'var(--wr-text-muted)' }, children: "\u25BE" })] }), _jsx(RadixSelect.Portal, { children: _jsx(RadixSelect.Content, { style: contentStyle, position: "popper", sideOffset: 4, children: _jsx(RadixSelect.Viewport, { style: { padding: 'var(--wr-space-1)' }, children: options.map((opt) => (_jsx(RadixSelect.Item, { value: opt.value, disabled: opt.disabled, style: {
                                ...itemStyle,
                                ...(opt.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                            }, children: _jsx(RadixSelect.ItemText, { children: opt.label }) }, opt.value))) }) }) })] }));
}
//# sourceMappingURL=Select.js.map