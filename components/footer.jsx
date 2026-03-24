import { Badge } from 'components/ui/badge';

export function Footer() {
    return (
        <footer className="pt-12 pb-10 sm:pt-16 sm:pb-14">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-3xl border border-border/70 bg-card/70 px-6 py-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                    <Badge variant="outline">OM Recipes</Badge>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                        A searchable OM System color recipe library with author samples, export files, and profile-backed uploads.
                    </p>
                </div>
                <p className="text-sm text-muted-foreground">Built for recipe discovery, comparison, and download.</p>
            </div>
        </footer>
    );
}
