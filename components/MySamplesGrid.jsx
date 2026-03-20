'use client';

import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DeleteConfirmationModal from './DeleteConfirmationModal.jsx';

export default function MySamplesGrid({ samples, deleteSampleAction }) {
  const router = useRouter();
  const [selectedSample, setSelectedSample] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeletePending, startDeleteTransition] = useTransition();

  const normalizedSamples = useMemo(
    () =>
      (samples ?? []).filter((sample) => sample?.image?.id && (sample.image.smallUrl || sample.image.fullSizeUrl)),
    [samples]
  );

  const openDeleteModal = (sample) => {
    setDeleteError('');
    setSelectedSample(sample);
  };

  const closeDeleteModal = () => {
    if (isDeletePending) return;
    setSelectedSample(null);
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!selectedSample?.recipeId || !selectedSample?.image?.id) return;

    startDeleteTransition(async () => {
      try {
        await deleteSampleAction({
          recipeId: selectedSample.recipeId,
          imageId: selectedSample.image.id
        });
        setSelectedSample(null);
        router.refresh();
      } catch (error) {
        setDeleteError(error?.message || 'Failed to delete sample image');
      }
    });
  };

  return (
    <>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
        {normalizedSamples.map((sample) => {
          const previewUrl = sample.image.smallUrl ?? sample.image.fullSizeUrl;
          const recipeHref = `/recipes/${encodeURIComponent(sample.recipeUuid ?? sample.recipeSlug)}`;
          return (
            <li key={`${sample.recipeId}:${sample.image.id}`} className="relative rounded-lg border border-gray-200 bg-gray-50 p-3">
              <button
                type="button"
                onClick={() => openDeleteModal(sample)}
                className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-lg leading-none text-white hover:bg-black/85 disabled:opacity-60"
                disabled={isDeletePending}
                aria-label="Delete sample image"
              >
                ×
              </button>
              <Link href={recipeHref} className="block">
                <img
                  src={previewUrl}
                  alt={sample.recipeName ? `${sample.recipeName} sample` : 'Sample image'}
                  className="mb-3 w-full rounded-md object-cover"
                  style={{ aspectRatio: '4 / 3' }}
                />
                <div className="text-sm text-gray-800">
                  <div className="font-semibold">{sample.recipeName}</div>
                  <div className="text-gray-600">{sample.recipeAuthorName}</div>
                  {(sample.image.camera || sample.image.lens) ? (
                    <div className="mt-1 text-xs text-gray-500">
                      {[sample.image.camera, sample.image.lens].filter(Boolean).join(' • ')}
                    </div>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <DeleteConfirmationModal
        key={selectedSample?.image?.id != null ? `my-sample-delete-${selectedSample.image.id}` : 'my-sample-delete-closed'}
        open={Boolean(selectedSample)}
        title="Delete sample image"
        description={`This will remove the sample image from "${selectedSample?.recipeName ?? 'this recipe'}". The underlying image file will also be deleted if it is no longer used anywhere else. Type the recipe name to confirm.`}
        confirmValue={selectedSample?.recipeName ?? ''}
        error={deleteError}
        isDeleting={isDeletePending}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
      />
    </>
  );
}
