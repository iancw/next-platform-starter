import { describe, expect, it } from 'vitest';
import { getEquivalentWhiteBalance, shareEquivalentWhiteBalance } from '../lib/whiteBalanceEquivalence.js';

describe('getEquivalentWhiteBalance', () => {
    it('matches Kelvin-based white balance values regardless of label', () => {
        expect(
            shareEquivalentWhiteBalance(
                {
                    whiteBalance2: 'Custom WB 1',
                    whiteBalanceTemperature: 5300,
                    whiteBalanceAmberOffset: 1,
                    whiteBalanceGreenOffset: -2
                },
                {
                    whiteBalance2: '5300K (Fine Weather)',
                    whiteBalanceTemperature: 5300,
                    whiteBalanceAmberOffset: 1,
                    whiteBalanceGreenOffset: -2
                }
            )
        ).toBe(true);
    });

    it('treats auto variants as equivalent when offsets match', () => {
        expect(
            shareEquivalentWhiteBalance(
                {
                    whiteBalance2: 'Auto',
                    whiteBalanceAmberOffset: 2,
                    whiteBalanceGreenOffset: 0
                },
                {
                    whiteBalance2: 'Auto (Keep Warm Color Off)',
                    whiteBalanceAmberOffset: 2,
                    whiteBalanceGreenOffset: 0
                }
            )
        ).toBe(true);
    });

    it('does not group different preset families without a temperature', () => {
        expect(
            shareEquivalentWhiteBalance(
                {
                    whiteBalance2: 'Shade',
                    whiteBalanceAmberOffset: 0,
                    whiteBalanceGreenOffset: 0
                },
                {
                    whiteBalance2: 'Cloudy',
                    whiteBalanceAmberOffset: 0,
                    whiteBalanceGreenOffset: 0
                }
            )
        ).toBe(false);
    });

    it('normalizes missing offsets to zero', () => {
        expect(
            getEquivalentWhiteBalance({
                whiteBalance2: 'Auto'
            })
        ).toMatchObject({
            type: 'auto',
            amberOffset: 0,
            greenOffset: 0,
            key: 'auto|amber:0|green:0'
        });
    });
});
