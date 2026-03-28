import * as RadixSelect from "@radix-ui/react-select";
import { cn } from "lib/cn";

export function Select({ children, ...props }) {
    return <RadixSelect.Root {...props}>{children}</RadixSelect.Root>;
}

export function SelectTrigger({ className, children, ...props }) {
    return (
        <RadixSelect.Trigger
            className={cn(
                "inline-flex items-center justify-between gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-foreground shadow-sm transition-colors",
                "hover:border-primary/35 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
                "data-[placeholder]:text-muted-foreground",
                "disabled:pointer-events-none disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <RadixSelect.Icon asChild>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 opacity-50"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </RadixSelect.Icon>
        </RadixSelect.Trigger>
    );
}

export function SelectValue({ ...props }) {
    return <RadixSelect.Value {...props} />;
}

export function SelectContent({ className, children, position = "popper", ...props }) {
    return (
        <RadixSelect.Portal>
            <RadixSelect.Content
                position={position}
                sideOffset={6}
                className={cn(
                    "relative z-50 min-w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)] overflow-y-auto rounded-lg border border-border bg-card text-foreground shadow-lg",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
                    className
                )}
                {...props}
            >
                <RadixSelect.Viewport className="flex flex-col gap-1 p-3">
                    {children}
                </RadixSelect.Viewport>
            </RadixSelect.Content>
        </RadixSelect.Portal>
    );
}

export function SelectItem({ className, children, ...props }) {
    return (
        <RadixSelect.Item
            className={cn(
                "flex w-full cursor-default select-none items-center gap-3 rounded-md py-3.5 px-4 text-sm outline-none",
                "focus:bg-accent/70 focus:text-foreground",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            {...props}
        >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                <RadixSelect.ItemIndicator>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                </RadixSelect.ItemIndicator>
            </span>
            <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
        </RadixSelect.Item>
    );
}
