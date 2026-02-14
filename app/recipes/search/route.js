import { NextResponse } from 'next/server';
import data from 'data/om-recipes.json';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').toLowerCase();

  // If no query, return all recipes
  if (!query) {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const matches = data.filter(recipe => {
    return (
      (recipe.Name && recipe.Name.toLowerCase().includes(query)) ||
      (recipe.Author && recipe.Author.toLowerCase().includes(query)) ||
      (recipe.Notes && recipe.Notes.toLowerCase().includes(query))
    );
  });

  return new Response(JSON.stringify(matches), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
