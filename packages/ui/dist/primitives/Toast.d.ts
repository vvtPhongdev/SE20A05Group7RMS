import React from 'react';
type ToastVariant = 'default' | 'success' | 'warning' | 'error';
interface ToastProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    variant?: ToastVariant;
    duration?: number;
    action?: React.ReactNode;
}
export declare function ToastProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function Toast({ open, onOpenChange, title, description, variant, duration, action, }: ToastProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Toast.d.ts.map