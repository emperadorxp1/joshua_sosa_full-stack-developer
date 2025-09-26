import { useEffect, useState } from "react";
import { Spotify } from "../../api/spotify";

export default function Search() {
  const [artists, setArtists] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  useEffect(() => {
    (async () => {
      setStatus("loading");
      try {
        const data = await Spotify.searchArtists("muse");
        setArtists(data.artists?.items ?? []);
        setStatus("done");
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    })();
  }, []);

  if (status === "loading") return <p style={{ padding: 16 }}>Cargando…</p>;
  if (status === "error")
    return <p style={{ padding: 16 }}>Error al consultar Spotify.</p>;
  return (
    <div style={{ padding: 16 }}>
      <h2>Smoke test</h2>
      <p>
        Artistas encontrados: <b>{artists.length}</b>
      </p>
      <ul>
        {artists.slice(0, 5).map((a: any) => (
          <li key={a.id}>{a.name}</li>
        ))}
      </ul>
    </div>
  );
}
