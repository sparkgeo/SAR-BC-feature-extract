import { useEffect, useRef, useState, useContext } from "preact/hooks";
import { LayersContext } from "./LayersContext";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { geojson } from "flatgeobuf";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_GL_MAP;
const baseApi = import.meta.env.VITE_API_BASE;

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
let layersCount = 0;

const generateEmptyFeatureClass = () => ({
  type: "FeatureCollection",
  features: [],
});

/** It's the map. Standard mapbox/maplibre setup with a possible addition of stuff? */
function MapInterface({ setMapBounds }) {
  const { layersStatus } = useContext(LayersContext);
  const mapRef = useRef(null);
  const [layersLoading, setLayersLoading] = useState(false);

  useEffect(() => {
    const center = import.meta.env.VITE_MAP_INIT_CENTER.split(",") ?? [0, 0];
    const zoom = import.meta.env.VITE_MAP_INIT_ZOOM ?? 4;

    const layers = Object.values(layersStatus);

    mapRef.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v11",
      center, // starting position
      zoom, // starting zoom
    });

    const map = mapRef.current;

    if (import.meta.env.MODE === "development") {
      window.map = map;
    }

    function loadData() {
      setLayersLoading(true);
      const mapBounds = {
        minX: map.getBounds().getNorthWest().lng,
        minY: map.getBounds().getSouthEast().lat,
        maxX: map.getBounds().getSouthEast().lng,
        maxY: map.getBounds().getNorthWest().lat,
      };
      setMapBounds(map.getBounds().toArray());

      const dataLoadingFunctions = [];

      for (const layer of layers) {
        const { name } = layer;
        const apiEndpoint = `${baseApi}/${name}/fgb`;
        const noSpaceName = name.split(" ").join("-");

        dataLoadingFunctions.push(
          (async function () {
            console.log("Function triggerd");

            let i = 0;
            const fc = generateEmptyFeatureClass();
            const iterable = geojson.deserialize(apiEndpoint, mapBounds);
            for await (let feature of iterable) {
              fc.features.push({ ...feature, id: i });
              i += 1;
            }
            map.getSource(noSpaceName).setData(fc);
            return fc;
          })()
        );
      }

      Promise.allSettled(dataLoadingFunctions).then(() => {
        setLayersLoading(false);
      });
    }

    // Trigger loading data on initial load as well as on move of features
    map.on("load", () => {
      const layers = Object.values(layersStatus);

      for (const layer of layers) {
        const { name, type, enabled } = layer;
        const noSpaceName = name.split(" ").join("-");

        if (type === "point") {
          map.addSource(noSpaceName, {
            type: "geojson",
            data: generateEmptyFeatureClass(),
          });
          map.addLayer({
            id: noSpaceName,
            type: "circle",
            source: noSpaceName,
            paint: {
              // Make circles larger as the user zooms from z12 to z22.
              "circle-radius": 5,
              // Color circles by shelter, using a `match` expression.
              "circle-color": colors[layersCount],
            },
            layout: {
              visibility: "none",
            },
          });
          layersCount++;
        } else if (type === "line") {
          map.addSource(noSpaceName, {
            type: "geojson",
            data: generateEmptyFeatureClass(),
          });
          map.addLayer({
            id: noSpaceName,
            type: "line",
            source: noSpaceName,
            layout: {
              visibility: "none",
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": colors[layersCount],
              "line-width": 2,
            },
          });
          layersCount++;
        } else if (type === "polygon") {
          throw new Error("Polygon data type not supported");
        } else {
          throw new Error(`Unknwon data type "${type}"`);
        }
      }

      loadData();
    });
    map.on("moveend", loadData);

    return () => {
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    Object.values(layersStatus).forEach(({ name, enabled }) => {
      const noSpaceName = name.split(" ").join("-");
      map
        .getLayer(noSpaceName)
        ?.setLayoutProperty("visibility", enabled ? "visible" : "none");
      map.triggerRepaint();
    });
  }, [mapRef, layersStatus]);

  return (
    <>
      <div className="w-full h-full" ref={mapRef} />
      <div
        className={`fixed bottom-0 left-0 p-2 bg-yellow-400 ${
          layersLoading ? "visible" : "hidden"
        }`}
      >
        loading...
      </div>
    </>
  );
}

export default MapInterface;
