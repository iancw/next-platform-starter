import React from "react";
import Image from "next/image";

export default function RecipeSimpleCard({ recipe, onClick }) {
  // Truncate notes to 300 characters and append '...' if longer
  const getTruncatedNotes = (notes) => {
    if (!notes) return "";
    return notes.length > 300 ? notes.slice(0, 300) + "..." : notes;
  };
  return (
    <div
      className="recipe-simple-card"
      style={{
        border: "1px solid #eee",
        display: 'flex',
        flexDirection: 'column',
        borderRadius: "8px",
        padding: "1rem",
        margin: "1rem auto",
        background: "#fafbfc",
        align: "center",
        cursor: onClick ? "pointer" : undefined,
        maxWidth: "600px",
        width: "100%",
      }}
      onClick={onClick}
    >
      {recipe.SampleImage && (
        <div style={{ minWidth: 0 }}>
          <Image
            src={`/images/${encodeURIComponent(recipe.Author)}/${encodeURIComponent(recipe.Name)}/${recipe.SampleImage}`}
            alt={`${recipe.Name} sample`}
            width={600}
            height={450}
            style={{ borderRadius: "6px", maxWidth: "100%", height: "auto" }}
          />
        </div>
      )}
        <h3 style={{ margin: "0.5rem 0 0.75rem 0", fontSize: "1.35rem", lineHeight: 1.1 }}>
          {recipe.Name} -  {recipe.Author}
        </h3>
        <div style={{ color: "#555", marginBottom: "0.75rem" }}>
          {recipe.Notes && (
            <span style={{ whiteSpace: "pre-wrap" }}>
              {getTruncatedNotes(recipe.Notes)}
            </span>
          )}
        </div>
      </div>
  );
}
