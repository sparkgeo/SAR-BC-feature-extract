import React from "react";
import { saveAs } from "file-saver";

const sampleExtraction = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [1.7578125, -2.811371193331128],
            [69.9609375, -2.811371193331128],
            [69.9609375, 51.6180165487737],
            [1.7578125, 51.6180165487737],
            [1.7578125, -2.811371193331128],
          ],
        ],
      },
    },
  ],
};

function PanelExtraction({ layersVisible, setLayersVisible, mapBounds }) {
  const NumberIndicator = ({ children }) => (
    <div className="bg-emerald-600 text-white text-xl rounded-full p-2 w-10 h-10 flex justify-center items-center">
      {children}
    </div>
  );

  const handleLayerSelect = (layer) => () => {
    setLayersVisible({ ...layersVisible, [layer]: !layersVisible[layer] });
  };

  async function downloading() {
    const files = [];
    const { roads, trails, shelters } = layersVisible;

    try {
      if (shelters) {
        // const [[xMin, yMax], [xMax, yMin]] = mapBounds;
        // const uname = "username";
        // const pword = "password";
        // const url = `http://ecsal-albfa-1i6jhj514tazu-125558200.us-west-2.elb.amazonaws.com/Shelters/export/${xMin}/${yMin}/${xMax}/${yMax}`;
        // const response = await fetch(url, {
        //   headers: {
        //     Authorization: "Basic " + base64.encode(uname + ":" + pword),
        //   },
        // });
        // const data = await response.json();
        // console.log("Url ", data);

        var blob = new Blob([JSON.stringify(sampleExtraction)], {
          type: "text/plain;charset=utf-8",
        });
        saveAs(blob, "extracted-shelters.json");
      }
      if (trails) {
        var blob = new Blob([JSON.stringify(sampleExtraction)], {
          type: "text/plain;charset=utf-8",
        });
        saveAs(blob, "extracted-trails.json");
      }
      if (roads) {
        var blob = new Blob([JSON.stringify(sampleExtraction)], {
          type: "text/plain;charset=utf-8",
        });
        saveAs(blob, "extracted-roads.json");
      }
    } catch (e) {
      console.error(e);
      throw new Error("unable to download");
    }
  }

  return (
    <section className="fixed z-20 right-10 bottom-20 p-4 bg-white">
      <h2 className="text-2xl my-2">To get stuff on SARTopo, do this:</h2>
      <div className="flex flex-row items-center my-2">
        <NumberIndicator>1</NumberIndicator>
        <span className="ml-2 text-xl">Pan to Area of Interest</span>
      </div>
      <div className="flex flex-row items-center my-2">
        <NumberIndicator>2</NumberIndicator>
        <span className="ml-2 text-xl">Select Datasets</span>
      </div>
      <div className="ml-12 select-none">
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
        <span className="ml-2 text-xl">Download the data</span>
      </div>

      <button
        onClick={downloading}
        disabled={
          !(
            layersVisible.shelters ||
            layersVisible.roads ||
            layersVisible.trails
          )
        }
        className="bg-emerald-500 text-white p-4"
      >
        download
      </button>

      <div className="flex flex-row items-center my-2">
        <NumberIndicator>4</NumberIndicator>
        <span className="ml-2 text-xl">Import unzipped data into SAR Topo</span>
      </div>
    </section>
  );
}

export default PanelExtraction;
