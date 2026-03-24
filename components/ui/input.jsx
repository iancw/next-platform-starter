import { cn } from 'lib/cn';

export function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                'flex h-11 w-full min-w-0 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors',
                'placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        />
    );
}
