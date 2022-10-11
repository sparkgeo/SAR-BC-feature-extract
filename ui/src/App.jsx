import { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import ContactBadge from "./ContactBadge";
import Header from "./Header";
import ModalAuthentication from "./ModalAuthentication";
import MapInterface from "./MapInterface";
import PanelExtraction from "./PanelExtraction";

export function App() {
  const { authenticated } = useContext(AuthContext);

  const [mapBounds, setMapBounds] = useState(null);

  return (
    <>
      <Header />
      <ContactBadge />

      <main className="h-screen">
        <MapInterface setMapBounds={setMapBounds} />
      </main>

      {authenticated ? (
        <PanelExtraction mapBounds={mapBounds} />
      ) : (
        <ModalAuthentication />
      )}
    </>
  );
}

export default App;
