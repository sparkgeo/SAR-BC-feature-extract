// List of htmlSafeColors
const colors = [
  "blue",
  "navy",
  "red",
  "fuchsia",
  "green",
  "aqua",
  "yellow",
  "gray",
  "lime",
  "maroon",
  "olive",
  "purple",
  "silver",
  "teal",
  "white",
];

const lineLayer = (enabled, layersCount) => ({
  type: "line",
  layout: {
    visibility: enabled ? "visible" : "none",
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": colors[layersCount],
    "line-width": 2,
  },
});

const fillLayer = (enabled, layersCount) => {
  throw new Error("Fill layer not implemented");
};

const pointLayer = (enabled, layersCount) => ({
  type: "circle",
  paint: {
    // Make circles larger as the user zooms from z12 to z22.
    "circle-radius": 5,
    // Color circles by shelter, using a `match` expression.
    "circle-color": colors[layersCount],
  },
  layout: {
    visibility: enabled ? "visible" : "none",
  },
});

export const mapLayerStyle = ({ enabled, layersCount, type }) => {
  const options = {
    point: pointLayer,
    line: lineLayer,
    fill: fillLayer,
  };

  return options[type](enabled, layersCount);
};
