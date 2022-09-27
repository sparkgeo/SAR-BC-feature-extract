import { useState } from "preact/hooks";
import { saveAs } from "file-saver";
import { useApi } from "./hooks/useApi";
import ButtonLoading from "./ButtonLoading";

function PanelExtraction({ layersVisible, setLayersVisible, mapBounds }) {
  const [errors, setErrors] = useState({
    trails: false,
    roads: false,
    shelters: false,
  });
  const { api, loading } = useApi();

  const NumberIndicator = ({ children }) => (
    <div className="bg-emerald-600 text-white text-xl rounded-full p-2 w-10 h-10 flex justify-center items-center">
      {children}
    </div>
  );

  const handleLayerSelect = (layer) => () => {
    setLayersVisible({ ...layersVisible, [layer]: !layersVisible[layer] });
  };

  async function downloading() {
    const { roads, trails, shelters } = layersVisible;
    const [[xMin, yMax], [xMax, yMin]] = mapBounds;

    if (shelters) {
      try {
        const data = await api(
          `/Shelters/export/${xMin}/${yMin}/${xMax}/${yMax}`
        );

        var blob = new Blob([JSON.stringify(data)], {
          type: "text/plain;charset=utf-8",
        });
        saveAs(blob, "extracted-shelters.json");
      } catch (e) {
        setErrors({ ...errors, shelters: true });
      }
    }
    if (trails) {
      try {
        const data = await api(
          `/Trails/export/${xMin}/${yMin}/${xMax}/${yMax}`
        );

        var blob = new Blob([JSON.stringify(data)], {
          type: "text/plain;charset=utf-8",
        });
        saveAs(blob, "extracted-trails.json");
      } catch (e) {
        setErrors({ ...errors, trails: true });
      }
    }
    if (roads) {
      try {
        const data = await api(
          `/Resource Roads/export/${xMin}/${yMin}/${xMax}/${yMax}`
        );
        var blob = new Blob([JSON.stringify(data)], {
          type: "text/plain;charset=utf-8",
        });
        saveAs(blob, "extracted-resource-roads.json");
      } catch (e) {
        setErrors({ ...errors, roads: true });
      }
    }
  }

  const disabled = !(
    layersVisible.shelters ||
    layersVisible.roads ||
    layersVisible.trails
  );

  return (
    <section className="rounded-lg fixed z-20 right-10 bottom-20 px-4 pb-6 bg-white shadow-xl">
      <h2 className="text-2xl my-2">Add more content to SARTopo:</h2>
      <div className="flex flex-row items-center my-2">
        <NumberIndicator>1</NumberIndicator>
        <span className="ml-4 text-xl">Pan map to Area of Interest</span>
      </div>
      <div className="flex flex-row items-center my-2">
        <NumberIndicator>2</NumberIndicator>
        <span className="ml-4 text-xl">Select Datasets</span>
      </div>
      <div className="ml-12 select-none grid grid-cols-3 gap-x-2">
        <div className="flex flex-row">
          <input
            type="checkbox"
            name=""
            id="layer1"
            className="mr-2"
            checked={layersVisible.shelters}
            onChange={handleLayerSelect("shelters")}
          />
          <label htmlFor="layer1">shelters</label>
        </div>
        <div className="flex flex-row">
          <input
            type="checkbox"
            name=""
            id="layer2"
            className="mr-2"
            checked={layersVisible.roads}
            onChange={handleLayerSelect("roads")}
          />
          <label htmlFor="layer2">roads</label>
        </div>
        <div className="flex flex-row">
          <input
            type="checkbox"
            name=""
            id="layer3"
            className="mr-2"
            checked={layersVisible.trails}
            onChange={handleLayerSelect("trails")}
          />
          <label htmlFor="layer3">trails</label>
        </div>
      </div>

      <div className="flex flex-row items-center my-2">
        <NumberIndicator>3</NumberIndicator>
        <span className="ml-4 text-xl">Download the data</span>
      </div>
      <div className="w-full flex justify-center">
        {loading ? (
          <ButtonLoading />
        ) : (
          <button
            onClick={downloading}
            disabled={disabled}
            className={`capitalize bg-emerald-${
              disabled ? "300 cursor-not-allowed" : "500"
            } text-white p-4`}
          >
            download
          </button>
        )}
      </div>

      <div className="flex flex-row items-center my-2">
        <NumberIndicator>4</NumberIndicator>
        <span className="ml-4 text-xl">Import the downloads into SarTOPO</span>
      </div>
      <div className="hidden bg-emerald-300" />
      <div className="hidden bg-emerald-500 cursor-not-allowed" />
    </section>
  );
}

export default PanelExtraction;
