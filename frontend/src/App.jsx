import { useEffect, useMemo, useState } from "react";

const CLIENT_ID = "6d35fe6p8qpi8lm7dssi6m6fbb";
const COGNITO_DOMAIN =
  "https://us-east-1zq4q6fmaz.auth.us-east-1.amazoncognito.com";
const REDIRECT_URI = "http://localhost:5173";
const API_URL = "https://id3jm2fygk.execute-api.us-east-1.amazonaws.com/dev/api";

function App() {
  const [loginStatus, setLoginStatus] = useState("Not signed in yet");
  const [apiStatus, setApiStatus] = useState("Not called yet");
  const [apiMessage, setApiMessage] = useState("No response yet");
  const [tokenStatus, setTokenStatus] = useState("No token yet");

  const loginUrl = useMemo(() => {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      scope: "openid email",
      redirect_uri: REDIRECT_URI,
    });

    return `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
  }, []);

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      const query = new URLSearchParams(window.location.search);
      const authCode = query.get("code");

      if (!authCode) {
        const savedToken = localStorage.getItem("access_token");
        if (savedToken) {
          setLoginStatus("Signed in from saved session");
          setTokenStatus("Access token found");
        }
        return;
      }

      try {
        const body = new URLSearchParams({
          grant_type: "authorization_code",
          client_id: CLIENT_ID,
          code: authCode,
          redirect_uri: REDIRECT_URI,
        });

        const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });

        if (!response.ok) {
          throw new Error(`Token exchange failed: ${response.status}`);
        }

        const data = await response.json();

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("id_token", data.id_token);

        setLoginStatus("Signed in successfully");
        setTokenStatus("Access token stored");

        window.history.replaceState({}, document.title, "/");
      } catch (error) {
        setLoginStatus("Login failed");
        setTokenStatus("Token exchange failed");
      }
    };

    exchangeCodeForToken();
  }, []);

  const callProtectedApi = async () => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setApiStatus("Blocked");
      setApiMessage("No access token found. Please sign in first.");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      setApiStatus("Success");
      setApiMessage(data.message || "Protected API call worked");
    } catch (error) {
      setApiStatus("Failed");
      setApiMessage("Protected API request failed");
    }
  };

  const signOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    setLoginStatus("Signed out");
    setTokenStatus("No token yet");
    setApiStatus("Not called yet");
    setApiMessage("No response yet");
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "40px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1>SecureCorp</h1>
      <p>
        SecureCorp uses Cognito authentication to protect access to a secured AWS API.
      </p>

      <section
        style={{
          marginTop: "24px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2>Authentication</h2>
        <p>
          <strong>Login status:</strong> {loginStatus}
        </p>
        <p>
          <strong>Token status:</strong> {tokenStatus}
        </p>

        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <a
            href={loginUrl}
            style={{
              display: "inline-block",
              padding: "10px 16px",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "8px",
            }}
          >
            Sign in with Cognito
          </a>

          <button
            onClick={signOut}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </section>

      <section
        style={{
          marginTop: "24px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2>Protected API Test</h2>
        <p>
          <strong>API status:</strong> {apiStatus}
        </p>
        <p>
          <strong>API message:</strong> {apiMessage}
        </p>

        <button
          onClick={callProtectedApi}
          style={{
            marginTop: "12px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Call Protected API
        </button>
      </section>
    </div>
  );
}

export default App;
