import React from "react";

/**
 * Renders a 2D white balance box.
 * - green offset is the top (y+)
 * - magenta offset is bottom (y-)
 * - amber offset is right (x+)
 * - blue offset is left (x-)
 *
 * Props:
 *   - green: number (positive = toward top)
 *   - magenta: number (positive = toward bottom)
 *   - amber: number (positive = toward right)
 *   - blue: number (positive = toward left)
 *   Or, pass in x and y as coordinates as calculated externally.
 */
export default function WhiteBalanceBox({
  wb = 'Auto',
  keepWarm = 'off',
  green = 0,
  amber = 0,
  boxSize = 150,
  markerSize = 14,
  maxOffset = 5, // Maximum offset value, used for normalization
}) {
  // For this calculation, we'll assume:
  // x = amber - blue (positive is right/amber, negative is left/blue)
  // y = green - magenta (positive is up/green, negative is down/magenta)
  const x = amber;
  const y = green;

  // Normalize x/y to fit in the box. Assume they range from -maxOffset to maxOffset.
  const half = boxSize / 2;
  const norm = (val) => Math.max(-maxOffset, Math.min(maxOffset, val)) / maxOffset;
  const px = half + norm(x) * half;
  const py = half - norm(y) * half; // SVG y+ is down, so flip sign for up/y+

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ marginTop: 8, textAlign: "center", fontWeight: 500 }}>
        {wb ? wb + " K" : "Auto"} {amber < 0 ? 'B' : 'A'}.{Math.abs(amber)}  {green < 0 ? 'M' : 'G'}.{Math.abs(green)}
      </div>
      <div
        style={{
          border: "1px solid #353535",
          borderRadius: 6,
          width: boxSize + 8,
          height: boxSize + 8,
          margin: "auto",
          background: "#353535",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <svg
          width={boxSize}
          height={boxSize}
          viewBox={`0 0 ${boxSize} ${boxSize}`}
          style={{ display: "block" }}
          aria-label="White Balance Box"
        >
          {/* Colored Borders */}
          <rect
            x="0"
            y="0"
            width={boxSize}
            height={boxSize}
            rx={8}
            fill="rgb(50, 50, 50)"
            stroke="#ddd"
            strokeWidth="2"
          />
          {/* Green (top) */}
          <rect x="0" y="0" width={boxSize} height="4" fill="#4ebe62" />
          {/* Magenta (bottom) */}
          <rect
            x="0"
            y={boxSize - 4}
            width={boxSize}
            height="4"
            fill="#cc47a0"
          />
          {/* Amber (right) */}
          <rect
            x={boxSize - 4}
            y="0"
            width="4"
            height={boxSize}
            fill="#ffc540"
          />
          {/* Blue (left) */}
          <rect x="0" y="0" width="4" height={boxSize} fill="#3586d8" />

          {/* Marker */}
          <circle
            cx={px}
            cy={py}
            r={markerSize / 2}
            fill="#ccc"
            stroke="#ccc"
            strokeWidth="2"
          />
          <line
            x1={px}
            y1="0"
            x2={px}
            y2={boxSize}
            stroke="#eee"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={py}
            x2={boxSize}
            y2={py}
            stroke="#eee"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}
