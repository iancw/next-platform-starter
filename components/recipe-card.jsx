'use client';

import React, { useEffect, useMemo, useState } from "react";
import RecipeSettings from "./RecipeSettings";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AuthorSocialLinks from './AuthorSocialLinks';
import DeleteConfirmationModal from './DeleteConfirmationModal.jsx';

function isRedirectError(error) {
  if (!error || typeof error !== 'object') return false;
  return 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT');
}

export default function RecipeCard({ recipe, isOwner = false, updateRecipeAction, deleteRecipeAction }) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(recipe?.recipeName ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [updateError, setUpdateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const recipeName = recipe?.recipeName ?? '';
  const recipeDescription = recipe?.description ?? '';

  const canEdit = Boolean(isOwner && typeof updateRecipeAction === 'function');
  const canDelete = Boolean(isOwner && typeof deleteRecipeAction === 'function');

  useEffect(() => {
    if (!editing) {
      setName(recipeName);
      setDescription(recipeDescription);
    }
  }, [editing, recipeName, recipeDescription]);

  useEffect(() => {
    if (!canEdit && editing) {
      setEditing(false);
    }
  }, [canEdit, editing]);

  // Prefer sample images, then comparison images (fallback).
  const previewImage = recipe?.sampleImages?.[0] ?? recipe?.comparisonImages?.[0] ?? null;

  const downloadImageHref =
    previewImage?.fullSizeUrl ?? previewImage?.smallUrl ?? null;

  const previewUrl = previewImage?.smallUrl ?? previewImage?.fullSizeUrl ?? null;

  const slug = recipe?.slug ?? '';
  const oesHref = slug ? `/oes/${slug}.oes` : '#';

  const authorLinks = useMemo(() => {
    const social = recipe?.authorSocial ?? {};
    const fallback = {
      instagram: recipe?.instagramLink,
      flickr: recipe?.flickrLink,
      website: recipe?.website,
      kofi: recipe?.kofiLink
    };

    const pick = (key) => {
      const primary = typeof social?.[key] === 'string' ? social[key].trim() : '';
      if (primary) return primary;
      const secondary = typeof fallback?.[key] === 'string' ? fallback[key].trim() : '';
      return secondary;
    };

    const entries = [
      { key: 'instagram', label: 'Instagram', url: pick('instagram') },
      { key: 'flickr', label: 'Flickr', url: pick('flickr') },
      { key: 'website', label: 'Website', url: pick('website') },
      { key: 'kofi', label: 'Ko-fi', url: pick('kofi') }
    ];

    return entries.filter((entry) => Boolean(entry.url));
  }, [recipe?.authorSocial, recipe?.instagramLink, recipe?.flickrLink, recipe?.website, recipe?.kofiLink]);

  const handleStartEdit = () => {
    if (!canEdit) return;
    setUpdateError('');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (!canEdit) return;
    setEditing(false);
    setUpdateError('');
    setName(recipeName);
    setDescription(recipeDescription);
  };

  const handleSave = async () => {
    if (!canEdit || isSaving) return;

    if (!name.trim()) {
      setUpdateError('Recipe name is required');
      return;
    }

    setIsSaving(true);
    setUpdateError('');

    const formData = new FormData();
    formData.append('recipeId', String(recipe?.id));
    formData.append('recipeName', name);
    formData.append('description', description);

    try {
      await updateRecipeAction(formData);
      setEditing(false);
      router.refresh();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setUpdateError(err?.message || 'Failed to update recipe');
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = () => {
    if (!canDelete) return;
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeleteError('');
  };

  const handleDelete = async (typedValue) => {
    if (!canDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError('');

    const formData = new FormData();
    formData.append('recipeId', String(recipe?.id));
    formData.append('confirmName', typedValue);

    try {
      await deleteRecipeAction(formData);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setDeleteError(err?.message || 'Failed to delete recipe');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 items-start w-full">
      {(canEdit || canDelete) && (
        <div className="flex gap-2 flex-wrap self-start">
          {editing && canEdit ? (
            <>
              <button
                type="button"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleStartEdit}
                >
                  Edit recipe
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  onClick={openDeleteModal}
                >
                  Delete recipe
                </button>
              )}
            </>
          )}
        </div>
      )}
      <div
        className="recipe-card"
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "1rem",
          margin: "1rem 0",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          width: "100%"
        }}
      >
        <div
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:p-8 p-4"
        >
          <div className="flex-1 flex flex-col gap-3">
            {editing ? (
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-700">Recipe name</span>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </label>
            ) : (
              <h2 className="m-0 flex-1">
                {recipeName} ({recipe?.authorName})
              </h2>
            )}
            <div className="text-gray-600 flex items-center gap-2 flex-wrap">
              <span>{recipe?.authorName}</span>
              <AuthorSocialLinks links={authorLinks} authorName={recipe?.authorName} />
            </div>
          </div>

          <div className="flex flex-col gap-3 items-end">
            <div className="flex flex-col gap-3 sm:gap-3 justify-start md:justify-end items-end text-right">
              {slug ? (
                <a
                  href={oesHref}
                  download
                  style={{
                    display: "inline-block",
                    padding: "0.5rem 1rem",
                    background: "#0070f3",
                    color: "#fff",
                    borderRadius: "4px",
                    textDecoration: "none"
                  }}
                >
                  OM Workspace Batch Processing File
                </a>
              ) : null}
              {downloadImageHref && (
                <a
                  href={downloadImageHref}
                  download={slug || undefined}
                  style={{
                    display: "inline-block",
                    padding: "0.5rem 1rem",
                    background: "#0070f3",
                    color: "#fff",
                    borderRadius: "4px",
                    textDecoration: "none"
                  }}
                >
                  Download Recipe Image
                </a>
              )}
            </div>
          </div>
        </div>

        {updateError ? (
          <p className="text-sm text-red-600 sm:px-8 px-4">{updateError}</p>
        ) : null}

        {(editing || recipeDescription || previewUrl) && (
          <div className="recipe-notes-image-row">
            {previewUrl && (
              <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Image
                  src={previewUrl}
                  alt="Lighthouse"
                  width={400}
                  height={300}
                  unoptimized
                  style={{
                    borderRadius: "4px",
                    maxWidth: "100%",
                    maxHeight: "300px",
                    width: "auto",
                    height: "auto"
                  }}
                />
              </div>
            )}
            {(editing || recipeDescription) && (
              <div style={{ marginBottom: "0.5rem", flex: "1 1 0", padding: "2rem", width: "100%" }}>
                {editing ? (
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-700">Notes / description</span>
                    <textarea
                      className="input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Optional notes..."
                      disabled={isSaving}
                      style={{ width: "100%" }}
                    />
                  </label>
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {recipeDescription}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <RecipeSettings recipe={recipe} />

        {recipe.Links && Array.isArray(recipe.Links) && recipe.Links.length > 0 && (
          <div>
            <strong>Links:</strong>
            <ul style={{ marginTop: 0, listStyleType: "disc", paddingLeft: "1.25em" }}>
              {recipe.Links.map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          key={showDeleteModal ? `recipe-delete-${recipe?.id ?? 'open'}` : 'recipe-delete-closed'}
          open={showDeleteModal}
          title="Delete recipe"
          description={<>This will permanently delete <strong>{recipeName}</strong> and its associated samples. Type the recipe name to confirm.</>}
          confirmValue={recipeName}
          error={deleteError}
          isDeleting={isDeleting}
          onClose={closeDeleteModal}
          onConfirm={handleDelete}
        />
    )}
  </div>
  );
}
