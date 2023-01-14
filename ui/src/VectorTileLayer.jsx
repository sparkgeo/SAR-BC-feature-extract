import { useEffect, useState, useMemo } from "react";
import { useMap, Source, Layer } from "react-map-gl";

import { mapLayerStyle } from "./util/map-styles";

const baseApi = import.meta.env.VITE_API_BASE;

/**
 * Generates a source and layer for a mapbox vector tile source
 */
function VectorTileLayer(props) {
  const { name, type, metadata, enabled } = props;
  if (["point", "polygon", "line"].indexOf(type) === -1)
    throw new Error(`Unknown type "${type}" in layer ${name}`);
  const [bounds, setBounds] = useState(null);
  const [data, setData] = useState(null);

  const { current: map } = useMap();
  const apiEndpoint = useMemo(() => `${baseApi}/${name}/mvt/{z}/{x}/{y}`, [name, baseApi]);

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

  return (enabled ?
    <>
      <Source id={name} type='vector' tiles={[apiEndpoint]} vector_layers={[metadata]}></Source>
      <Layer
          id={name}
          type={type}
          source={name}
          source-layer={metadata.id}
          {...mapLayerStyle({ enabled, type, colour_hex: metadata.colour_hex })}
      ></Layer>
    </>
    :
    <></>
  );
}

export default VectorTileLayer;
