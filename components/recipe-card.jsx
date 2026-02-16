import React from "react";
import RecipeSettings from "./RecipeSettings";
import Image from 'next/image';

function sanitize(str) {
  return str
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_");
}

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
      <h2 style={{ marginTop: 0, padding: "2rem", flex: "1 1 0" }}>{recipe.Name} ({recipe.Author})</h2>

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
          <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
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
      <div>
        <a
          href={`/oes/${sanitize(recipe.Author)}/${sanitize(recipe.Name)}/${sanitize(recipe.Author)}_${sanitize(recipe.Name)}.oes`}
          download
          style={{
            display: "inline-block",
            margin: "1rem 0",
            padding: "0.5rem 1rem",
            background: "#0070f3",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none"
          }}
        >
          Download OES file
        </a>
        {recipe.SampleImage && (<a
              href={`/images/${encodeURIComponent(recipe.Author)}/${encodeURIComponent(recipe.Name)}/${recipe.SampleImage}`}
              download
              style={{
                display: "inline-block",
                margin: "1rem 0 0.5rem 0",
                padding: "0.5rem 1rem",
                background: "#0070f3",
                color: "#fff",
                borderRadius: "4px",
                textDecoration: "none"
              }}
            >
              Download Image
            </a>)}
      </div>


      {recipe.Links && Array.isArray(recipe.Links) && recipe.Links.length > 0 && (
        <div>
          <strong>Links:</strong>
          <ul style={{ marginTop: 0, listStyleType: "disc", paddingLeft: "1.25em" }}>
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

    </div>
  );
}
