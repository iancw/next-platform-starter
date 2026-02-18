// Script to add a sanitized `id` field to each recipe in data/om-recipes.json (ES module version)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper: sanitize string (convert to ASCII, replace non-alphanum with "_", collapse, trim)
function sanitize(str) {
  if (!str) return '';
  // Remove diacritics
  let s = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Lowercase
  s = s.toLowerCase();
  // Replace non-alphanumeric with underscores
  s = s.replace(/[^a-z0-9]+/g, '_');
  // Collapse multiple underscores
  s = s.replace(/_+/g, '_');
  // Trim leading/trailing underscores
  s = s.replace(/^_+|_+$/g, '');
  return s;
}

// ES Module equivalent to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.join(__dirname, 'data', 'om-recipes.json');
const OUTPUT_PATH = INPUT_PATH; // overwrite original file

function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  } catch (err) {
    console.error('Could not read JSON file:', err);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('JSON root is not an array');
    process.exit(1);
  }

  // Add id field
  const modified = data.map(recipe => {
    const author = recipe.Author || '';
    const name = recipe.Name || '';
    // Build id
    const id = sanitize(author) + '_' + sanitize(name);
    return { ...recipe, id };
  });

  // Write result
  try {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(modified, null, 2), 'utf8');
    console.log('Updated recipes with IDs!');
  } catch (err) {
    console.error('Could not write file:', err);
    process.exit(1);
  }
}

if (import.meta.url === process.argv[1] || import.meta.url === `file://${process.argv[1]}`) {
  main();
}
