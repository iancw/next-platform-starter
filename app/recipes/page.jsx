"use client";
import { useState, useEffect } from "react";
import RecipeCard from "../../components/recipe-card.jsx";

export default function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // On mount, fetch all recipes (empty search)
  useEffect(() => {
    doSearch("");
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    doSearch(query);
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800 px-8 py-8 w-full">
      <div className="flex flex-row items-start justify-between w-full max-w-5xl mx-auto mb-10">
        <h1 className="text-3xl font-bold mb-0 flex-shrink-0">OM System Color Recipes</h1>
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm justify-end ml-8">
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
      <div className="w-full max-w-5xl mx-auto">
        {loading && <div className="text-center text-gray-500">Searching...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!loading && !error && results.length === 0 && query && (
          <div className="text-center text-gray-500">No recipes found.</div>
        )}
        {!loading && !error && results.length > 0 && (
          <ul className="divide-y divide-gray-200">
            {results.map((r, i) => (
              <li key={r.Name + r.Author + i} className="p-4">
                <RecipeCard recipe={r} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
