import React from "react";
import WhiteBalanceBox from "./white-balance-box";
import SaturationWheel from "./SaturationWheel";
import ImageAdjustSliders from "./ImageAdjustSliders";
import ShadowMidsHighlightAdjust from "./ShadowMidsHighlightAdjust";
import RecipeSettings from "./RecipeSettings";
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

      <RecipeSettings recipe={recipe} />
       <Image
        src={sampleImagePath}
        alt="Lighthouse"
        width={400}
        height={300}
      />
    </div>
  );
}
