'use client';

import { useState } from 'react';
import SaturationWheel from './SaturationWheel.jsx';
import SlotEditor from './SlotEditor.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';

const SLOT_NUMBERS = [1, 2, 3, 4];

const WB_MAX = 7; // max offset value for normalization

/** Minimal 32×32 white balance offset dot chart */
function WbThumbnail({ amber = 0, green = 0 }) {
    const size = 32;
    const half = size / 2;
    const norm = (v) => Math.max(-WB_MAX, Math.min(WB_MAX, v)) / WB_MAX;
    const cx = half + norm(amber) * (half - 3);
    const cy = half - norm(green) * (half - 3); // SVG y is inverted
    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="shrink-0 rounded"
            style={{ background: '#323232' }}
            aria-label="WB offset"
        >
            {/* Colored edges */}
            <rect x="0" y="0" width={size} height="2" fill="#4ebe62" />
            <rect x="0" y={size - 2} width={size} height="2" fill="#cc47a0" />
            <rect x={size - 2} y="0" width="2" height={size} fill="#ffc540" />
            <rect x="0" y="0" width="2" height={size} fill="#3586d8" />
            {/* Crosshairs */}
            <line x1={half} y1="0" x2={half} y2={size} stroke="#555" strokeWidth="0.8" />
            <line x1="0" y1={half} x2={size} y2={half} stroke="#555" strokeWidth="0.8" />
            {/* Dot */}
            <circle cx={cx} cy={cy} r="3" fill="#ddd" />
        </svg>
    );
}

function SlotSummary({ slotNumber, assignment }) {
    if (!assignment) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                <span className="w-14 shrink-0">Color {slotNumber}</span>
                <span className="italic">Empty</span>
            </div>
        );
    }

    if (assignment.recipeNotFound) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                <span className="w-14 shrink-0">Color {slotNumber}</span>
                <span className="italic">Recipe not found</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-14 shrink-0 text-muted-foreground">Color {slotNumber}</span>
            {/* Color wheel thumbnail */}
            <div className="shrink-0 overflow-hidden" style={{ width: 32, height: 32 }}>
                <div style={{ transform: `scale(${32 / 260})`, transformOrigin: 'top left', width: 260, height: 260 }}>
                    <SaturationWheel values={assignment.colorWheelValues ?? []} />
                </div>
            </div>
            {/* WB amber/green offset thumbnail — minimal inline SVG */}
            <WbThumbnail
                amber={Number(assignment.whiteBalanceAmberOffset ?? 0)}
                green={Number(assignment.whiteBalanceGreenOffset ?? 0)}
            />
            <span className="truncate font-medium">{assignment.recipeName}</span>
        </div>
    );
}

export default function ModeCard({ modePosition, label, slots, allRecipes, upsertAction, clearAction }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const slotsByNumber = {};
    for (const slot of slots) {
        slotsByNumber[slot.colorSlot] = slot;
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="cursor-pointer select-none py-4 hover:bg-muted/30 transition-colors"
                onClick={() => setIsExpanded((v) => !v)}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{label}</CardTitle>
                    <span className="text-xs text-muted-foreground">{isExpanded ? '▲' : '▼'}</span>
                </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-0 space-y-1">
                {!isExpanded && (
                    <div
                        className="cursor-pointer space-y-1"
                        onClick={() => setIsExpanded(true)}
                    >
                        {SLOT_NUMBERS.map((num) => (
                            <SlotSummary key={num} slotNumber={num} assignment={slotsByNumber[num]} />
                        ))}
                    </div>
                )}

                {isExpanded && (
                    <SlotEditor
                        modePosition={modePosition}
                        label={label}
                        slots={slotsByNumber}
                        allRecipes={allRecipes}
                        upsertAction={upsertAction}
                        clearAction={clearAction}
                    />
                )}
            </CardContent>
        </Card>
    );
}
