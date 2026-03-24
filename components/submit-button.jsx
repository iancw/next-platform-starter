'use client';

import { useFormStatus } from 'react-dom';
import { Button } from 'components/ui/button';

export function SubmitButton({ text = 'Submit' }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {text}
        </Button>
    );
}
