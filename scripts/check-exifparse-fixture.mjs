import { parseMetadata } from '@uswriting/exiftool';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

import { parseRecipeSettingsFromExif } from '../lib/exifparse.js';

async function main() {
    const filePath = process.argv[2] || 'data/samples/OM_recipe_1.jpg';
    const buf = await readFile(filePath);
    const file = new File([buf], filePath.split('/').pop() || 'fixture.jpg', { type: 'image/jpeg' });
    const res = await parseMetadata(file);

    const out = parseRecipeSettingsFromExif(res.data);

    // Basic shape checks: DB schema fields should be camelCase and mostly numbers/null.
    const expectedKeys = [
        'yellow',
        'orange',
        'orangeRed',
        'red',
        'magenta',
        'violet',
        'blue',
        'blueCyan',
        'cyan',
        'greenCyan',
        'green',
        'yellowGreen',
        'contrast',
        'sharpness',
        'highlights',
        'shadows',
        'midtones',
        'whiteBalance2',
        'whiteBalanceTemperature',
        'whiteBalanceAmberOffset',
        'whiteBalanceGreenOffset'
    ];
    for (const k of expectedKeys) {
        assert.ok(Object.hasOwn(out, k), `missing key: ${k}`);
    }

    // Ensure we did not accidentally keep legacy JSON key casing.
    assert.ok(!Object.hasOwn(out, 'Yellow'), 'legacy key leaked: Yellow');
    assert.ok(!Object.hasOwn(out, 'WhiteBalance'), 'legacy key leaked: WhiteBalance');

    // Quick sanity on temperature parse when present.
    if (out.whiteBalance2 === 'Custom WB 1') {
        assert.equal(typeof out.whiteBalanceTemperature, 'number');
    }

    // eslint-disable-next-line no-console
    console.log('OK: exifparse fixture', filePath);
    // eslint-disable-next-line no-console
    console.log(out);
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
});
