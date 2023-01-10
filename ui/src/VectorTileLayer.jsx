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
function VectorTileLayer(props) {
  const { name, type, enabled, index } = props;
  if (["point", "polygon", "line"].indexOf(type) === -1)
    throw new Error(`Unknown type "${type}" in layer ${name}`);
  const [bounds, setBounds] = useState(null);
  const [data, setData] = useState(null);

  const { current: map } = useMap();
  const apiEndpoint = useMemo(() => `${baseApi}/${name}/mvt/{z}/{x}/{y}`, [name, baseApi]);

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


  // if (!data) return <></>;

  return (
    <>
    <Source id={name} type='vector' tiles={[apiEndpoint]} vector_layers={[{
            "id": "TRANSPORT_LINE",
            "description": "",
            "minzoom": 0,
            "maxzoom": 14,
            "fields": {
                "DEACTIVATION_DATE": "String",
                "STRUCTURED_NAME_1": "String",
                "TRANSPORT_LINE_ID": "Mixed"
            }
        }]}></Source>
    <Layer
        id={name}
        type={type}
        source={name}
        source-layer="TRANSPORT_LINE"
        layout={{
            'line-join': 'round',
            'line-cap': 'round'
        }}
        paint={{
            'line-color': '#e1ad01',
            'line-width': 1
        }}
    ></Layer>
    </>
    

    // <Source type="geojson" id={name} data={data}>
    //   <Layer {...mapLayerStyle({ enabled, type, index })} />
    // </Source>
  );
}

export default VectorTileLayer;
