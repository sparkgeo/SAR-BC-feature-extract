import { createContext } from "preact";
import { useState } from "preact/hooks";

export const AuthContext = createContext({
  name: "",
  pass: "",
  authenticated: false,
});

export function AuthContextProvider({ children }) {
  const [authParams, setAuthParams] = useState({ name: "", pass: "" });
  const [authenticated, setAuthenticated] = useState(false);

  return (
    <AuthContext.Provider
      value={{ ...authParams, setAuthParams, authenticated, setAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}
