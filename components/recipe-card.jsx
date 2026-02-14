import React from "react";

export default function RecipeCard({ name, author, notes, tips, links }) {
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
    </div>
  );
}
