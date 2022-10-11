import { useContext, useState } from "react";
import { AuthContext } from "../AuthContext";
import base64 from "base-64";

// Goal is to replicate fetch api, with a base url
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, pass } = useContext(AuthContext);

  const apiBase = import.meta.env.VITE_API_BASE;

  async function api(url, content = {}) {
    setLoading(true);

    const { headers = {} } = content;

    try {
      const response = await fetch(`${apiBase}${url}`, {
        ...content,
        headers: {
          ...headers,
          Authorization: `Basic ${base64.encode(`${user}:${pass}`)}`,
        },
      });
      const data = await response.json();

      setLoading(false);
      return data;
    } catch (e) {}
  }

  return { api, loading, error };
}
