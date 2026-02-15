import React from "react";
import WhiteBalanceBox from "./white-balance-box";
import SaturationWheel from "./SaturationWheel";
import ImageAdjustSliders from "./ImageAdjustSliders";

export default function RecipeCard({
  name,
  author,
  notes,
  tips,
  links,
  green,
  amber,
  Yellow,
  Orange,
  OrangeRed,
  Red,
  RedMagenta,
  Magenta,
  Blue,
  BlueCyan,
  Cyan,
  CyanGreen,
  Green,
  GreenYellow,
  vignette,
  sharpness,
  contrast
}) {
  return (
    <div className="recipe-card" style={{
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "1rem",
      margin: "1rem 0",
      background: "#fff",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
    }}>
      <h2 style={{ marginTop: 0 }}>{name}</h2>

      <p><strong>Author:</strong> {author || "Unknown"}</p>
      {notes && (
        <div>
          <strong>Notes:</strong>
          <div style={{ whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}>{notes}</div>
        </div>
      )}
      {tips && (
        <div>
          <strong>Various/Tips:</strong>
          <div style={{ whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}>{tips}</div>
        </div>
      )}
      {links && Array.isArray(links) && links.length > 0 && (
        <div>
          <strong>Links:</strong>
          <ul style={{ marginTop: 0 }}>
            {links.map((url, i) => (
              <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>
            ))}
          </ul>
        </div>
      )}
       {(green !== undefined || amber !== undefined) && (
        <div style={{ margin: "0.75rem 0" }}>
          <WhiteBalanceBox
            green={green ?? 0}
            amber={amber ?? 0}
          />
        </div>
      )}
      <div style={{maxWidth: 260}}>
        <SaturationWheel
          values={[
            Number(Yellow ?? 0),
            Number(Orange ?? 0),
            Number(OrangeRed ?? 0),
            Number(Red ?? 0),
            Number(RedMagenta ?? 0),
            Number(Magenta ?? 0),
            Number(Blue ?? 0),
            Number(BlueCyan ?? 0),
            Number(Cyan ?? 0),
            Number(CyanGreen ?? 0),
            Number(Green ?? 0),
            Number(GreenYellow ?? 0)
          ]}
        />
      </div>
      <ImageAdjustSliders
        vignette={vignette}
        sharpness={sharpness}
        contrast={contrast}
      />
    </div>
  );
}
