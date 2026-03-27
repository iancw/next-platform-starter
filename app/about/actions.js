'use server';

import { sendEmail } from 'lib/oci/emailDelivery.js';

const CONTACT_EMAIL = 'help@om-recipes.com';

export async function submitContactForm(_prevState, formData) {
    const name = formData.get('name')?.toString().trim() ?? '';
    const email = formData.get('email')?.toString().trim() ?? '';
    const message = formData.get('message')?.toString().trim() ?? '';

    if (!name || !email || !message) {
        return { error: 'All fields are required.' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: 'Please enter a valid email address.' };
    }

    if (message.length > 2000) {
        return { error: 'Message must be 2000 characters or fewer.' };
    }

    try {
        await sendEmail({
            to: CONTACT_EMAIL,
            subject: `Contact form message from ${name}`,
            text: `From: ${name} <${email}>\n\n${message}`,
            html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message.replace(/\n/g, '<br>')}</p>`
        });

        return { success: true };
    } catch (err) {
        console.error('Contact form email failed:', err);
        return { error: 'Failed to send your message. Please try again later.' };
    }
}
