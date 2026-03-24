import { cn } from 'lib/cn';

export function Card({ className, ...props }) {
    return (
        <div
            className={cn('rounded-2xl border border-border/80 bg-card text-card-foreground shadow-[0_16px_40px_-24px_rgba(29,41,36,0.45)]', className)}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }) {
    return <div className={cn('flex flex-col gap-2 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
    return <h3 className={cn('text-xl font-semibold tracking-tight text-foreground', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
    return <p className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
    return <div className={cn('px-6 pb-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
    return <div className={cn('flex items-center gap-3 px-6 pb-6', className)} {...props} />;
}
