import React from "react";

export default function ImageAdjustSliders({ vignette = 0, sharpness = 0, contrast = 0 }) {
  return (
    <div style={{ margin: "1rem 0" }}>
      <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center" }}>
        <span style={{ width: 100, display: "inline-block" }}>Vignette: {vignette}</span>
        <input
          type="range"
          min={-5}
          max={5}
          step={1}
          value={vignette}
          disabled
          style={{ width: 160 }}
        />
      </div>
      <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center" }}>
        <span style={{ width: 100, display: "inline-block" }}>Sharpness: {sharpness}</span>
        <input
          type="range"
          min={-2}
          max={2}
          step={1}
          value={sharpness}
          disabled
          style={{ width: 160 }}
        />
      </div>
      <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center" }}>
        <span style={{ width: 100, display: "inline-block" }}>Contrast: {contrast}</span>
        <input
          type="range"
          min={-2}
          max={2}
          step={1}
          value={contrast}
          disabled
          style={{ width: 160 }}
        />
      </div>
    </div>
  );
}
