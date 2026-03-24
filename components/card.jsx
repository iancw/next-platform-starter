import {
    Card as UiCard,
    CardContent,
    CardHeader,
    CardTitle
} from 'components/ui/card';

export function Card({ title, children, className }) {
    return (
        <UiCard className={className}>
            {title ? (
                <CardHeader className="pb-4">
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
            ) : null}
            <CardContent className={title ? '' : 'pt-6'}>{children}</CardContent>
        </UiCard>
    );
}
