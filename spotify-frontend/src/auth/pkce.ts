// src/auth/pkce.ts

// Base64URL (sin + / =) para el challenge
function base64UrlEncode(bytes: ArrayBuffer) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Genera un "code_verifier" seguro (43–128 chars)
export function generateVerifier(length = 64) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

// Calcula el "code_challenge" (S256) a partir del verifier
export async function challengeFromVerifier(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

// Par completo listo para usar
export async function createPkcePair(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const verifier = generateVerifier();
  const challenge = await challengeFromVerifier(verifier);
  return { verifier, challenge };
}
