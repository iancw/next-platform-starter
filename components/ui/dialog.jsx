'use client';

import { createContext, useContext, useEffect, useId } from 'react';
import { cn } from 'lib/cn';

const DialogContext = createContext(null);

function useDialogContext() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('Dialog components must be used within <Dialog>.');
    }
    return context;
}

export function Dialog({ open = false, onOpenChange, children }) {
    const titleId = useId();
    const descriptionId = useId();

    return (
        <DialogContext.Provider
            value={{
                open,
                onOpenChange,
                titleId,
                descriptionId
            }}
        >
            {children}
        </DialogContext.Provider>
    );
}

export function DialogContent({ className, children }) {
    const { open, onOpenChange, titleId, descriptionId } = useDialogContext();

    useEffect(() => {
        if (!open) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onOpenChange?.(false);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onOpenChange, open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/45 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onOpenChange?.(false);
                }
            }}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className={cn(
                    'relative w-full max-w-2xl rounded-3xl border border-border/70 bg-card text-card-foreground shadow-2xl',
                    className
                )}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({ className, ...props }) {
    return <div className={cn('flex flex-col gap-2', className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
    const { titleId } = useDialogContext();
    return <h2 id={titleId} className={cn('text-xl font-semibold tracking-tight', className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
    const { descriptionId } = useDialogContext();
    return <p id={descriptionId} className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
    return <div className={cn('flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)} {...props} />;
}
