import { useState, useEffect } from "preact/hooks";
import ContactBadge from "./ContactBadge";
import Header from "./Header";
import ModalAuthentication from "./ModalAuthentication";
import MapInterface from "./MapInterface";
import PanelExtraction from "./PanelExtraction";

import base64 from "base-64";

export function App() {
  const [authenticated, setAuthenticated] = useState(
    import.meta.env.VITE_IGNORE_AUTH ?? false
  );
  const [layersVisible, setLayersVisible] = useState({
    roads: true,
    trails: true,
    shelters: true,
  });
  const [mapBounds, setMapBounds] = useState(null);
  function onAuthenticate() {
    setAuthenticated(true);
  }

  useEffect(() => {
    const uname = "username";
    const pword = "password";

    fetch(
      "http://ecsal-albfa-1i6jhj514tazu-125558200.us-west-2.elb.amazonaws.com/list",
      {
        headers: {
          Authorization: "Basic " + base64.encode(uname + ":" + pword),
        },
      }
    );
  }, []);

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
        <ModalAuthentication handleAuthenticated={onAuthenticate} />
      )}
    </>
  );
}

export default App;
