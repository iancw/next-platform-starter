'use client';

import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

const FIELD_NAMES = ['name', 'instagramLink', 'flickrLink', 'website'];

function getValuesFromFormData(formData) {
    return {
        name: String(formData.get('name') ?? ''),
        instagramLink: String(formData.get('instagramLink') ?? ''),
        flickrLink: String(formData.get('flickrLink') ?? ''),
        website: String(formData.get('website') ?? '')
    };
}

function hasChanges(form, initialValues) {
    if (!form) return false;

    const values = getValuesFromFormData(new FormData(form));
    return FIELD_NAMES.some((name) => values[name] !== initialValues[name]);
}

function ProfileSubmitButton({ isDirty }) {
    const { pending } = useFormStatus();

    return (
        <button type="submit" className="btn" disabled={!isDirty || pending}>
            {pending ? 'Saving...' : 'Update profile'}
        </button>
    );
}

export function ProfileForm({ action, initialValues }) {
    const formRef = useRef(null);
    const [savedValues, setSavedValues] = useState(initialValues);
    const [isDirty, setIsDirty] = useState(false);

    const handleInput = () => {
        setIsDirty(hasChanges(formRef.current, savedValues));
    };

    const handleSubmit = async (formData) => {
        await action(formData);
        const nextSavedValues = getValuesFromFormData(formData);
        setSavedValues(nextSavedValues);
        setIsDirty(false);
    };

    return (
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4" onInput={handleInput}>
            <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-700">Display name</span>
                <input className="input" name="name" defaultValue={initialValues.name} required />
            </label>

            <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-700">Instagram link</span>
                <input
                    className="input"
                    name="instagramLink"
                    type="url"
                    defaultValue={initialValues.instagramLink}
                    placeholder="https://instagram.com/yourhandle"
                />
            </label>

            <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-700">Flickr link</span>
                <input
                    className="input"
                    name="flickrLink"
                    type="url"
                    defaultValue={initialValues.flickrLink}
                    placeholder="https://flickr.com/photos/..."
                />
            </label>

            <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-700">Website</span>
                <input
                    className="input"
                    name="website"
                    type="url"
                    defaultValue={initialValues.website}
                    placeholder="https://example.com"
                />
            </label>

            <div className="pt-2">
                <ProfileSubmitButton isDirty={isDirty} />
            </div>
        </form>
    );
}
