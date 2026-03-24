import { cn } from 'lib/cn';

const variantClasses = {
    default: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/12 text-secondary',
    outline: 'border border-border bg-transparent text-muted-foreground'
};

export function Badge({ className, variant = 'default', ...props }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-[0.16em] uppercase',
                variantClasses[variant] ?? variantClasses.default,
                className
            )}
            {...props}
        />
    );
}
