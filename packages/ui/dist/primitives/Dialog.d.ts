import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
interface DialogProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}
export declare function Dialog({ children, open, onOpenChange }: DialogProps): import("react/jsx-runtime").JSX.Element;
export declare const DialogTrigger: React.ForwardRefExoticComponent<RadixDialog.DialogTriggerProps & React.RefAttributes<HTMLButtonElement>>;
interface DialogContentProps {
    children: React.ReactNode;
    title: string;
    description?: string;
    width?: string;
}
export declare function DialogContent({ children, title, description, width }: DialogContentProps): import("react/jsx-runtime").JSX.Element;
interface DrawerContentProps {
    children: React.ReactNode;
    title: string;
    description?: string;
    side?: 'right' | 'left';
    width?: string;
}
export declare function DrawerContent({ children, title, description, side, width, }: DrawerContentProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Dialog.d.ts.map