// src/pages/Login/Login.tsx
import { useEffect } from "react";
import { handleCallback, startLogin, getToken } from "../../auth/auth";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code) {
      handleCallback(url.searchParams)
        .then(() =>
          nav((loc.state as any)?.from?.pathname || "/search", {
            replace: true,
          })
        )
        .catch(() => {
          /* mostrar error si quieres */
        });
    } else if (getToken()) {
      nav("/search", { replace: true });
    }
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Inicia sesión con Spotify</h1>
      <button onClick={startLogin}>Continuar con Spotify</button>
    </main>
  );
}
