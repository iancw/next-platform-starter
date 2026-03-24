"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import RecipeSimpleCard from "../components/recipe-simple-card.jsx";
import Link from 'next/link';
import RecipeCard from "../components/recipe-card.jsx";
import {
  comparisonImageSelectionValue,
  formatComparisonImageLabelForDisplay,
  getAvailableComparisonImageLabels,
  SAMPLE_IMAGE_SELECTION
} from "../lib/recipe-image-selection.js";

const PAGE_SIZE = 12;

function getRecipeId(recipe) {
  if (!recipe) return null;
  // Prefer uuid for URL identity; fall back to slug for older data.
  const id = recipe.uuid ?? recipe.slug;
  return id == null || String(id).trim() === '' ? null : id;
}

function getRecipeListKey(recipe, index) {
  if (recipe?.id != null) return `recipe-${recipe.id}`;
  const recipeId = getRecipeId(recipe);
  if (recipeId) return `recipe-${recipeId}`;
  return `recipe-fallback-${index}`;
}

function mergeUniqueRecipes(existingRecipes, incomingRecipes) {
  const seen = new Set();
  const merged = [];

  for (const recipe of [...existingRecipes, ...incomingRecipes]) {
    const identity =
      recipe?.id != null
        ? `id:${recipe.id}`
        : getRecipeId(recipe)
          ? `recipe:${getRecipeId(recipe)}`
          : null;

    if (identity) {
      if (seen.has(identity)) continue;
      seen.add(identity);
    }

    merged.push(recipe);
  }

  return merged;
}

