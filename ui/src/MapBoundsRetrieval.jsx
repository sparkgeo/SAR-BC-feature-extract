import { useContext, useEffect } from "react";
import { useMap } from "react-map-gl";
import { LayersContext } from "./LayersContext";

// Collects the map bounds for use in the extractor
function MapBoundsRetrieval() {
  const { current: map } = useMap();
  const { setMapBounds } = useContext(LayersContext);

  useEffect(() => {
    function updateBounds() {
      setMapBounds(map.getBounds().toArray());
    }

    updateBounds();
    map.on("moveend", updateBounds);

    return () => {
      map.off("moveend", updateBounds);
    };
  }, []);

  return <div>MapBoundsRetrieval</div>;
}

export default MapBoundsRetrieval;
