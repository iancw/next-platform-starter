import React from "react";
import RecipeSettings from "./RecipeSettings";
import Image from 'next/image';

export default function RecipeCard({ recipe }) {
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


    {(recipe.Notes || recipe.SampleImage) && (
      <div
        className="notes-image"
        style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: "1.5rem",
        marginBottom: "1rem"
      }}>
        {recipe.Notes && (
          <div style={{ whiteSpace: "pre-wrap", marginBottom: "0.5rem", flex: "1 1 0", padding: "2rem" }}>
            {recipe.Notes}
          </div>
        )}
        {recipe.SampleImage && (
          <div style={{ flex: "0 0 auto" }}>
            <Image
              src={`/images/${encodeURIComponent(recipe.Author)}/${encodeURIComponent(recipe.Name)}/${recipe.SampleImage}`}
              alt="Lighthouse"
              width={400}
              height={300}
              style={{ borderRadius: "4px", maxWidth: "100%", height: "auto" }}
            />
          </div>
        )}
      </div>
    )}

    <RecipeSettings recipe={recipe} />


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
       <p>
        <strong>Author:</strong> {recipe.Author || "Unknown"}
      </p>

    </div>
  );
}
