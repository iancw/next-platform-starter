'use client';

import React, { useEffect, useMemo, useState } from "react";
import RecipeSettings from "./RecipeSettings";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AuthorSocialLinks from './AuthorSocialLinks';
import DeleteConfirmationModal from './DeleteConfirmationModal.jsx';
import { getRecipePreviewImage, SAMPLE_IMAGE_SELECTION } from '../lib/recipe-image-selection.js';
import { Badge } from './ui/badge.jsx';
import { Button, buttonVariants } from './ui/button.jsx';
import { Card, CardContent } from './ui/card.jsx';
import { Input } from './ui/input.jsx';
import { Textarea } from './ui/textarea.jsx';
import { cn } from '../lib/cn.js';

function isRedirectError(error) {
  if (!error || typeof error !== 'object') return false;
  return 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT');
}

export default function RecipeCard({
  recipe,
  isOwner = false,
  updateRecipeAction,
  deleteRecipeAction,
  onSavedChange,
  selectedImageOption = SAMPLE_IMAGE_SELECTION
}) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(recipe?.recipeName ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [updateError, setUpdateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecipeSaved, setIsRecipeSaved] = useState(Boolean(recipe?.isSaved));
  const [saveToggleError, setSaveToggleError] = useState('');
  const [isSaveTogglePending, setIsSaveTogglePending] = useState(false);

  const recipeName = recipe?.recipeName ?? '';
  const recipeDescription = recipe?.description ?? '';
  const canSaveRecipe = Number.isFinite(Number(recipe?.id));
  const viewerIsLoggedIn = Boolean(recipe?.viewerIsLoggedIn);

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

  useEffect(() => {
    setIsRecipeSaved(Boolean(recipe?.isSaved));
  }, [recipe?.isSaved, recipe?.id]);

  const previewImage = getRecipePreviewImage(recipe, selectedImageOption);

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

  const handleToggleSavedRecipe = async () => {
    if (!canSaveRecipe || isSaveTogglePending) return;

    setSaveToggleError('');
    setIsSaveTogglePending(true);

    try {
      const redirectTo = `${window.location.pathname}${window.location.search}`;
      const response = await fetch('/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipeId: Number(recipe?.id),
          redirectTo
        })
      });

      const body = await response.json().catch(() => ({}));

      if (response.status === 401 && body?.loginUrl) {
        router.push(body.loginUrl);
        return;
      }

      if (!response.ok) {
        throw new Error(body?.error || 'Failed to update saved recipe');
      }

      const nextSaved = Boolean(body?.isSaved);
      setIsRecipeSaved(nextSaved);
      if (typeof onSavedChange === 'function') {
        onSavedChange(recipe?.id, nextSaved);
      }
    } catch (err) {
      setSaveToggleError(err?.message || 'Failed to update saved recipe');
    } finally {
      setIsSaveTogglePending(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 items-start">
      {(canEdit || canDelete) && (
        <div className="flex flex-wrap gap-2 self-start">
          {editing && canEdit ? (
            <>
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {canEdit && (
                <Button type="button" onClick={handleStartEdit}>
                  Edit recipe
                </Button>
              )}
              {canDelete && (
                <Button type="button" variant="destructive" onClick={openDeleteModal}>
                  Delete recipe
                </Button>
              )}
            </>
          )}
        </div>
      )}
      <Card className="w-full overflow-hidden">
        <CardContent className="space-y-8 p-5 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Recipe</Badge>
                {recipe?.camera ? <Badge variant="outline">{recipe.camera}</Badge> : null}
                {recipe?.filmSimulation ? <Badge variant="outline">{recipe.filmSimulation}</Badge> : null}
              </div>
            {editing ? (
              <div className="flex items-start gap-3 flex-wrap rounded-2xl border border-border/70 bg-muted/35 p-4">
                <label className="flex min-w-[240px] flex-1 flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">Recipe name</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      className="min-w-[240px] flex-1"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSaving}
                      required
                    />
                    <button
                      type="button"
                      aria-label={isRecipeSaved ? 'Unsave recipe' : 'Save recipe'}
                      aria-pressed={isRecipeSaved}
                      className={cn(
                        'inline-flex h-11 w-11 items-center justify-center rounded-full border text-2xl leading-none transition-colors',
                        isRecipeSaved
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-primary'
                      )}
                      onClick={handleToggleSavedRecipe}
                      disabled={!canSaveRecipe || isSaveTogglePending}
                      title={
                        viewerIsLoggedIn
                          ? isRecipeSaved
                            ? 'Remove from saved recipes'
                            : 'Save recipe'
                          : 'Log in to save recipes'
                      }
                    >
                      <span aria-hidden="true">{isRecipeSaved ? '★' : '☆'}</span>
                    </button>
                  </div>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="m-0 text-3xl sm:text-4xl">
                  {recipeName}
                </h2>
                <button
                  type="button"
                  aria-label={isRecipeSaved ? 'Unsave recipe' : 'Save recipe'}
                  aria-pressed={isRecipeSaved}
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-full border text-2xl leading-none transition-colors',
                    isRecipeSaved
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-primary'
                  )}
                  onClick={handleToggleSavedRecipe}
                  disabled={!canSaveRecipe || isSaveTogglePending}
                  title={
                    viewerIsLoggedIn
                      ? isRecipeSaved
                        ? 'Remove from saved recipes'
                        : 'Save recipe'
                      : 'Log in to save recipes'
                  }
                >
                  <span aria-hidden="true">{isRecipeSaved ? '★' : '☆'}</span>
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
              <span>{recipe?.authorName}</span>
              <AuthorSocialLinks
                links={authorLinks}
                authorName={recipe?.authorName}
                iconClassName="text-muted-foreground transition-colors hover:text-foreground"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-col gap-3 xl:items-end xl:text-right">
              {slug ? (
                <a
                  href={oesHref}
                  download
                  className={buttonVariants({ className: 'no-underline' })}
                >
                  OM Workspace Batch Processing File
                </a>
              ) : null}
              {downloadImageHref && (
                <a
                  href={downloadImageHref}
                  download={slug || undefined}
                  className={buttonVariants({ variant: 'outline', className: 'no-underline' })}
                >
                  Download Recipe Image
                </a>
              )}
            </div>
          </div>
        </div>

        {updateError ? (
          <p className="text-sm text-destructive">{updateError}</p>
        ) : null}
        {saveToggleError ? (
          <p className="text-sm text-destructive">{saveToggleError}</p>
        ) : null}

        {(editing || recipeDescription || previewUrl) && (
          <div className="recipe-notes-image-row rounded-[1.5rem] border border-border/70 bg-muted/25 p-4 sm:p-5">
            {previewUrl && (
              <div className="flex flex-[0_0_auto] flex-col items-center">
                <Image
                  src={previewUrl}
                  alt="Lighthouse"
                  width={400}
                  height={300}
                  unoptimized
                  className="max-h-[300px] w-auto max-w-full rounded-xl border border-border/60 object-cover"
                />
              </div>
            )}
            {(editing || recipeDescription) && (
              <div className="mb-2 flex-1 px-0 py-2 sm:px-3">
                {editing ? (
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">Notes / description</span>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Optional notes..."
                      disabled={isSaving}
                    />
                  </label>
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{recipeDescription}</div>
                )}
              </div>
            )}
          </div>
        )}

        <RecipeSettings recipe={recipe} />

        {recipe.Links && Array.isArray(recipe.Links) && recipe.Links.length > 0 && (
          <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5">
            <strong className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Links</strong>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
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
        </CardContent>
      </Card>

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
