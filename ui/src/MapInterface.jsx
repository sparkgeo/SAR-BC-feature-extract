import { useEffect, useRef, useState, useContext } from "react";
import { LayersContext } from "./LayersContext";

import "mapbox-gl/dist/mapbox-gl.css";

import { geojson } from "flatgeobuf";
import Map, { Source, Layer } from "react-map-gl";

import FlatgeobufLayer from "./FlatgeobufLayer";

const mapToken = import.meta.env.VITE_MAPBOX_GL_MAP;
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
const makeNoSpaceName = (name) => name.split(" ").join("-");

const generateEmptyFeatureClass = () => ({
  type: "FeatureCollection",
  features: [],
});

function initializeLayers({
  map,
  layersStatus,
  initialLayersLoaded,
  setInitialLayersLoaded,
}) {
  if (initialLayersLoaded) return;
  const layers = Object.values(layersStatus);

  for (const layer of layers) {
    const { name, type, enabled } = layer;
    const noSpaceName = makeNoSpaceName(name);

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
          visibility: enabled ? "visible" : "none",
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
          visibility: enabled ? "visible" : "none",
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
  setInitialLayersLoaded(true);
}

function loadData({ map, layersStatus, setLayersLoading, setMapBounds }) {
  setLayersLoading(true);
  const mapBounds = {
    minX: map.getBounds().getNorthWest().lng,
    minY: map.getBounds().getSouthEast().lat,
    maxX: map.getBounds().getSouthEast().lng,
    maxY: map.getBounds().getNorthWest().lat,
  };
  setMapBounds(map.getBounds().toArray());

  const dataLoadingFunctions = [];
  const layers = Object.values(layersStatus);
  for (const layer of layers) {
    const { name } = layer;
    const apiEndpoint = `${baseApi}/${name}/fgb`;

    dataLoadingFunctions.push(
      (async function () {
        let i = 0;
        const fc = generateEmptyFeatureClass();
        const iterable = geojson.deserialize(apiEndpoint, mapBounds);
        for await (let feature of iterable) {
          fc.features.push({ ...feature, id: i });
          i += 1;
        }
        map.getSource(makeNoSpaceName(name)).setData(fc);
        return fc;
      })()
    );
  }

  Promise.allSettled(dataLoadingFunctions).then(() => {
    setLayersLoading(false);
  });
}

/** It's the map. Standard mapbox/maplibre setup with a possible addition of stuff? */
function MapInterface({ setMapBounds }) {
  const [mapLayers, setMapLayers] = useState(<></>);
  const { layersStatus } = useContext(LayersContext);
  const mapRef = useRef(null);
  const [layersLoading, setLayersLoading] = useState(false);
  const [mapboxInitialized, setMapboxInitialized] = useState(false);
  const [initialLayersLoaded, setInitialLayersLoaded] = useState(false);

  const center = import.meta.env.VITE_MAP_INIT_CENTER.split(",") ?? [0, 0];
  const zoom = import.meta.env.VITE_MAP_INIT_ZOOM ?? 4;

  // const initialLoad = !(mapboxInitialized || initialLayersLoaded);
  // const initialLoad = true;

  // // Handle layer initalization
  // useEffect(() => {
  //   console.log("Initial layers loaded ", initialLayersLoaded);

  //   if (
  //     !mapboxInitialized ||
  //     !Object.keys(layersStatus).length ||
  //     initialLayersLoaded
  //   ) {
  //     return;
  //   }

  //   const map = mapRef.current;
  //   initializeLayers({
  //     map,
  //     layersStatus,
  //     initialLayersLoaded,
  //     setInitialLayersLoaded,
  //   });
  //   loadData({
  //     map,
  //     layersStatus,
  //     setLayersLoading,
  //     setMapBounds,
  //     setInitialLoad: setInitialLayersLoaded,
  //   });
  // }, [mapboxInitialized, layersStatus, initialLayersLoaded]);

  // // Handle dismount
  // useEffect(
  //   () => () => {
  //     mapRef.current = null;
  //   },
  //   []
  // );

  // useEffect(() => {
  //   if (!mapRef.current || initialLoad) return;
  //   const map = mapRef.current;

  //   Object.values(layersStatus).forEach(({ name, enabled }) => {
  //     const noSpaceName = makeNoSpaceName(name);
  //     map
  //       .getLayer(noSpaceName)
  //       ?.setLayoutProperty("visibility", enabled ? "visible" : "none");
  //     map.triggerRepaint();
  //   });
  // }, [mapRef, layersStatus, initialLoad]);

  return (
    <>
      <section className="h-full w-full">
        <Map
          mapboxAccessToken={mapToken}
          initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v11"
        >
          {Object.values(layersStatus).map(({ name, type, enabled }) => (
            <FlatgeobufLayer
              name={name}
              type={type}
              enabled={enabled}
              key={name}
            />
          ))}
        </Map>
      </section>
      {/* <div
        className={`fixed bottom-0 left-0 p-2 bg-yellow-400 ${
          layersLoading || initialLoad ? "visible" : "hidden"
        }`}
      >
        loading...
      </div> */}
    </>
  );
}

export default MapInterface;
