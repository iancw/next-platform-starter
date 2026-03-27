'use client';

import { useActionState } from 'react';
import { submitContactForm } from './actions.js';
import { Input } from 'components/ui/input';
import { Textarea } from 'components/ui/textarea';
import { Button } from 'components/ui/button';

export function ContactForm() {
    const [state, action, pending] = useActionState(submitContactForm, null);

    if (state?.success) {
        return (
            <p className="text-sm text-muted-foreground">
                Message sent — thanks for reaching out!
            </p>
        );
    }

    return (
        <form action={action} className="flex flex-col gap-3">
            <Input name="name" placeholder="Your name" required disabled={pending} />
            <Input name="email" type="email" placeholder="Your email" required disabled={pending} />
            <Textarea name="message" placeholder="Your message" required disabled={pending} />
            {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" disabled={pending}>
                {pending ? 'Sending…' : 'Send Message'}
            </Button>
        </form>
    );
}
