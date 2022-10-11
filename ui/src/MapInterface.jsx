import { useContext } from "react";
import { LayersContext } from "./LayersContext";

import "mapbox-gl/dist/mapbox-gl.css";

import Map from "react-map-gl";

import FlatgeobufLayer from "./FlatgeobufLayer";
import MapBoundsRetrieval from "./MapBoundsRetrieval";

const mapToken = import.meta.env.VITE_MAPBOX_GL_MAP;

/**
 *
 * It's the map.
 *
 * Standard react-map-gl setup.
 *
 *
 *
 * */

function MapInterface() {
  const { layersStatus } = useContext(LayersContext);

  const center = import.meta.env.VITE_MAP_INIT_CENTER.split(",") ?? [0, 0];
  const zoom = import.meta.env.VITE_MAP_INIT_ZOOM ?? 4;

  return (
    <>
      <section className="h-full w-full">
        <Map
          mapboxAccessToken={mapToken}
          initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v11"
        >
          {Object.values(layersStatus).map(({ name, type, enabled }, index) => (
            <FlatgeobufLayer
              name={name}
              type={type}
              enabled={enabled}
              key={name}
              index={index}
            />
          ))}
          <MapBoundsRetrieval />
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
