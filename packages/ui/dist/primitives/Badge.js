import { jsx as _jsx } from "react/jsx-runtime";
const variantStyles = {
    default: 'background: var(--badge-default, #374151); color: var(--badge-default-text, #f9fafb);',
    success: 'background: var(--badge-success, #065f46); color: var(--badge-success-text, #d1fae5);',
    warning: 'background: var(--badge-warning, #92400e); color: var(--badge-warning-text, #fef3c7);',
    danger: 'background: var(--badge-danger, #991b1b); color: var(--badge-danger-text, #fee2e2);',
    info: 'background: var(--badge-info, #1e40af); color: var(--badge-info-text, #dbeafe);',
};
export function Badge({ children, variant = 'default', className }) {
    return (_jsx("span", { className: className, style: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '1.5',
            ...parseInlineStyle(variantStyles[variant] ?? variantStyles.default),
        }, children: children }));
}
function parseInlineStyle(css) {
    const style = {};
    for (const rule of css.split(';')) {
        const parts = rule.split(':');
        const key = parts[0]?.trim();
        const value = parts.slice(1).join(':').trim();
        if (key && value) {
            const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            style[camelKey] = value;
        }
    }
    return style;
}
//# sourceMappingURL=Badge.js.map