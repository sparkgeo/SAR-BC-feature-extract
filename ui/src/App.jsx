import { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import ContactBadge from "./ContactBadge";
import Header from "./Header";
import ModalAuthentication from "./ModalAuthentication";
import MapInterface from "./MapInterface";
import PanelExtraction from "./PanelExtraction";

export function App() {
  const { authenticated } = useContext(AuthContext);

  return (
    <>
      <Header />
      <ContactBadge />

      {authenticated ?
        <>
          <main className="h-screen">
            <MapInterface />
          </main>
          <PanelExtraction />
        </> :
        <ModalAuthentication />
      }
    </>
  );
}

export default App;
