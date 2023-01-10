import { useContext } from "react";
import { LayersContext } from "./LayersContext";
import { AuthContext } from "./AuthContext";

import "mapbox-gl/dist/mapbox-gl.css";

import Map from "react-map-gl";
import base64 from "base-64";

import VectorTileLayer from "./VectorTileLayer";
import MapBoundsRetrieval from "./MapBoundsRetrieval";

const mapToken = import.meta.env.VITE_MAPBOX_GL_MAP;

const baseApi = import.meta.env.VITE_API_BASE;

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
  const { user, pass } = useContext(AuthContext);

  const center = import.meta.env.VITE_MAP_INIT_CENTER.split(",") ?? [0, 0];
  const zoom = import.meta.env.VITE_MAP_INIT_ZOOM ?? 4;

  const requestAuthorizer = (url, resourceType) => {
    if (resourceType === 'Tile' && url.startsWith(baseApi)) {
      return {
        url: url,
        headers: { 'Authorization': 'Basic ' + base64.encode(`${user}:${pass}`) }
      }
    }
  }

  return (
    <>
      <section className="h-full w-full">
        <Map
          mapboxAccessToken={mapToken}
          initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v11"
          transformRequest={requestAuthorizer}
        >
          {Object.values(layersStatus).map(({ name, type, enabled }, index) => (
            <VectorTileLayer
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
