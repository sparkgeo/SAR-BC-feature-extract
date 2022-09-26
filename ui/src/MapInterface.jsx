import { useEffect, useRef, useState } from "preact/hooks";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { geojson } from "flatgeobuf";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_GL_MAP;

const roadSegments =
  "https://brian-search-rescue-test-bucket.s3.amazonaws.com/line-road-segments.fgb";

// const roadSegments =
//   "http://ecsal-albfa-1i6jhj514tazu-125558200.us-west-2.elb.amazonaws.com/Shelters/fgb";

const shelterPoints =
  "https://brian-search-rescue-test-bucket.s3.amazonaws.com/point-shelters.fgb";
const trailSegments =
  "https://brian-search-rescue-test-bucket.s3.amazonaws.com/point-trails.fgb";

const generateEmptyFeatureClass = () => ({
  type: "FeatureCollection",
  features: [],
});

/** It's the map. Standard mapbox/maplibre setup with a possible addition of stuff? */
function MapInterface({ setMapBounds, layersVisible }) {
  const mapRef = useRef(null);
  const [layersLoading, setLayersLoading] = useState(false);

  useEffect(() => {
    const center = import.meta.env.VITE_MAP_INIT_CENTER.split(",") ?? [0, 0];
    const zoom = import.meta.env.VITE_MAP_INIT_ZOOM ?? 4;

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

      // Load road segments

      async function loadRoadSegments() {
        let i = 0;
        const fc = generateEmptyFeatureClass();
        const iterable = geojson.deserialize(
          roadSegments,
          mapBounds
          // handleHeaderMeta
        );
        for await (let feature of iterable) {
          fc.features.push({ ...feature, id: i });
          i += 1;
        }
        map.getSource("roads").setData(fc);
        return fc;
      }

      async function loadTrailSegments() {
        let i = 0;
        const fc = generateEmptyFeatureClass();
        const iterable = geojson.deserialize(
          trailSegments,
          mapBounds
          // handleHeaderMeta
        );
        for await (let feature of iterable) {
          fc.features.push({ ...feature, id: i });
          i += 1;
        }
        map.getSource("trails").setData(fc);
        return fc;
      }

      async function loadShelterPoints() {
        let i = 0;

        const fc = generateEmptyFeatureClass();
        const iterable = geojson.deserialize(
          shelterPoints,
          mapBounds
          // handleHeaderMeta
        );
        for await (let feature of iterable) {
          fc.features.push({ ...feature, id: i });
          i += 1;
        }
        map.getSource("shelter").setData(fc);

        return fc;
      }

      Promise.allSettled([
        loadRoadSegments(),
        loadShelterPoints(),
        loadTrailSegments(),
      ]).then(() => {
        setLayersLoading(false);
      });
    }

    // Trigger loading data on initial load as well as on move of features
    map.on("load", () => {
      map.addSource("trails", {
        type: "geojson",
        data: generateEmptyFeatureClass(),
      });
      map.addLayer({
        id: "trails",
        type: "line",
        source: "trails",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "red",
          "line-width": 2,
        },
      });

      map.addSource("roads", {
        type: "geojson",
        data: generateEmptyFeatureClass(),
      });
      map.addLayer({
        id: "roads",
        type: "line",
        source: "roads",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "yellow",
          "line-width": 2,
        },
      });

      map.addSource("shelter", {
        type: "geojson",
        data: generateEmptyFeatureClass(),
      });
      map.addLayer({
        id: "shelter",
        type: "circle",
        source: "shelter",
        paint: {
          // Make circles larger as the user zooms from z12 to z22.
          "circle-radius": 5,
          // Color circles by shelter, using a `match` expression.
          "circle-color": "blue",
        },
      });

      loadData();
    });
    map.on("moveend", loadData);

    return () => {
      mapRef.current = null;
    };
  }, []);

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
