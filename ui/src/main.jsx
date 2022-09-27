import { render } from "preact";
import { App } from "./App";
import { AuthContextProvider } from "./AuthContext";
import "./index.css";

render(
  <AuthContextProvider>
    <App />
  </AuthContextProvider>,
  document.getElementById("app")
);
