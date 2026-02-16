import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define saturation order
const satOrder = [
  "Yellow", "Orange", "OrangeRed", "Red",
  "RedMagenta", "Magenta", "Blue", "BlueCyan",
  "Cyan", "CyanGreen", "Green", "GreenYellow"
];

function sanitize(str) {
  // Replace path-unsafe chars (whitespace, slashes, etc)
  return str.replace(/\s+/g, '_')
            .replace(/[^\w\-]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
}

function getVal(obj, key, fallback = "0") {
  return (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") ? obj[key] : fallback;
}

function makeOESXml(recipe) {
  const Kelvin = getVal(recipe, "WhiteBalance", "0");
  const KeepWarm = getVal(recipe, "KeepWarm", "on");
  const WBType = (Kelvin == "0" && KeepWarm == "on") ? "4096" : (Kelvin == "0" && KeepWarm == "off") ? "4098" : "0"

  const RedAdjust = Math.max(-7, Math.min(6, Number(getVal(recipe, "WhiteBalanceAmberShift", "0"))));
  const GreenAdjust = Math.max(-7, Math.min(6, Number(getVal(recipe, "WhiteBalanceGreenShift", "0"))));

  const EV = Number(getVal(recipe, "ExposureCompensation", "0")) * 10

  const Bright = getVal(recipe, "Highlights", "0");
  const Mid = getVal(recipe, "Mids", "0");
  const Dark = getVal(recipe, "Shadows", "0");

  const Contrast = getVal(recipe, "Contrast", "0");
  const Sharpness = getVal(recipe, "Sharpness", "0");

  // Build SatValues (array/map fallback to 0)
  const satVals = satOrder.map(col => getVal(recipe, col, "0")).join(',');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ImageProcessing>
  <ParametersType FormatID="65539" Platform="M" Version="2401" />
  <Parameters>
    <RawEditMode Apply="true" Mode="2" />
    <ExposureBias Apply="true" Numerator="${EV}" Denominator="10" />
    <WhiteBalance Apply="true" Mode="Preset" Kelvin="${Kelvin}" RedAdjust="${RedAdjust}" GreenAdjust="${GreenAdjust}" Type="${WBType}" />
    <Contrast Apply="true" Mode="Manual" Value="${Contrast}" Adjust="0" />
    <Sharpness Apply="true" Mode="Manual" Value="${Sharpness}" Adjust="0" />
    <ToneControl Apply="true" Mode="Manual" Bright="${Bright}" Dark="${Dark}" Mid="${Mid}" />
    <ColorCreater2 Apply="true" Mode="Manual" SatValue="${satVals}" LumValue="0,0,0,0,0,0,0,0,0,0,0,0" HueValue="0,0,0,0,0,0,0,0,0,0,0,0" />
  </Parameters>
</ImageProcessing>
`;
}

function main() {
  // Emulate __dirname for ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const recipesPath = path.join(__dirname, "data", "om-recipes.json");
  const outputBase = path.join(__dirname, "public", "oes");

  const recipes = JSON.parse(fs.readFileSync(recipesPath, "utf8"));

  recipes.forEach(recipe => {
    const author = sanitize(recipe.Author || "unknown");
    const name = sanitize(recipe.Name || "unknown");

    const authorDir = path.join(outputBase, author, name);
    fs.mkdirSync(authorDir, { recursive: true });

    const filename = `${author}_${name}.oes`;
    const oesContent = makeOESXml(recipe);

    fs.writeFileSync(path.join(authorDir, filename), oesContent, "utf8");
    // Optionally: log file creation
    console.log(`Created ${path.join("public", "oes", author, name, filename)}`);
  });
}

main();
