import { jsx as _jsx } from "react/jsx-runtime";
import * as RadixSeparator from '@radix-ui/react-separator';
export function Separator({ orientation = 'horizontal', decorative = true, style, className, }) {
    const baseStyle = orientation === 'horizontal'
        ? { height: '1px', width: '100%', background: 'var(--wr-border-subtle)' }
        : { width: '1px', height: '100%', background: 'var(--wr-border-subtle)' };
    return (_jsx(RadixSeparator.Root, { orientation: orientation, decorative: decorative, className: className, style: { ...baseStyle, ...style } }));
}
//# sourceMappingURL=Separator.js.map