import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').toLowerCase();

  const filePath = path.join(process.cwd(), 'data', 'om3-recipes.json');
  let data;
  try {
    const file = await fs.readFile(filePath, 'utf8');
    data = JSON.parse(file);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Could not read recipes file.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

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
