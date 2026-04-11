import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth.js';
import { warmImageResizeFunction } from '../../../lib/oci/functionsInvoke.js';

export async function POST() {
    try {
        await requireUser();
    } catch {
        return new NextResponse(null, { status: 401 });
    }

    try {
        await warmImageResizeFunction();
    } catch (err) {
        console.warn('Resize function warm-up failed', err);
    }

    return new NextResponse(null, { status: 204 });
}
