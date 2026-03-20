'use client';
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  finalizeRecipeUploadAction,
  prepareRecipeUploadAction,
  findRecipeMatchAction,
  checkImageDuplicateAction
} from './actions';
import RecipeSettings from "components/RecipeSettings";
import { parseMetadata } from '@uswriting/exiftool';
import {parseRecipeSettingsFromExif} from 'lib/exifparse'
import { Alert } from 'components/alert';

export default function RecipeUpload({ initialAuthor = "" }) {
  const router = useRouter();
  const [author, setAuthor] = useState(initialAuthor);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState([""]);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [recipe, setRecipeDetails] = useState(null)
  const [exifError, setExifError] = useState("");
  const [isParsingExif, setIsParsingExif] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | ok | error
  const [uploadError, setUploadError] = useState('');
  const [uploadedSlug, setUploadedSlug] = useState('');
  const [uploadedRecipeUuid, setUploadedRecipeUuid] = useState('');
  const [uploadPhase, setUploadPhase] = useState(''); // preparing | direct-upload | finalizing
  const [matchingRecipe, setMatchingRecipe] = useState(null);
  const [matchError, setMatchError] = useState('');
  const [isCheckingMatch, setIsCheckingMatch] = useState(false);
  const [lastUploadMode, setLastUploadMode] = useState('create'); // create | attach
  const [imageHashHex, setImageHashHex] = useState('');
  const [hashError, setHashError] = useState('');
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');
  const [missingColorProfile, setMissingColorProfile] = useState(false);

  const hasDroppedImage = imageFiles?.length > 0;
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!imageFiles?.length) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFiles[0]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFiles]);

  useEffect(() => {
    if (!hasDroppedImage || !recipe) {
      if (!hasDroppedImage) {
        setMatchingRecipe(null);
        setMatchError('');
      } else {
        setMatchingRecipe(null);
      }
      setIsCheckingMatch(false);
      return;
    }
    let cancelled = false;
    setIsCheckingMatch(true);
    setMatchError('');

    findRecipeMatchAction({
      parameters: {
        recipeSettings: recipe
      }
    })
      .then((res) => {
        if (cancelled) return;
        if (!res?.ok) {
          setMatchError(res?.error || 'Failed to check for existing recipes');
          setMatchingRecipe(null);
          return;
        }
        setMatchingRecipe(res.match);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setMatchError(err?.message || 'Failed to check for existing recipes');
        setMatchingRecipe(null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsCheckingMatch(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasDroppedImage, recipe]);

  useEffect(() => {
    if (!imageHashHex) return;

    let cancelled = false;
    setIsCheckingDuplicate(true);
    setDuplicateError('');

    checkImageDuplicateAction({
      parameters: {
        sha256: imageHashHex
      }
    })
      .then((res) => {
        if (cancelled) return;
        if (!res?.ok) {
          setDuplicateMatch(null);
          setDuplicateError(res?.error || 'Failed to check for duplicate images.');
          return;
        }
        if (res.duplicate) {
          setDuplicateMatch(res.duplicate);
          const recipeLabel =
            res.duplicate.recipeName ||
            res.duplicate.recipeSlug ||
            res.duplicate.recipeUuid ||
            res.duplicate.recipeId ||
            '';
          const message = recipeLabel
            ? `This image already exists on the site for "${recipeLabel}". Please select another image.`
            : 'This image already exists on the site. Please select another image.';
          setDuplicateError(message);
        } else {
          setDuplicateMatch(null);
          setDuplicateError('');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setDuplicateMatch(null);
        setDuplicateError(err?.message || 'Failed to check for duplicate images.');
      })
      .finally(() => {
        if (cancelled) return;
        setIsCheckingDuplicate(false);
      });

    return () => {
      cancelled = true;
    };
  }, [imageHashHex]);

  const parseExif = async (file) => {
    const result = await parseMetadata(file)
    return parseRecipeSettingsFromExif(result.data)
  };

  const ensureImageHash = async (file) => {
    if (!file) {
      throw new Error('Missing image file');
    }
    if (imageHashHex) return imageHashHex;
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      throw new Error('Secure hashing is not supported in this browser');
    }
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setImageHashHex(hex);
      setHashError('');
      return hex;
    } catch (err) {
      const message = err?.message || 'Unable to fingerprint image';
      setImageHashHex('');
      setHashError(message);
      throw new Error(message);
    }
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles?.[0];
    setImageFiles(acceptedFiles);
    setExifError("");
    setIsParsingExif(true);
    setImageHashHex('');
    setHashError('');
    setDuplicateMatch(null);
    setDuplicateError('');
    setIsCheckingDuplicate(false);
    setMissingColorProfile(false);
    try {
      // Best-effort prefill of recipe name from filename.
      if (file && !name?.trim()) {
        const base = String(file.name || '').replace(/\.[a-z0-9]+$/i, '').trim();
        if (base) setName(base);
      }

      if (file) {
        await ensureImageHash(file);
      }

      const recipe = await parseExif(file);
      if (!recipe?.hasColorProfileSettings) {
        setRecipeDetails(null);
        setExifError('No recipe found. Upload straight out of camera JPGs from OM-3, Pen-F, or E-P7 cameras.');
        setMissingColorProfile(true);
        return;
      }
      setRecipeDetails(recipe);
      setExifError('');
      setMissingColorProfile(false);
    } catch (e) {
      console.error(e);
      setRecipeDetails(null);
      const message = e?.message || String(e);
      setExifError(`EXIF read error: ${message}`);
      setMissingColorProfile(false);
    } finally {
      setIsParsingExif(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFiles([]);
    setRecipeDetails(null);
    setExifError("");
    setIsParsingExif(false);
    setImageHashHex('');
    setHashError('');
    setDuplicateMatch(null);
    setDuplicateError('');
    setIsCheckingDuplicate(false);
    setMatchingRecipe(null);
    setMatchError('');
    setIsCheckingMatch(false);
    setUploadStatus('idle');
    setUploadError('');
    setUploadedSlug('');
    setUploadedRecipeUuid('');
    setUploadPhase('');
    setLastUploadMode('create');
    setMissingColorProfile(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": ['.jpg', '.jpeg']
    },
    multiple: false,
    onDrop
  });

  const dropzoneStyle = {
    border: "2px dashed #cccccc",
    padding: "20px",
    borderRadius: 8,
    textAlign: "center",
    background: isDragActive ? "#f0faff" : "#fafafa",
    cursor: "pointer",
    width: "400px",
    maxWidth: "100%",
    height: "300px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  };

  const layoutStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    alignItems: 'flex-start'
  };

  const infoPanelStyle = {
    border: "2px solid #cccccc",
    padding: "20px",
    borderRadius: 8,
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 420
  };

  const recipeCardStyle = {
    border: "2px solid #cccccc",
    padding: "20px",
    borderRadius: 8,
    textAlign: "center",
    background: "#fafafa",
    marginBottom: 16
  };

  const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
    fontWeight: 500,
    color: '#1f2937'
  };

  const labelTextStyle = {
    fontSize: 14,
    lineHeight: 1.4
  };

  const handleLinkChange = (idx, value) => {
    setLinks((prev) =>
      prev.map((link, i) => (i === idx ? value : link))
    );
  };

  const handleAddLink = () => {
    setLinks((prev) => [...prev, ""]);
  };

  const handleRemoveLink = (idx) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (event, options = {}) => {
    if (event?.preventDefault) event.preventDefault();
    const { attachToCommunity = false } = options;

    setUploadStatus('uploading');
    setUploadPhase('hashing');
    setUploadError('');
    setUploadedSlug('');
    setUploadedRecipeUuid('');
    setMatchError('');

    try {
      const file = imageFiles[0] || null;
      if (!file) throw new Error('Missing image file');
      if (duplicateMatch) {
        setUploadStatus('error');
        setUploadError('This image already exists on the site. Please select another image.');
        setUploadPhase('');
        return;
      }
      if (isCheckingDuplicate) {
        setUploadStatus('error');
        setUploadError('Still checking for duplicate images. Please wait a moment and try again.');
        setUploadPhase('');
        return;
      }

      const digest = await ensureImageHash(file);

      setUploadPhase('preparing');
      const prep = await prepareRecipeUploadAction({
        parameters: {
          author,
          name,
          notes,
          links: links.filter(Boolean),
          imageMeta: { name: file.name, type: file.type, size: file.size, sha256: digest },
          recipeSettings: recipe
        }
      });

      if (!prep?.ok) {
        setUploadStatus('error');
        setUploadError(prep?.error || 'Upload failed');
        setUploadPhase('');
        return;
      }

      if (!attachToCommunity && !prep.shouldCreateRecipe) {
        setUploadStatus('idle');
        setUploadPhase('');
        setMatchingRecipe((prev) => prev ?? prep.matchedRecipe ?? null);
        return;
      }

      // Direct-to-OCI upload via PAR
      setUploadPhase('direct-upload');
      const putRes = await fetch(prep.parUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });
      if (!putRes.ok) {
        throw new Error(`Direct upload failed: ${putRes.status}`);
      }

      // Finalize (server verifies object exists + updates DB)
      setUploadPhase('finalizing');
      const fin = await finalizeRecipeUploadAction({
        parameters: {
          recipeId: prep.recipeId,
          imageId: prep.imageId,
          authorId: prep.authorId,
          shouldCreateRecipe: prep.shouldCreateRecipe,
          objectKey: prep.objectKey,
          originalFileSize: file.size
        }
      });

      if (!fin?.ok) {
        setUploadStatus('error');
        setUploadError(fin?.error || 'Finalize failed');
        return;
      }

      if (prep.shouldCreateRecipe) {
        setMatchingRecipe(null);
      } else {
        setMatchingRecipe(prep.matchedRecipe ?? matchingRecipe);
      }
      setLastUploadMode(prep.shouldCreateRecipe ? 'create' : 'attach');
      setUploadStatus('ok');
      setUploadedSlug(prep.slug);
      setUploadedRecipeUuid(prep.recipeUuid || '');
      setUploadPhase('');
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
      setUploadError(err?.message || String(err));
      setUploadPhase('');
    }
  };

  useEffect(() => {
    if (uploadStatus !== 'ok') {
      hasRedirectedRef.current = false;
      return;
    }

    if (hasRedirectedRef.current) return;

    const recipeId =
      lastUploadMode === 'attach'
        ? (uploadedRecipeUuid || matchingRecipe?.uuid || matchingRecipe?.slug || uploadedSlug)
        : (uploadedRecipeUuid || uploadedSlug);

    if (!recipeId) return;

    hasRedirectedRef.current = true;
    router.push(`/recipes/${encodeURIComponent(recipeId)}`);
  }, [uploadStatus, uploadedSlug, uploadedRecipeUuid, matchingRecipe, lastUploadMode, router]);

  return (
    <div>
      <form className="recipe-upload-form">
        {hasDroppedImage && uploadStatus === 'ok' && (
          <div style={{ marginBottom: 12 }}>
            <Alert type="success">
              {lastUploadMode === 'attach' ? (() => {
                const matchId = matchingRecipe?.uuid ?? matchingRecipe?.slug ?? uploadedRecipeUuid ?? uploadedSlug;
                const linkHref = matchId ? `/recipes/${encodeURIComponent(matchId)}` : '/recipes';
                const linkLabel = matchingRecipe?.recipeName || matchId || 'View recipe';
                return (
                  <>
                    Image attached as a community sample for&nbsp;
                    <Link href={linkHref}>{linkLabel}</Link>.
                  </>
                );
              })() : (
                <>
                  Recipe uploaded!{' '}
                  {(uploadedRecipeUuid || uploadedSlug) ? (
                    <Link href={`/recipes/${encodeURIComponent(uploadedRecipeUuid || uploadedSlug)}`}>
                      View recipe
                    </Link>
                  ) : null}
                  {uploadedSlug ? (
                    <>
                      {' '}
                      (slug: <code>{uploadedSlug}</code>)
                    </>
                  ) : null}
                </>
              )}
            </Alert>
          </div>
        )}
        {hasDroppedImage && uploadStatus === 'error' && (
          <div style={{ marginBottom: 12 }}>
            <Alert type="error">Upload error: {uploadError}</Alert>
          </div>
        )}
        <div style={layoutStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: '1 1 360px', minWidth: 280 }}>
            <div style={labelStyle}>
              <span style={labelTextStyle}>Recipe Image</span>
              <div
                {...getRootProps()}
                style={dropzoneStyle}
                aria-label="Recipe image uploader"
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Drop the image here …</p>
                ) : (
                  <p>
                    {hasDroppedImage
                      ? `Selected: ${imageFiles[0].name}`
                      : "Drag 'n' drop an image here, or click to select one"}
                  </p>
                )}
                {hasDroppedImage && (
                  <div style={{ marginTop: 8, display: 'inline-block', position: 'relative' }}>
                    {!!previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, display: 'block' }}
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Remove photo"
                      title="Remove photo"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 22,
                        height: 22,
                        borderRadius: 9999,
                        border: '1px solid rgba(0,0,0,0.15)',
                        background: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        lineHeight: 1,
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {isParsingExif && <p>Reading EXIF…</p>}
                {uploadStatus === 'uploading' && uploadPhase === 'hashing' && (
                  <p>Computing image fingerprint…</p>
                )}
                {isCheckingDuplicate && (
                  <p>Checking for existing uploads…</p>
                )}
                {!!exifError && (
                  <p style={{ color: "#b91c1c", marginTop: 8 }}>
                    {exifError}
                  </p>
                )}
                {!!hashError && (
                  <p style={{ color: "#b91c1c", marginTop: 8 }}>
                    Fingerprint error: {hashError}
                  </p>
                )}
              </div>
            </div>
            {hasDroppedImage && isCheckingMatch && (
              <p style={{ color: "#4b5563" }}>Checking for existing recipes…</p>
            )}
            {hasDroppedImage && matchError && (
              <Alert type="error">{matchError}</Alert>
            )}
            {hasDroppedImage && !duplicateMatch && !!duplicateError && (
              <Alert type="error">{duplicateError}</Alert>
            )}
          </div>
          {hasDroppedImage && !missingColorProfile && (
            <div style={infoPanelStyle}>
              {matchingRecipe && (
                <>
                  <Alert>
                    {(() => {
                      const matchId = matchingRecipe.uuid ?? matchingRecipe.slug ?? '';
                      const linkHref = matchId ? `/recipes/${encodeURIComponent(matchId)}` : '/recipes';
                      const linkLabel = matchingRecipe.recipeName || matchId || 'View recipe';
                      return (
                        <>
                          We found an existing recipe with identical settings:&nbsp;
                          <Link href={linkHref}>
                            {linkLabel}
                          </Link>
                          {matchingRecipe.authorName ? ` by ${matchingRecipe.authorName}` : ''}.
                        </>
                      );
                    })()}
                  </Alert>
                  {!duplicateMatch && (
                    <>
                      <p style={{ color: "#374151", margin: 0 }}>
                        Continue below to attach your image as a community sample or choose a different photo.
                      </p>
                      <div style={{ display: "flex", gap: 12, flexWrap: 'wrap' }}>
                        <button
                          className="btn"
                          onClick={(event) => handleSubmit(event, { attachToCommunity: true })}
                          disabled={
                            uploadStatus === 'uploading' ||
                            isParsingExif ||
                            !recipe ||
                            !imageFiles?.length ||
                            isCheckingDuplicate
                          }
                          style={{ flex: '0 0 auto' }}
                        >
                          {uploadStatus === 'uploading'
                            ? (uploadPhase === 'hashing'
                              ? 'Computing fingerprint…'
                              : uploadPhase === 'preparing'
                                ? 'Preparing…'
                                : uploadPhase === 'direct-upload'
                                  ? 'Uploading to storage…'
                                  : uploadPhase === 'finalizing'
                                    ? 'Finalizing…'
                                    : 'Uploading…')
                            : 'Attach as community sample'}
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                          onClick={handleRemoveImage}
                          disabled={uploadStatus === 'uploading'}
                          style={{ flex: '0 0 auto' }}
                        >
                          Choose different image
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
              {duplicateMatch && (
                <>
                  <Alert type="error">
                    {(() => {
                      const recipeId =
                        duplicateMatch.recipeSlug ||
                        duplicateMatch.recipeUuid ||
                        duplicateMatch.recipeId ||
                        '';
                      const recipeLabel =
                        duplicateMatch.recipeName ||
                        recipeId ||
                        'the existing recipe';
                      return (
                        <>
                          This image already exists on the site for{' '}
                          {recipeId ? (
                            <Link href={`/recipes/${encodeURIComponent(recipeId)}`}>
                              {recipeLabel}
                            </Link>
                          ) : (
                            recipeLabel
                          )}
                          . Please select another image.
                        </>
                      );
                    })()}
                  </Alert>
                  <button
                    type="button"
                    className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                    onClick={handleRemoveImage}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Choose different image
                  </button>
                </>
              )}
              {!matchingRecipe && !duplicateMatch && (
                <>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>Author Name</span>
                    <input
                      className="input"
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      required
                      placeholder="Author Name"
                      style={{ width: '100%' }}
                    />
                  </label>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>Recipe Name</span>
                    <input
                      className="input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Recipe Name"
                      style={{ width: '100%' }}
                    />
                  </label>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>Notes</span>
                    <textarea
                      className="input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter any notes"
                      rows={3}
                      style={{ width: '100%' }}
                    />
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <span style={labelTextStyle}>Links</span>
                    {links.map((link, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          width: '100%'
                        }}
                      >
                        <input
                          className="input"
                          type="url"
                          value={link}
                          onChange={(e) => handleLinkChange(idx, e.target.value)}
                          placeholder="https://example.com"
                          style={{ flex: 1 }}
                        />
                        {links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(idx)}
                            aria-label="Remove link"
                            style={{ padding: '4px 8px' }}
                          >
                            −
                          </button>
                        )}
                        {idx === links.length - 1 && (
                          <button
                            type="button"
                            onClick={handleAddLink}
                            aria-label="Add link"
                            style={{ padding: '4px 8px' }}
                          >
                            +
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn"
                    onClick={handleSubmit}
                    disabled={
                      uploadStatus === 'uploading' ||
                      isParsingExif ||
                      !recipe ||
                      !imageFiles?.length ||
                      isCheckingDuplicate
                    }
                  >
                    {uploadStatus === 'uploading'
                      ? (uploadPhase === 'hashing'
                        ? 'Computing fingerprint…'
                        : uploadPhase === 'preparing'
                          ? 'Preparing…'
                          : uploadPhase === 'direct-upload'
                            ? 'Uploading to storage…'
                            : uploadPhase === 'finalizing'
                              ? 'Finalizing…'
                              : 'Uploading…')
                      : 'Upload'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {hasDroppedImage && recipe && (
          <div style={{ ...recipeCardStyle, marginTop: 24 }}>
            <RecipeSettings recipe={recipe} />
          </div>
        )}
      </form>
    </div>
  );
}
