import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { LayersContext } from "./LayersContext";

import base64 from "base-64";
import ButtonLoading from "./ButtonLoading";

function ModalAuthentication() {
  const [appLoading, setAppLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuthenticated, setAuthParams } = useContext(AuthContext);
  const { initializeLayers } = useContext(LayersContext);

  async function authenticate({ user, pass, modalBypass = false }) {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/list`, {
        headers: { Authorization: "Basic " + base64.encode(`${user}:${pass}`) },
      });
      setLoading(false);
      if (response.status === 401) {
        setError("auth");
        setLoading(false);
      } else if (response.status === 200) {
        const data = await response.json();
        initializeLayers(data);

        setAuthParams({ user, pass });
        localStorage.setItem("auth", JSON.stringify({ user, pass }));
        setAuthenticated(true);
      } else {
        setError("server");
        setLoading(false);
      }
      if (modalBypass) setAppLoading(false);
    } catch (e) {
      console.error(e);

      setError("client");
      setLoading(false);
      setAppLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const {
      target: [{ value: user }, { value: pass }],
    } = event;
    authenticate({ user, pass });
  }

  useEffect(() => {
    const { user, pass } = JSON.parse(localStorage.getItem("auth") ?? "{}");
    if (user && pass) {
      authenticate({ user, pass, modalBypass: true });
    } else {
      setAppLoading(false);
    }
  }, []);

  const Error = ({ type }) => {
    return (
      <div className="h-44 border-2 border-red-600 p-4 my-2">
        <h3 className="text-lg my-1">Unable to sign in:</h3>
        <p>
          {type === "server"
            ? "Server error"
            : "Incorrect username and password"}
        </p>
      </div>
    );
  };

  const ExplainerBox = () => (
    <div className="my-2 border p-4">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc interdum mi
      sapien, eget tristique augue consequat ac. Proin sed turpis pharetra velit
      scelerisque consequat. Suspendisse aliquam metus a risus fringilla rhoncus
    </div>
  );

  if (appLoading) return;

  return (
    <div
      className="fixed top-0 w-screen h-screen bg-gray-600/50 flex 
                    justify-center items-center z-10
                   
    "
    >
      <section
        id="authentication"
        className="bg-white shadow-xl 
       w-2/5
      p-4 rounded "
      >
        <h2 className="mb-2 text-2xl">Sign In</h2>
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <label className="text-gray-600 text-sm">username</label>
          <input
            type="text"
            className="px-2 py-3 border"
            name="user"
            id="user"
          />
          <label className="text-gray-600 text-sm">password</label>
          <input
            type="password"
            className="px-2 py-3 border"
            name="pass"
            id="pass"
          />

          {error ? <Error type={error} /> : <ExplainerBox />}

          {loading ? (
            <ButtonLoading />
          ) : (
            <input
              type="submit"
              value="Sign In"
              className="bg-purple-600 text-white p-4 hover:bg-purple-500 cursor-pointer"
            />
          )}
        </form>
      </section>
    </div>
  );
}

export default ModalAuthentication;
