'use client';

import React, { useMemo, useState } from 'react';

export default function DeleteConfirmationModal({
  open = false,
  title = 'Delete',
  description,
  confirmValue = '',
  confirmLabel = 'Confirmation text',
  confirmPlaceholder,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  error = '',
  isDeleting = false,
  onClose,
  onConfirm
}) {
  const [typedValue, setTypedValue] = useState('');

  const requiresConfirmation = Boolean(String(confirmValue ?? '').trim());
  const disableDelete = useMemo(() => {
    if (!requiresConfirmation) return false;
    return typedValue.trim() !== String(confirmValue).trim();
  }, [confirmValue, requiresConfirmation, typedValue]);

  if (!open) return null;

  const handleClose = () => {
    if (isDeleting) return;
    setTypedValue('');
    onClose?.();
  };

  const handleConfirm = async (event) => {
    event.preventDefault();
    if (isDeleting || disableDelete) return;
    await onConfirm?.(typedValue);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        padding: '1.5rem'
      }}
      role="presentation"
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
      >
        <h3
          id="delete-confirmation-title"
          style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 600 }}
        >
          {title}
        </h3>
        {description ? (
          <p style={{ marginBottom: '1rem', color: '#444' }}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p style={{ color: '#b91c1c', marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem' }}>{error}</p>
        ) : null}
        <form onSubmit={handleConfirm}>
          {requiresConfirmation ? (
            <label className="flex flex-col gap-1" style={{ marginBottom: '1rem' }}>
              <span className="text-sm text-gray-700">{confirmLabel}</span>
              <input
                className="input"
                value={typedValue}
                onChange={(event) => setTypedValue(event.target.value)}
                placeholder={confirmPlaceholder ?? String(confirmValue)}
                required
                disabled={isDeleting}
              />
            </label>
          ) : null}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-60"
              onClick={handleClose}
              disabled={isDeleting}
            >
              {cancelButtonText}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              disabled={disableDelete || isDeleting}
            >
              {isDeleting ? 'Deleting…' : confirmButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
