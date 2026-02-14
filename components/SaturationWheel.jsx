import React from "react";

const COLORS = [
  { name: "Yellow", hex: "#FCF750" },
  { name: "Orange", hex: "#DBA12A" },
  { name: "OrangeRed", hex: "#CC1210" },
  { name: "Red", hex: "#CD076B" },
  { name: "RedMagenta", hex: "#970AA0" },
  { name: "Magenta", hex: "#7710E8" },
  { name: "Blue", hex: "#3054E0" },
  { name: "BlueCyan", hex: "#5392EB" },
  { name: "Cyan", hex: "#83E7EB" },
  { name: "CyanGreen", hex: "#87EE77" },
  { name: "Green", hex: "#9DEE3A" },
  { name: "GreenYellow", hex: "#CBEE3A" }
];

// Geometry
const POINTS = 12;
const RADIUS_MIN = 45;
const RADIUS_MAX = 90;
const SIZE = 250;
const CENTER = SIZE / 2;
const VERTEX_RADIUS = 5; // colored marker size

/**
 * SaturationWheel component
 * @param {Object} props
 * @param {number[]} props.values - Array of 12 saturation values, one for each color, in order starting with Yellow.
 */
const SaturationWheel = ({ values = [] }) => {
  // Pad or truncate values to exactly 12 elements, defaulting to 0 if missing.
  const satVals = Array.from({ length: POINTS }, (_, i) => {
    const v = values && values[i] != null ? values[i] : 0;
    // Clamp between -5..5 just in case
    return Math.max(-5, Math.min(5, v));
  });

  // Normalize each value into a radius: -5 => RADIUS_MIN, 0 => avg, +5 => RADIUS_MAX
  const getRadius = (val) =>
    ((val + 5) / 10) * (RADIUS_MAX - RADIUS_MIN) + RADIUS_MIN;

  // Calculate vertex positions according to each value
  const angleStep = (2 * Math.PI) / POINTS;
  const vertices = Array.from({ length: POINTS }, (_, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = getRadius(satVals[i]);
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle)
    };
  });

  // Build points string for polygon fill
  const polygonPoints = vertices.map(v => `${v.x},${v.y}`).join(" ");

  // Outer polygon (maximum saturation, thick colored lines, colored transparent fill)
  const outerVertices = Array.from({ length: POINTS }, (_, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    return {
      x: CENTER + RADIUS_MAX * Math.cos(angle),
      y: CENTER + RADIUS_MAX * Math.sin(angle)
    };
  });
  const outerPolygonPoints = outerVertices.map(v => `${v.x},${v.y}`).join(" ");

  // Helper to blend colors (simple average in RGB space for 2 hex strings)
  const blendHex = (hex1, hex2, t = 0.5) => {
    const c1 = hex1.match(/.{2}/g).map(x => parseInt(x, 16));
    const c2 = hex2.match(/.{2}/g).map(x => parseInt(x, 16));
    const c = c1.map((v, i) => Math.round(v * (1 - t) + c2[i] * t));
    return `#${c.map(x => x.toString(16).padStart(2,'0')).join('')}`;
  };

  // For the fill, we'll just use the average color of all the vertices, semi-transparent
  const avgColorHex = (() => {
    const cs = COLORS.map(c => c.hex.replace('#','')).map(h => ({
      r: parseInt(h.substr(0,2),16),
      g: parseInt(h.substr(2,2),16),
      b: parseInt(h.substr(4,2),16)
    }));
    const avg = cs.reduce((a,v) => ({
      r: a.r + v.r/POINTS,
      g: a.g + v.g/POINTS,
      b: a.b + v.b/POINTS
    }), {r:0,g:0,b:0});
    return `rgba(${Math.round(avg.r)},${Math.round(avg.g)},${Math.round(avg.b)},0.32)`;
  })();

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: "block" }}>
      {/* Background */}
      <rect x="0" y="0" width={SIZE} height={SIZE} fill="#2A2A2A" />
      {/* Outer polygon semi-transparent averaged color fill */}
      <polygon
        points={outerPolygonPoints}
        fill={avgColorHex}
        stroke="none"
      />
      {/* Outer polygon thick colored lines, each edge colored per vertex */}
      {outerVertices.map((v, i) => {
        const next = outerVertices[(i + 1) % POINTS];
        // Use gradient along edge? SVG can't do line-specific gradients easily, so blend start and end
        const cA = COLORS[i].hex;
        const cB = COLORS[(i + 1) % POINTS].hex;
        const edgeColor = blendHex(cA.replace('#',''), cB.replace('#',''));
        return (
          <line
            key={`outer-line-${i}`}
            x1={v.x}
            y1={v.y}
            x2={next.x}
            y2={next.y}
            stroke={cA}
            strokeWidth={7}
            strokeLinecap="round"
          />
        );
      })}
      {/* Outer vertex circles, for easier color fill perception - optional */}
      {/* {outerVertices.map((v, i) => (
        <circle
          key={`outer-dot-${i}`}
          cx={v.x}
          cy={v.y}
          r={VERTEX_RADIUS * 0.86}
          fill={COLORS[i].hex}
          stroke="none"
          opacity={0.65}
        />
      ))} */}
      {/* Main polygon (user-data polygon) */}
      <polygon
        points={polygonPoints}
        fill="rgba(220,220,220,0.55)"
        stroke="none"
      />
      {/* White lines connecting vertices */}
      {vertices.map((v, i) => {
        const next = vertices[(i + 1) % POINTS];
        return (
          <line
            key={`line-${i}`}
            x1={v.x}
            y1={v.y}
            x2={next.x}
            y2={next.y}
            stroke="#fff"
            strokeWidth="2"
          />
        );
      })}
      {/* Colored circles at each vertex */}
      {vertices.map((v, i) => (
        <circle
          key={`circle-${i}`}
          cx={v.x}
          cy={v.y}
          r={VERTEX_RADIUS}
          fill={COLORS[i].hex}
          stroke={COLORS[i].hex}
          strokeWidth="1"
          style={{
            filter: "drop-shadow(0 0 3px rgba(0,0,0,0.24))"
          }}
        />
      ))}
      {/* Saturation offset values as numbers outside the main circle */}
      {vertices.map((v, i) => {
        // Place the text further out than the outermost polygon for visibility
        const angle = -Math.PI / 2 + i * angleStep;
        const textRadius = RADIUS_MAX + 20;
        const x = CENTER + textRadius * Math.cos(angle);
        const y = CENTER + textRadius * Math.sin(angle);
        return (
          <text
            key={`sat-value-${i}`}
            x={x}
            y={y}
            fill="#fff"
            fontSize="16"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              textShadow: "0 0 3px #222"
            }}
          >
            {satVals[i]}
          </text>
        );
      })}
    </svg>
  );
};

export default SaturationWheel;
