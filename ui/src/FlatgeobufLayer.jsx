import { useEffect, useState, useMemo } from "react";
import { useMap, Source, Layer } from "react-map-gl";

import { mapLayerStyle } from "./util/map-styles";
import { geojson } from "flatgeobuf";

const baseApi = import.meta.env.VITE_API_BASE;

const generateEmptyFeatureClass = () => ({
  type: "FeatureCollection",
  features: [],
});

/**
 * Generates a source and layer for a flatgeobuf dile
 */
function FlatgeobufLayer(props) {
  const { name, type, enabled, index } = props;
  if (["point", "polygon", "line"].indexOf(type) === -1)
    throw new Error(`Unknown type "${type}" in layer ${name}`);
  const [bounds, setBounds] = useState(null);
  const [data, setData] = useState(null);

  const { current: map } = useMap();
  const apiEndpoint = useMemo(() => `${baseApi}/${name}/fgb`, [name, baseApi]);

  // const zoom = map.getZoom();
  // const bounds = map.getBounds();

  useEffect(() => {
    function updateBounds() {
      // Set to string in order to allow for change detection
      setBounds(map.getBounds().toArray().flat().join(","));
    }

    updateBounds();
    map.on("moveend", () => {
      updateBounds();
    });
    return () => {
      map.off("moveend", updateBounds);
    };
  }, []);

  useEffect(() => {
    async function retrieveData() {
      const [minX, minY, maxX, maxY] = bounds.split(",");
      const mapBounds = {
        minX,
        minY,
        maxX,
        maxY,
      };

      let i = 0;
      const fc = generateEmptyFeatureClass();
      const iterable = geojson.deserialize(apiEndpoint, mapBounds);
      for await (let feature of iterable) {
        fc.features.push({ ...feature, id: i });
        i += 1;
      }
      setData(fc);
    }

    if (enabled && bounds) retrieveData();
  }, [bounds, enabled]);

  if (!data) return <></>;

  return (
    <Source type="geojson" id={name} data={data}>
      <Layer {...mapLayerStyle({ enabled, type, index })} />
    </Source>
  );
}

export default FlatgeobufLayer;
