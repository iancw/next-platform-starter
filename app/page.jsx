"use client";
import { useState } from "react";
import RecipeCard from "../components/recipe-card.jsx";

export default function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(`/api/recipes/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800">
      <h1 className="text-3xl font-bold mb-6">OM System Color Recipe Search</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-md mb-8">
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
      <div className="w-full max-w-2xl">
        {loading && <div className="text-center text-gray-500">Searching...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!loading && !error && results.length === 0 && query && (
          <div className="text-center text-gray-500">No recipes found.</div>
        )}
        {!loading && !error && results.length > 0 && (
          <ul className="divide-y divide-gray-200">
            {results.map((r, i) => (
              <li key={r.Name + r.Author + i} className="p-4">
                <RecipeCard
                  name={r.Name}
                  author={r.Author}
                  notes={r.Notes}
                  tips={r.Tips || r.Various}
                  links={r.Links}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