export default function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [selectedImageOption, setSelectedImageOption] = useState(SAMPLE_IMAGE_SELECTION);
  const hasLoadedInitialResults = useRef(false);
  const queryRef = useRef("");
  const resultsRef = useRef([]);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const activeSearchKeyRef = useRef("");
  const currentSearchRef = useRef({ query: "", onlyMine: false, onlySaved: false });
  const activeResetRequestRef = useRef(null);
  const loadMoreSentinelRef = useRef(null);

  const updateResults = useCallback((nextValue) => {
    setResults((current) => {
      const nextResults = typeof nextValue === "function" ? nextValue(current) : nextValue;
      resultsRef.current = nextResults;
      return nextResults;
    });
  }, []);

  const updateHasMore = useCallback((nextHasMore) => {
    hasMoreRef.current = nextHasMore;
    setHasMore(nextHasMore);
  }, []);

  const buildSearchKey = useCallback(
    (searchQuery, filters) =>
      JSON.stringify({
        q: searchQuery,
        onlyMine: Boolean(filters.onlyMine),
        onlySaved: Boolean(filters.onlySaved)
      }),
    []
  );

  const fetchRecipePage = useCallback(async ({ searchQuery, filters = {}, offset = 0, append = false }) => {
    const searchKey = buildSearchKey(searchQuery, filters);
    const controller = new AbortController();

    if (!append) {
      activeSearchKeyRef.current = searchKey;
      currentSearchRef.current = {
        query: searchQuery,
        onlyMine: Boolean(filters.onlyMine),
        onlySaved: Boolean(filters.onlySaved)
      };
      if (activeResetRequestRef.current) {
        activeResetRequestRef.current.abort();
      }
      activeResetRequestRef.current = controller;
      setLoading(true);
      setError(null);
      updateResults([]);
      updateHasMore(false);
      setSelectedRecipeIndex(null);
    } else {
      if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current) return null;
      if (activeSearchKeyRef.current !== searchKey) return null;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      if (filters.onlyMine) params.set('onlyMine', '1');
      if (filters.onlySaved) params.set('onlySaved', '1');
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(offset));

      const res = await fetch(`/recipes/search?${params.toString()}`, {
        signal: controller.signal
      });
      if (!res.ok) throw new Error("Failed to fetch recipes");
      const data = await res.json();
      if (activeSearchKeyRef.current !== searchKey) return null;

      const pageResults = Array.isArray(data?.results) ? data.results : [];
      const nextResults = append ? mergeUniqueRecipes(resultsRef.current, pageResults) : pageResults;

      updateResults(nextResults);
      updateHasMore(Boolean(data?.hasMore));

      return {
        results: pageResults,
        mergedResults: nextResults,
        hasMore: Boolean(data?.hasMore)
      };
    } catch (err) {
      if (err?.name === 'AbortError') return null;
      setError(err.message || "Unknown error");
      if (!append) updateHasMore(false);
      return null;
    } finally {
      if (!append) {
        if (activeResetRequestRef.current === controller) {
          activeResetRequestRef.current = null;
        }
        setLoading(false);
      } else {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [buildSearchKey, updateHasMore, updateResults]);

  const loadMoreRecipes = useCallback(async () => {
    if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current) return null;

    const { query: currentQuery, onlyMine: currentOnlyMine, onlySaved: currentOnlySaved } = currentSearchRef.current;

    return fetchRecipePage({
      searchQuery: currentQuery,
      filters: {
        onlyMine: currentOnlyMine,
        onlySaved: currentOnlySaved
      },
      offset: resultsRef.current.length,
      append: true
    });
  }, [fetchRecipePage]);

  const startSearch = useCallback((searchQuery, filters = {}) => {
    void fetchRecipePage({
      searchQuery,
      filters,
      offset: 0,
      append: false
    });
  }, [fetchRecipePage]);

  const maybeLoadMoreRecipes = useCallback(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;
    if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current) return;

    const sentinelTop = sentinel.getBoundingClientRect().top;
    const viewportBottom = window.innerHeight + 300;
    if (sentinelTop <= viewportBottom) {
      void loadMoreRecipes();
    }
  }, [loadMoreRecipes]);

  const selectedRecipe = useMemo(() => {
    if (selectedRecipeIndex == null) return null;
    if (!Array.isArray(results) || results.length === 0) return null;
    if (selectedRecipeIndex < 0 || selectedRecipeIndex >= results.length) return null;
    return results[selectedRecipeIndex] ?? null;
  }, [results, selectedRecipeIndex]);

  const isModalOpen = selectedRecipe != null;

  const comparisonImageLabels = useMemo(
    () => getAvailableComparisonImageLabels(results),
    [results]
  );

  const imageOptions = useMemo(
    () => [
      { value: SAMPLE_IMAGE_SELECTION, label: "Author sample" },
      ...comparisonImageLabels.map((label) => ({
        value: comparisonImageSelectionValue(label),
        label: formatComparisonImageLabelForDisplay(label)
      }))
    ],
    [comparisonImageLabels]
  );

  const openRecipeAtIndex = useCallback(
    (index, recipeList = resultsRef.current) => {
      if (!Array.isArray(recipeList) || recipeList.length === 0) return;
      if (!Number.isInteger(index)) return;
      if (index < 0 || index >= recipeList.length) return;
      const r = recipeList[index];
      const id = getRecipeId(r);
      if (!id) return;

      setSelectedRecipeIndex(index);

      const url = new URL(window.location.href);
      url.searchParams.set('id', id);
      window.history.pushState({}, '', url);
    },
    []
  );

  const closeModal = useCallback(() => {
    setSelectedRecipeIndex(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, []);

  const handleSavedChange = useCallback((recipeId, isSaved) => {
    if (onlySaved && !isSaved) {
      updateResults((current) => current.filter((recipe) => recipe?.id !== recipeId));
      if (selectedRecipe?.id === recipeId) {
        closeModal();
      }
      return;
    }

    updateResults((current) =>
      current.map((recipe) =>
        recipe?.id === recipeId
          ? {
              ...recipe,
              isSaved
            }
          : recipe
      )
    );
  }, [closeModal, onlySaved, selectedRecipe?.id, updateResults]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    startSearch("", { onlyMine: false, onlySaved: false });
    hasLoadedInitialResults.current = true;
  }, [startSearch]);

  useEffect(() => {
    if (!hasLoadedInitialResults.current) return;
    startSearch(queryRef.current, { onlyMine, onlySaved });
  }, [onlyMine, onlySaved, startSearch]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    if (imageOptions.some((option) => option.value === selectedImageOption)) return;
    setSelectedImageOption(SAMPLE_IMAGE_SELECTION);
  }, [imageOptions, selectedImageOption]);

  // Auto-select recipe if URL contains ?id=... once results are loaded.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recipeKey = params.get("id") || params.get("uuid") || params.get("slug");
    if (!recipeKey) {
      setSelectedRecipeIndex(null);
      return;
    }

    const index = results.findIndex((r) => getRecipeId(r) === recipeKey);
    if (index >= 0) {
      setSelectedRecipeIndex(index);
      return;
    }

    if (!loading && !loadingMore && hasMore) {
      void loadMoreRecipes();
      return;
    }

    if (!loading && !loadingMore && !hasMore) {
      setSelectedRecipeIndex(null);
    }
  }, [hasMore, loading, loadingMore, loadMoreRecipes, results]);

  // Keep modal state in sync with back/forward browser navigation.
  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const recipeKey = params.get("id") || params.get("uuid") || params.get("slug");
      if (!recipeKey) {
        setSelectedRecipeIndex(null);
        return;
      }

      const index = resultsRef.current.findIndex((r) => getRecipeId(r) === recipeKey);
      if (index >= 0) {
        setSelectedRecipeIndex(index);
        return;
      }

      if (hasMoreRef.current && !loadingRef.current && !loadingMoreRef.current) {
        void loadMoreRecipes();
        return;
      }

      setSelectedRecipeIndex(null);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [loadMoreRecipes]);

  const openNextRecipe = useCallback(async () => {
    if (selectedRecipeIndex == null) return;

    const nextIndex = selectedRecipeIndex + 1;
    if (nextIndex < resultsRef.current.length) {
      openRecipeAtIndex(nextIndex);
      return;
    }

    const page = await loadMoreRecipes();
    const nextResults = page?.mergedResults ?? resultsRef.current;
    if (nextIndex < nextResults.length) {
      openRecipeAtIndex(nextIndex, nextResults);
    }
  }, [loadMoreRecipes, openRecipeAtIndex, selectedRecipeIndex]);

  // Keyboard controls when modal is open.
  useEffect(() => {
    if (!isModalOpen) return;

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (selectedRecipeIndex == null) return;
        const prev = selectedRecipeIndex - 1;
        if (prev >= 0) {
          e.preventDefault();
          openRecipeAtIndex(prev);
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        void openNextRecipe();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeModal, isModalOpen, openRecipeAtIndex, openNextRecipe, selectedRecipeIndex]);

  // Prevent background scroll while modal is open.
  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || isModalOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current || error) return;
        void loadMoreRecipes();
      },
      {
        rootMargin: "300px 0px"
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, isModalOpen, loadMoreRecipes]);

  useEffect(() => {
    if (isModalOpen) return;

    function handleWindowPositionChange() {
      if (error) return;
      maybeLoadMoreRecipes();
    }

    window.addEventListener('scroll', handleWindowPositionChange, { passive: true });
    window.addEventListener('resize', handleWindowPositionChange);
    handleWindowPositionChange();

    return () => {
      window.removeEventListener('scroll', handleWindowPositionChange);
      window.removeEventListener('resize', handleWindowPositionChange);
    };
  }, [error, isModalOpen, maybeLoadMoreRecipes, results]);

  async function handleSubmit(e) {
    e.preventDefault();
    startSearch(query, { onlyMine, onlySaved });
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800 px-8 py-8 w-full">
      <div className="flex flex-col w-full gap-4 mb-5 md:mb-10">
        <div className="flex flex-col md:pt-0 md:flex-row items-start justify-between w-full gap-4">
          <h1 className="text-3xl font-bold mb-0 flex-shrink-0">OM System Color Recipes</h1>
          <div className="flex w-full flex-col items-start md:items-end md:ml-8">
            <form onSubmit={handleSubmit} className="flex w-full max-w-sm justify-start md:justify-end">
              <input
                type="text"
                name="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search color recipes..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l focus:outline-none text-gray-800"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
              >
                Search
              </button>
            </form>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <fieldset className="m-0 flex min-w-0 flex-col gap-2 rounded-lg border border-gray-300 px-4 py-3">
            <legend id="recipe-image-group-label" className="text-sm font-medium text-gray-700">
              Image
            </legend>
            <div
              role="radiogroup"
              aria-labelledby="recipe-image-group-label"
              className="flex flex-row flex-wrap items-center gap-4 text-sm text-gray-700 justify-start"
            >
              {imageOptions.map((option) => {
                const checked = selectedImageOption === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setSelectedImageOption(option.value)}
                    className="inline-flex items-center gap-2 hover:opacity-80"
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                        checked ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="m-0 flex min-w-0 flex-col gap-2 rounded-lg border border-gray-300 px-4 py-3 md:items-end">
            <legend id="recipe-filter-group-label" className="text-sm font-medium text-gray-700">
              Filter
            </legend>
            <div
              role="radiogroup"
              aria-labelledby="recipe-filter-group-label"
              className="flex flex-row flex-wrap items-center gap-4 text-sm text-gray-700 md:justify-end"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!onlyMine && !onlySaved}
                onClick={() => {
                  setOnlyMine(false);
                  setOnlySaved(false);
                }}
                className="inline-flex items-center gap-2 hover:opacity-80"
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                    !onlyMine && !onlySaved ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
                <span>All</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={onlyMine}
                onClick={() => {
                  setOnlyMine(true);
                  setOnlySaved(false);
                }}
                className="inline-flex items-center gap-2 hover:opacity-80"
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                    onlyMine ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
                <span>Mine</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={onlySaved}
                onClick={() => {
                  setOnlySaved(true);
                  setOnlyMine(false);
                }}
                className="inline-flex items-center gap-2 hover:opacity-80"
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                    onlySaved ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
                <span>Saved</span>
              </button>
            </div>
          </fieldset>
        </div>
      </div>
      <div className="w-full">
        {isModalOpen ? (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={(e) => {
              // Backdrop click closes; clicks inside the dialog should not.
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div
              className="bg-white rounded shadow-lg relative max-w-5xl w-full p-6 flex flex-col items-center"
              role="dialog"
              aria-modal="true"
              aria-label="Recipe details"
            >
              {/* Arrow Navigation */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 pl-4">
                {selectedRecipeIndex > 0 && (
                  <button
                    onClick={() => openRecipeAtIndex(selectedRecipeIndex - 1)}
                    aria-label="Previous Recipe"
                    className="bg-white rounded-full shadow p-2 text-2xl hover:bg-gray-200"
                  >
                    &#8592;
                  </button>
                )}
              </div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pr-4">
                {(Array.isArray(results) && selectedRecipeIndex < results.length - 1) || hasMore ? (
                  <button
                    onClick={() => {
                      void openNextRecipe();
                    }}
                    aria-label="Next Recipe"
                    className="bg-white rounded-full shadow p-2 text-2xl hover:bg-gray-200"
                  >
                    &#8594;
                  </button>
                ) : null}
              </div>

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ×
              </button>

              <div className="w-full flex items-center justify-end pr-10">
                {(() => {
                  const id = getRecipeId(selectedRecipe);
                  if (!id) return null;
                  return (
                    <Link
                      href={`/recipes/${encodeURIComponent(id)}`}
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Open full recipe page
                    </Link>
                  );
                })()}
              </div>

              <div
                className="w-full"
                style={{
                  maxHeight: "80vh",
                  overflowY: "auto",
                  width: "100%"
                }}
              >
                <RecipeCard
                  recipe={selectedRecipe}
                  onSavedChange={handleSavedChange}
                  selectedImageOption={selectedImageOption}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {loading && <div className="text-center text-gray-500">Searching...</div>}
            {error && <div className="text-center text-red-500">{error}</div>}
            {!loading && !error && results.length === 0 && (query || onlyMine || onlySaved) && (
              <div className="text-center text-gray-500">No recipes found.</div>
            )}
            {!loading && !error && results.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
                {results.map((r, i) => (
                  <li key={getRecipeListKey(r, i)} className="p-0">
                    {(() => {
                      const id = getRecipeId(r);
                      if (!id) {
                        return (
                          <div className="block opacity-60 cursor-not-allowed" title="Recipe is missing uuid/slug">
                            <RecipeSimpleCard recipe={r} selectedImageOption={selectedImageOption} />
                          </div>
                        );
                      }

                      return (
                        <div
                          role="button"
                          tabIndex={0}
                          className="block text-left w-full"
                          onClick={() => openRecipeAtIndex(i)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openRecipeAtIndex(i);
                            }
                          }}
                        >
                          <RecipeSimpleCard recipe={r} selectedImageOption={selectedImageOption} />
                        </div>
                      );
                    })()}
                  </li>
                ))}
              </ul>
            )}
            {!loading && !error && results.length > 0 && (
              <div ref={loadMoreSentinelRef} className="flex flex-col items-center gap-3 py-6 text-sm text-gray-500">
                <div>
                  {loadingMore ? "Loading more recipes..." : hasMore ? "Scroll for more recipes" : "All recipes loaded"}
                </div>
                {hasMore && !loadingMore ? (
                  <button
                    type="button"
                    onClick={() => {
                      void loadMoreRecipes();
                    }}
                    className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Load more
                  </button>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
