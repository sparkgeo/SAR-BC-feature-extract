import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AuthContextProvider } from "./AuthContext";
import { LayersContextProvider } from "./LayersContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LayersContextProvider>
      <AuthContextProvider>
        <App />
      </AuthContextProvider>
    </LayersContextProvider>
  </React.StrictMode>
);
