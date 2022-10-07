import { render } from "preact";
import { App } from "./App";
import { AuthContextProvider } from "./AuthContext";
import { LayersContextProvider } from "./LayersContext";
import "./index.css";

render(
  <LayersContextProvider>
    <AuthContextProvider>
      <App />
    </AuthContextProvider>
  </LayersContextProvider>,
  document.getElementById("app")
);
