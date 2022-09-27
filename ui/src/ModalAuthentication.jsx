import { useState, useContext } from "preact/hooks";
import { AuthContext } from "./AuthContext";
import base64 from "base-64";

function ModalAuthentication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuthenticated, setAuthParams } = useContext(AuthContext);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const {
      target: [{ value: user }, { value: pass }],
    } = event;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/list`, {
        headers: { Authorization: "Basic " + base64.encode(`${user}:${pass}`) },
      });
      setLoading(false);
      if (response.status === 401) {
        setError("auth");
        setLoading(false);
      } else if (response.status === 200) {
        // const data = await response.json();
        setAuthParams({ user, pass });
        setAuthenticated(true);
      } else {
        setError("server");
        setLoading(false);
      }
    } catch (e) {}
  }

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
            <button className="flex items-center p-4 justify-evenly">
              <span>loading</span>
              <div role="status">
                <svg
                  aria-hidden="true"
                  class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-emerald-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  ></path>
                </svg>
                <span class="sr-only">Loading...</span>
              </div>
            </button>
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
