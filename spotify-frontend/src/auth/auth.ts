import { createPkcePair } from "./pkce";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string;
const SCOPES =
  (import.meta.env.VITE_SPOTIFY_SCOPES as string) || "user-library-read";

const AUTH_KEY = "sp_access_token";
const VERIFIER_KEY = "sp_pkce_verifier";

export const getToken = () => localStorage.getItem(AUTH_KEY);
export const setToken = (t: string) => localStorage.setItem(AUTH_KEY, t);
export function clearAuth() {
  try {
    localStorage.removeItem("sp_access_token");
    localStorage.removeItem("sp_refresh_token");
    localStorage.removeItem("sp_expires_at");
    localStorage.removeItem("sp_pkce_verifier");
    localStorage.removeItem("sp_token_scope");
  } catch {}
}
export function logout() {
  clearAuth();
  if (window.location.search) {
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url.toString());
  }
  window.location.replace("/login");
}

export async function startLogin() {
  const { verifier, challenge } = await createPkcePair();
  localStorage.setItem(VERIFIER_KEY, verifier);
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);
  window.location.href = url.toString();
}

export async function handleCallback(params: URLSearchParams) {
  const code = params.get("code");
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!code || !verifier) return;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error("Token exchange failed");
  const data = await res.json();
  setToken(data.access_token);
}
