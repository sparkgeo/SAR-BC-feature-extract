import { useState, createContext } from "react";

export const LayersContext = createContext({
  layersStatus: {},
  updateLayersStatus() {},
  initializeLayers() {},
});

export const LayersContextProvider = ({ children }) => {
  const [layersStatus, setLayersStatus] = useState({});

  /**
   * Updates the status of a single layer
   *
   * @param {String} key the layer name
   * @param {Boolean} enabled the status of the layer
   *
   */
  const updateLayersStatus = ({ key, enabled }) => {
    const updatedStatus = { ...layersStatus };
    updatedStatus[key] = { ...updatedStatus[key], enabled };
    setLayersStatus(updatedStatus);
  };

  const initializeLayers = (layersArr) => {
    const layers = {};
    for (const layer of layersArr) {
      layers[layer.name] = { ...layer, enabled: false };
    }
    setLayersStatus(layers);
  };

  return (
    <LayersContext.Provider
      value={{ layersStatus, updateLayersStatus, initializeLayers }}
    >
      {children}
    </LayersContext.Provider>
  );
};
