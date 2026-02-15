import React from "react";
import SaturationWheel from "./SaturationWheel";
import ShadowMidsHighlightAdjust from "./ShadowMidsHighlightAdjust";
import WhiteBalanceBox from "./white-balance-box";
import ImageAdjustSliders from "./ImageAdjustSliders";

/**
 * Props:
 *  - recipe: the recipe data object as used in RecipeCard
 */
export default function RecipeSettings({ recipe }) {
  return (
    <div className="recipe-card-flex">
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
        <ImageAdjustSliders
          vignette={recipe.Vignette}
          sharpness={recipe.Sharpness}
          contrast={recipe.Contrast}
        />
      </div>
    </div>
  );
}
