import { useState, useContext, useEffect } from "preact/hooks";
import { saveAs } from "file-saver";
import { useApi } from "./hooks/useApi";
import ButtonLoading from "./ButtonLoading";
import CheckboxMapLayer from "./CheckboxMapLayer";
import { LayersContext } from "./LayersContext";

function PanelExtraction({ mapBounds }) {
  const { api, loading } = useApi();
  const { layersStatus, updateLayersStatus } = useContext(LayersContext);
  const [errors, setErrors] = useState(
    Object.keys(layersStatus).reduce(
      (accumulator, name) => ({ ...accumulator, [name]: null }),
      {}
    )
  );

  const NumberIndicator = ({ children }) => (
    <div className="bg-emerald-600 text-white text-xl rounded-full p-2 w-10 h-10 flex justify-center items-center">
      {children}
    </div>
  );

  const handleLayerSelect =
    ({ key, value }) =>
    () => {
      updateLayersStatus({ key, enabled: value });
    };

  async function downloading() {
    const [[xMin, yMax], [xMax, yMin]] = mapBounds;

    for (const layer of Object.values(layersStatus)) {
      if (layer.enabled) {
        try {
          const name = layer.name.split(" ").join("-");
          const data = await api(
            `/${name}/export/${xMin}/${yMin}/${xMax}/${yMax}`
          );

          var blob = new Blob([JSON.stringify(data)], {
            type: "text/plain;charset=utf-8",
          });
          saveAs(blob, `${name}.geojson`);
        } catch (e) {
          setErrors({ ...errors, [layer.name]: true });
        }
      }
    }
  }

  let downloadsDisabled = false;
  for (let layer of Object.values(layersStatus)) {
    if (!layer.enabled) {
      downloadsDisabled = true;
      break;
    }
  }

  return (
    <section className="rounded-lg fixed z-20 right-10 bottom-20 px-4 pb-6 bg-white shadow-xl">
      <h2 className="text-2xl my-2">Add more content to SARTopo:</h2>
      <ul>
        <li className="my-2 py-2">
          <div className="flex flex-row items-center my-2">
            <NumberIndicator>1</NumberIndicator>
            <span className="ml-4 text-xl">Pan map to Area of Interest</span>
          </div>
        </li>
        <li className="my-2 border-t border-t-gray-400 py-2">
          <div className="flex flex-row items-center my-2">
            <NumberIndicator>2</NumberIndicator>
            <span className="ml-4 text-xl">Select Datasets</span>
          </div>
          <div className="ml-12 select-none grid grid-cols-1 gap-y-1">
            {Object.values(layersStatus).map(({ name: label, enabled }) => (
              <CheckboxMapLayer
                label={label}
                checked={enabled}
                handleSelect={handleLayerSelect({
                  key: label,
                  value: !enabled,
                })}
              />
            ))}
          </div>
        </li>
        <li className="my-2 py-2 border-t border-t-gray-400">
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
                disabled={downloadsDisabled}
                className={`capitalize bg-emerald-${
                  downloadsDisabled ? "300 cursor-not-allowed" : "500"
                } text-white p-4`}
              >
                download
              </button>
            )}
          </div>
        </li>
        <li className="my-2 py-2 border-t border-t-gray-500">
          <div className="flex flex-row items-center my-2">
            <NumberIndicator>4</NumberIndicator>
            <span className="ml-4 text-xl">Import downloads into SarTOPO</span>
          </div>
        </li>
      </ul>

      <div className="hidden bg-emerald-300" />
      <div className="hidden bg-emerald-500 cursor-not-allowed" />
    </section>
  );
}

export default PanelExtraction;
