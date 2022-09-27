import { useState, useContext } from "preact/hooks";
import { AuthContext } from "./AuthContext";
import ContactBadge from "./ContactBadge";
import Header from "./Header";
import ModalAuthentication from "./ModalAuthentication";
import MapInterface from "./MapInterface";
import PanelExtraction from "./PanelExtraction";

export function App() {
  const { authenticated } = useContext(AuthContext);

  const [layersVisible, setLayersVisible] = useState({
    roads: true,
    trails: true,
    shelters: true,
  });
  const [mapBounds, setMapBounds] = useState(null);

  return (
    <>
      <Header />
      <ContactBadge />

      <main className="h-screen">
        <MapInterface
          layersVisible={layersVisible}
          setMapBounds={setMapBounds}
        />
      </main>

      {authenticated ? (
        <PanelExtraction
          mapBounds={mapBounds}
          layersVisible={layersVisible}
          setLayersVisible={setLayersVisible}
        />
      ) : (
        <ModalAuthentication />
      )}
    </>
  );
}

export default App;
