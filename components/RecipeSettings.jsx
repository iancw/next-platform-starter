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
    <div className="recipe-card-settings-flex">
      <div
        className="saturation-wheel-container"
        style={{
          maxWidth: 280,
          minWidth: 280,
          flexShrink: 1,
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
      <ShadowMidsHighlightAdjust
        shadows={Number(recipe.Shadows ?? 0)}
        mids={Number(recipe.Mids ?? 0)}
        highlights={Number(recipe.Highlights ?? 0)}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        {(recipe.WhiteBalanceGreenShift !== undefined || recipe.WhiteBalanceAmberShift !== undefined) && (
          <div style={{ marginBottom: "1em" }}>
            <WhiteBalanceBox
              wb={recipe.WhiteBalance}
              keepWarm={recipe.KeepWarm}
              green={recipe.WhiteBalanceGreenShift ?? 0}
              amber={recipe.WhiteBalanceAmberShift ?? 0}
            />
          </div>
        )}
        <ImageAdjustSliders
          vignette={recipe.Vignette}
          sharpness={recipe.Sharpness}
          contrast={recipe.Contrast}
          exposureCompensation={recipe.ExposureCompensation || 0}
        />
      </div>
    </div>
  );
}
