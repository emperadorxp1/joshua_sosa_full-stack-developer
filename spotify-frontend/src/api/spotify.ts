// src/api/spotify.ts
import { getToken, clearAuth } from "../auth/auth";

const BASE = "https://api.spotify.com/v1";

// Tipos mínimos útiles (puedes ampliarlos luego)
export type Image = { url: string; height: number; width: number };
export type Artist = {
  id: string;
  name: string;
  images?: Image[];
  followers?: { total: number };
  genres?: string[];
};
export type Album = {
  id: string;
  name: string;
  images?: Image[];
  release_date?: string;
  artists?: { name: string }[];
};

export type SearchArtistsResponse = {
  artists: {
    items: Artist[];
    total: number;
    limit: number;
    offset: number;
    next?: string | null;
    previous?: string | null;
  };
};
export type ArtistResponse = Artist;
export type TopTracksResponse = {
  tracks: { id: string; name: string; duration_ms: number }[];
};
export type ArtistAlbumsResponse = {
  items: Album[];
  total: number;
  limit: number;
  offset: number;
  next?: string | null;
};
export type MeSavedAlbumsResponse = {
  items: { added_at: string; album: Album }[];
  next?: string | null;
};

// Ponle un tipo explícito y genérico al retorno
async function http<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (res.status === 429) {
    const retry = Number(res.headers.get("Retry-After") ?? 2);
    await new Promise((r) => setTimeout(r, retry * 1000));
    // llamada recursiva conserva el tipo T
    return http<T>(path, init);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const Spotify = {
  searchArtists: (q: string, limit = 20, offset = 0) =>
    http<SearchArtistsResponse>(
      `/search?q=${encodeURIComponent(
        q
      )}&type=artist&limit=${limit}&offset=${offset}`
    ),

  artist: (id: string) => http<ArtistResponse>(`/artists/${id}`),

  artistTopTracks: (id: string, market = "US") =>
    http<TopTracksResponse>(`/artists/${id}/top-tracks?market=${market}`),

  artistAlbums: (id: string, limit = 20, offset = 0) =>
    http<ArtistAlbumsResponse>(
      `/artists/${id}/albums?include_groups=album,single&limit=${limit}&offset=${offset}`
    ),

  meSavedAlbums: (limit = 20, offset = 0) =>
    http<MeSavedAlbumsResponse>(`/me/albums?limit=${limit}&offset=${offset}`),
};
