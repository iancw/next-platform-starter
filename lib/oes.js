// Shared OES generator used by both scripts and server actions.
//
// The output format is based on scripts/generate-oes-files.js.

// Define saturation order
const satOrder = [
    'Yellow',
    'Orange',
    'OrangeRed',
    'Red',
    'Magenta',
    'Violet',
    'Blue',
    'BlueCyan',
    'Cyan',
    'CyanGreen',
    'Green',
    'GreenYellow'
];

function getVal(obj, key, fallback = '0') {
    return obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== ''
        ? obj[key]
        : fallback;
}

// Clamp to OM Workspace-ish value ranges.
function clampInt(v, min, max, fallback = 0) {
    const n = Number.parseInt(String(v), 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

/**
 * @param {object} recipeSettings - recipe settings object from lib/exifparse.js
 * @returns {string} OES XML
 */
export function makeOESXml(recipeSettings) {
    // We do not currently parse KeepWarm or WhiteBalance Kelvin from EXIF into our UI object.
    // For now, keep the behavior compatible with our existing generator script and default
    // to Auto (Keep Warm On).
    const Kelvin = getVal(recipeSettings, 'WhiteBalance', '0');
    const KeepWarm = getVal(recipeSettings, 'KeepWarm', 'on');
    const WBType =
        Kelvin == '0' && KeepWarm == 'on'
            ? '4096'
            : Kelvin == '0' && KeepWarm == 'off'
              ? '4098'
              : '0';

    // Our parsed object uses offsets already; script uses different keys.
    const RedAdjust = clampInt(getVal(recipeSettings, 'whiteBalanceAmberOffset', '0'), -7, 6, 0);
    const GreenAdjust = clampInt(getVal(recipeSettings, 'whiteBalanceGreenOffset', '0'), -7, 6, 0);

    // Parsed EXIF value is typically like "+0.3" or "0"; OES expects tenth-stops.
    const evRaw = Number.parseFloat(String(recipeSettings?.ExposureCompensation ?? 0));
    const EV = Number.isFinite(evRaw) ? Math.round(evRaw * 10) : 0;

    const Bright = getVal(recipeSettings, 'highlights', '0');
    const Mid = getVal(recipeSettings, 'midtones', '0');
    const Dark = getVal(recipeSettings, 'shadows', '0');

    const Contrast = getVal(recipeSettings, 'contrast', '0');
    const Sharpness = getVal(recipeSettings, 'sharpness', '0');

    // Map our camelCase fields to the generator’s sat order.
    const satMap = {
        Yellow: recipeSettings?.yellow,
        Orange: recipeSettings?.orange,
        OrangeRed: recipeSettings?.orangeRed,
        Red: recipeSettings?.red,
        Magenta: recipeSettings?.magenta,
        Violet: recipeSettings?.violet,
        Blue: recipeSettings?.blue,
        BlueCyan: recipeSettings?.blueCyan,
        Cyan: recipeSettings?.cyan,
        CyanGreen: recipeSettings?.greenCyan,
        Green: recipeSettings?.green,
        GreenYellow: recipeSettings?.yellowGreen
    };
    const satVals = satOrder.map((col) => getVal(satMap, col, '0')).join(',');

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
