import React from "react";

// Maps a domain coordinate (-15 to 15) to SVG (padding: 20, box: 260x260)
function map(val) {
  return 140 + (val * 130) / 15;
}

// Returns the path for a quadratic Bézier curve between start/mid/end
function curvePath(x1, y1, xm, ym, x2, y2) {
  return `M ${map(x1)},${map(-y1)} Q ${map(xm)},${map(-ym)} ${map(x2)},${map(-y2)}`;
}

export default function ShadowMidsHighlightAdjust({ shadows = 0, mids = 0, highlights = 0 }) {
  // Shadows
  const shStart = [-15, -15];
  const shEnd = [0, 0];

  let shMid = [-8, -8 + (Math.abs(shadows) < 4 ? 2.0 : 1.5) * Number(shadows)];

  // Highlights
  const hiStart = [0, 0];
  const hiEnd = [15, 15];
  const hiMid = [10, 10 + (Math.abs(highlights) < 4 ? 2.0 : 1.5) * Number(highlights)];

  // Mids
  const midStart = [-15, -15];
  const midEnd = [15, 15];
  const midMid = [0, 0 + (mids < 4 ? 5 : 2.5) * Number(mids)];

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
        border: "1px solid #353535",
        borderRadius: 6,
        width: 280,
        height: 280,
        margin: "auto",
        background: "#353535",
        position: "relative"
      }}>
        <svg viewBox="0 0 280 280" width={280} height={280}>
          {/* Axes */}
          <line x1={map(-15)} y1={map(0)} x2={map(15)} y2={map(0)} stroke="#616161" strokeWidth="1.2" />
          <line x1={map(0)} y1={map(-15)} x2={map(0)} y2={map(15)} stroke="#616161" strokeWidth="1.2" />
          {/* Shadow curve */}
          <path
            d={curvePath(shStart[0], shStart[1], shMid[0], shMid[1], shEnd[0], shEnd[1])}
            fill="none"
            stroke="#EFEFEF"
            strokeWidth="2.2"
          />
          {/* Highlights curve */}
          <path
            d={curvePath(hiStart[0], hiStart[1], hiMid[0], hiMid[1], hiEnd[0], hiEnd[1])}
            fill="none"
            stroke="#EFEFEF"
            strokeWidth="2.2"
          />
          {/* Midtones curve */}
          <path
            d={curvePath(midStart[0], midStart[1], midMid[0], midMid[1], midEnd[0], midEnd[1])}
            fill="none"
            stroke="#EFEFEF"
            strokeWidth="2.2"
          />
          {/* Quadrant borders */}
          <rect
            x={map(-15)}
            y={Math.min(map(-15), map(15))}
            width={Math.abs(map(15) - map(-15))}
            height={Math.abs(map(15) - map(-15))}
            fill="none"
            stroke="#eee"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}
