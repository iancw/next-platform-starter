import React from "react";

// Maps a domain coordinate (-15 to 15) to SVG (padding: 20, box: 260x260)
function map(val) {
  return 130 + (val * 110) / 15;
}

// Returns the path for a quadratic Bézier curve between start/mid/end
function curvePath(x1, y1, xm, ym, x2, y2) {
  return `M ${map(x1)},${map(-y1)} Q ${map(xm)},${map(-ym)} ${map(x2)},${map(-y2)}`;
}

export default function ShadowMidsHighlightAdjust({ shadows = 0, mids = 0, highlights = 0 }) {
  // Shadows
  const shStart = [-15, -15];
  const shEnd = [0, 0];
  const shMid = [-8, -8 + Number(shadows)];

  // Highlights
  const hiStart = [0, 0];
  const hiEnd = [15, 15];
  const hiMid = [7, 7 + Number(highlights)];

  // Mids
  const midStart = [-15, -15];
  const midEnd = [15, 15];
  const midMid = [0, 0 + Number(mids)];

  return (
    <div style={{ margin: "1rem 0" }}>
      <div
        style={{
          marginBottom: 7,
          width: 260,
          marginLeft: "auto",
          marginRight: "auto",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: 0.2,
          color: "#333"
        }}
      >
        <div style={{ textAlign: "left" }}>{`Sh: ${(shadows > 0 ? "+" : "") + shadows}`}</div>
        <div style={{ textAlign: "center" }}>{`Mid: ${(mids > 0 ? "+" : "") + mids}`}</div>
        <div style={{ textAlign: "right" }}>{`Hi: ${(highlights > 0 ? "+" : "") + highlights}`}</div>
      </div>
      <div style={{
        border: "1px solid #bbb",
        borderRadius: 6,
        width: 260,
        height: 260,
        margin: "auto",
        background: "#fafafc",
        position: "relative"
      }}>
        <svg viewBox="0 0 260 260" width={260} height={260}>
          {/* Axes */}
          <line x1={map(-15)} y1={map(0)} x2={map(15)} y2={map(0)} stroke="#888" strokeWidth="1.2" />
          <line x1={map(0)} y1={map(-15)} x2={map(0)} y2={map(15)} stroke="#888" strokeWidth="1.2" />
          {/* Shadow curve */}
          <path
            d={curvePath(shStart[0], shStart[1], shMid[0], shMid[1], shEnd[0], shEnd[1])}
            fill="none"
            stroke="#3070b6"
            strokeWidth="2.2"
          />
          {/* Shadow adj point */}
          <circle cx={map(shMid[0])} cy={map(-shMid[1])} r={6} fill="#3070b6" opacity="0.7" />
          {/* Highlights curve */}
          <path
            d={curvePath(hiStart[0], hiStart[1], hiMid[0], hiMid[1], hiEnd[0], hiEnd[1])}
            fill="none"
            stroke="#ecc10d"
            strokeWidth="2.2"
          />
          {/* Highlights adj point */}
          <circle cx={map(hiMid[0])} cy={map(-hiMid[1])} r={6} fill="#ecc10d" opacity="0.7" />
          {/* Midtones curve */}
          <path
            d={curvePath(midStart[0], midStart[1], midMid[0], midMid[1], midEnd[0], midEnd[1])}
            fill="none"
            stroke="#34aa4a"
            strokeWidth="2.2"
          />
          {/* Mids adj point */}
          <circle cx={map(midMid[0])} cy={map(-midMid[1])} r={6} fill="#34aa4a" opacity="0.7" />
          {/* Quadrant borders */}
          <rect x={map(-15)} y={map(15)} width={map(15)-map(-15)} height={map(-15)-map(15)} fill="none" stroke="#eee" strokeWidth="2"/>
        </svg>
        {/* Legend */}
        <div style={{ position: "absolute", left: 14, top: 10, fontSize: 12, color: "#555" }}>Shadows</div>
        <div style={{ position: "absolute", right: 12, bottom: 12, fontSize: 12, color: "#555" }}>Highlights</div>
        <div style={{ position: "absolute", left: "50%", top: "50%", fontSize: 12, color: "#555", transform: "translate(-50%,-50%)" }}>Mids</div>
      </div>
    </div>
  );
}
