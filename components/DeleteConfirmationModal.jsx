'use client';

import React, { useMemo, useState } from 'react';
import { Button } from 'components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from 'components/ui/dialog';
import { Input } from 'components/ui/input';

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
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? handleClose() : null)}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        <form onSubmit={handleConfirm} className="mt-5 space-y-5">
          {requiresConfirmation ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">{confirmLabel}</span>
              <Input
                value={typedValue}
                onChange={(event) => setTypedValue(event.target.value)}
                placeholder={confirmPlaceholder ?? String(confirmValue)}
                required
                disabled={isDeleting}
              />
            </label>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isDeleting}>
              {cancelButtonText}
            </Button>
            <Button type="submit" variant="destructive" disabled={disableDelete || isDeleting}>
              {isDeleting ? 'Deleting…' : confirmButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
