import React from "react";
import WhiteBalanceBox from "./white-balance-box";
import SaturationWheel from "./SaturationWheel";
import ImageAdjustSliders from "./ImageAdjustSliders";
import ShadowMidsHighlightAdjust from "./ShadowMidsHighlightAdjust";
import Image from 'next/image';

export default function RecipeCard({ recipe }) {
  const sampleImagePath = `/images/${encodeURIComponent(recipe.Author)}/${encodeURIComponent(recipe.Name)}/lighthouse.jpg`
  return (
    <div
      className="recipe-card"
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "1rem",
        margin: "1rem 0",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
      }}
    >
      <h2 style={{ marginTop: 0 }}>{recipe.Name}</h2>

      <p>
        <strong>Author:</strong> {recipe.Author || "Unknown"}
      </p>

      {recipe.Notes && (
        <div>
          <strong>Notes:</strong>
          <div style={{ whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}>
            {recipe.Notes}
          </div>
        </div>
      )}
      {(recipe.ExposureCompensation) && (
        <div>
          <strong>Exposure Notes:</strong>
          <div style={{ whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}>
            {recipe.ExposureCompensation}
          </div>
        </div>
      )}
      {recipe.Links && Array.isArray(recipe.Links) && recipe.Links.length > 0 && (
        <div>
          <strong>Links:</strong>
          <ul style={{ marginTop: 0 }}>
            {recipe.Links.map((url, i) => (
              <li key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(recipe.WhiteBalanceGreenShift !== undefined || recipe.WhiteBalanceAmberShift !== undefined) && (
        <div style={{ margin: "0.75rem 0" }}>
          {(recipe.KeepWarm || recipe.WhiteBalance) && (
            <div
              style={{
                marginBottom: "0.5em",
                background: "#f9f7ed",
                borderRadius: 6,
                padding: "0.5em 1em",
                border: "1px solid #efa",
                fontSize: 15,
                color: "#604800",
                fontWeight: 500,
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              {recipe.KeepWarm && (
                <div>
                  <span style={{ fontWeight: 600 }}>Keep Warm Color:</span>{" "}
                  {recipe.KeepWarm}
                </div>
              )}
              {recipe.WhiteBalance && (
                <div>
                  <span style={{ fontWeight: 600 }}>White Balance:</span>{" "}
                  {recipe.WhiteBalance + " K" || "Auto"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: "1.5rem",
          margin: "1.5rem 0"
        }}
      >
        <div style={{
          maxWidth: 280,
          flexShrink: 0,
          border: "1px solid #353535",
          borderRadius: 6,
          background: "#353535",
          padding: 8,
          margin: "auto"
        }}>
          <SaturationWheel
            values={[
              Number(recipe.Yellow ?? 0),
              Number(recipe.Orange ?? 0),
              Number(recipe.OrangeRed ?? 0),
              Number(recipe.Red ?? 0),
              Number(recipe.RedMagenta ?? 0),
              Number(recipe.Magenta ?? 0),
              Number(recipe.Blue ?? 0),
              Number(recipe.BlueCyan ?? 0),
              Number(recipe.Cyan ?? 0),
              Number(recipe.CyanGreen ?? 0),
              Number(recipe.Green ?? 0),
              Number(recipe.GreenYellow ?? 0)
            ]}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <ShadowMidsHighlightAdjust
            shadows={Number(recipe.Shadows ?? 0)}
            mids={Number(recipe.Mids ?? 0)}
            highlights={Number(recipe.Highlights ?? 0)}
          />
        </div>
        <div style={{ minWidth: 180, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          {(recipe.WhiteBalanceGreenShift !== undefined || recipe.WhiteBalanceAmberShift !== undefined) && (
            <div style={{ marginBottom: "1em" }}>
              <WhiteBalanceBox
                green={recipe.WhiteBalanceGreenShift ?? 0}
                amber={recipe.WhiteBalanceAmberShift ?? 0}
              />
            </div>
          )}
          <ImageAdjustSliders
            vignette={recipe.Vignette}
            sharpness={recipe.Sharpness}
            contrast={recipe.Contrast}
          />
        </div>
      </div>
       <Image
        src={sampleImagePath}
        alt="Lighthouse"
        width={400}
        height={300}
      />
    </div>
  );
}
