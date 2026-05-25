interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
interface SelectProps {
    options: SelectOption[];
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    'aria-label'?: string;
}
export declare function Select({ options, value, onValueChange, placeholder, disabled, error, 'aria-label': ariaLabel, }: SelectProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Select.d.ts.map