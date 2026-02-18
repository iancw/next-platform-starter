"use client";
import { useState, useEffect } from "react";
import RecipeSimpleCard from "../../components/recipe-simple-card.jsx";
import RecipeCard from "../../components/recipe-card.jsx";

export default function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(null);

  // Shared search handler for both initial load and submission
  async function doSearch(searchQuery) {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(`/recipes/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get recipe id from Author and Name
  function getRecipeId(recipe) {
    if (!recipe) return null;
    return recipe.id;
  }

  // Effect: On mount, check for id in URL and fetch by id if present, else fetch all recipes
  useEffect(() => {
      doSearch("");
  }, []);

  // Effect: When results are updated or on mount, auto-select recipe if 'id' query param is present.
  useEffect(() => {
    if (!results || results.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get("id");
    if (recipeId) {
      console.log('Found recipe id' + recipeId + ' ... searching for it')
      // Find recipe with matching id
      const index = results.findIndex(
        (r) => getRecipeId(r) === recipeId
      );
      console.log('found it at index ' + index)
      if (index !== -1) {
        setSelectedRecipe(results[index]);
        setSelectedRecipeIndex(index);
      } else {
        setSelectedRecipe(null);
        setSelectedRecipeIndex(null);
      }
    } else {
      setSelectedRecipe(null);
      setSelectedRecipeIndex(null);
    }
  }, [results]);

  // Effect: Listen for browser 'popstate' navigation to update modal.
  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get("id");
      if (urlId && results && results.length > 0) {
        const index = results.findIndex(
          (r) => getRecipeId(r) === urlId
        );
        if (index !== -1) {
          setSelectedRecipe(results[index]);
          setSelectedRecipeIndex(index);
        } else {
          setSelectedRecipe(null);
          setSelectedRecipeIndex(null);
        }
      } else {
        setSelectedRecipe(null);
        setSelectedRecipeIndex(null);
      }
    }
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [results]);

  async function handleSubmit(e) {
    e.preventDefault();
    doSearch(query);
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800 px-8 py-8 w-full">
      <div className="flex flex-col md:pt-0 md:flex-row items-start justify-between w-full">
        <h1 className="text-3xl font-bold mb-0 flex-shrink-0">OM System Color Recipes</h1>
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm justify-start mb-5 pt-10 md:pt-0 md:mb-10 md:justify-end ml-8">
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
      <div className="w-full">
        {selectedRecipe ? (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded shadow-lg relative max-w-5xl w-full p-6 flex flex-col items-center">
              {/* Arrow Navigation */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 pl-4">
                {selectedRecipeIndex > 0 && (
                  <button
                    onClick={() => {
                      const newIndex = selectedRecipeIndex - 1;
                      const prevRecipe = results[newIndex];
                      setSelectedRecipe(prevRecipe);
                      setSelectedRecipeIndex(newIndex);
                      const url = new URL(window.location.href);
                      url.searchParams.set('id', prevRecipe.id);
                      window.history.pushState({}, '', url);
                    }}
                    aria-label="Previous Recipe"
                    className="bg-white rounded-full shadow p-2 text-2xl hover:bg-gray-200"
                  >
                    &#8592;
                  </button>
                )}
              </div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pr-4">
                {selectedRecipeIndex < results.length - 1 && (
                  <button
                    onClick={() => {
                      const newIndex = selectedRecipeIndex + 1;
                      const nextRecipe = results[newIndex];
                      setSelectedRecipe(nextRecipe);
                      setSelectedRecipeIndex(newIndex);
                      const url = new URL(window.location.href);
                      url.searchParams.set('id', nextRecipe.id);
                      window.history.pushState({}, '', url);
                    }}
                    aria-label="Next Recipe"
                    className="bg-white rounded-full shadow p-2 text-2xl hover:bg-gray-200"
                  >
                    &#8594;
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedRecipe(null);
                  setSelectedRecipeIndex(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete('id');
                  window.history.replaceState({}, '', url.pathname + url.search);
                }}
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
              <div
                className="w-full"
                style={{
                  maxHeight: "80vh",
                  overflowY: "auto",
                  width: "100%"
                }}
              >
                <RecipeCard recipe={selectedRecipe} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {loading && <div className="text-center text-gray-500">Searching...</div>}
            {error && <div className="text-center text-red-500">{error}</div>}
            {!loading && !error && results.length === 0 && query && (
              <div className="text-center text-gray-500">No recipes found.</div>
            )}
            {!loading && !error && results.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
                {results.map((r, i) => (
                  <li key={r.Name + r.Author + i} className="p-0">
                    <RecipeSimpleCard
                      recipe={r}
                      onClick={() => {
                        setSelectedRecipe(r);
                        setSelectedRecipeIndex(i);
                        const url = new URL(window.location.href);
                        url.searchParams.set('id', r.id);
                        window.history.pushState({}, '', url);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
