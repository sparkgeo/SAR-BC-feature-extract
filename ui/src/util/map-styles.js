const lineLayer = (enabled, colour_hex) => ({
  type: "line",
  layout: {
    visibility: enabled ? "visible" : "none",
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": `#${colour_hex}`,
    "line-width": 2,
  },
});

const fillLayer = (enabled, colour_hex) => {
  throw new Error("Fill layer not implemented");
};

const pointLayer = (enabled, colour_hex) => ({
  type: "circle",
  paint: {
    // Make circles larger as the user zooms from z12 to z22.
    "circle-radius": 5,
    // Color circles by shelter, using a `match` expression.
    "circle-color": `#${colour_hex}`,
  },
  layout: {
    visibility: enabled ? "visible" : "none",
  },
});

export const mapLayerStyle = ({ enabled, type, colour_hex }) => {
  const options = {
    point: pointLayer,
    line: lineLayer,
    fill: fillLayer,
  };

  return options[type](enabled, colour_hex);
};
