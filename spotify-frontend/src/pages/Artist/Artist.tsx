import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./Artist.module.css";
import { Spotify } from "../../api/spotify";

type Image = { url: string; width?: number; height?: number };
type Artist = {
  id: string;
  name: string;
  images?: Image[];
  followers?: { total: number };
  popularity?: number;
};
type Album = {
  id: string;
  name: string;
  images?: Image[];
  release_date?: string;
};

const PAGE_SIZE = 12;

export default function ArtistPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);

  const offset = useMemo(() => (page - 1) * PAGE_SIZE, [page]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setStatus("loading");
      setErr("");
      try {
        const [a, al] = await Promise.all([
          Spotify.artist(id),
          Spotify.artistAlbums(id, PAGE_SIZE, offset),
        ]);
        if (cancel) return;
        setArtist(a);
        setAlbums(al.items ?? []);
        if ((al.items ?? []).length) {
          const ids = (al.items ?? []).map((x: Album) => x.id).join(",");
          const contains = await fetchContains(ids);
          const m: Record<string, boolean> = {};
          (al.items ?? []).forEach(
            (x: Album, i: number) => (m[x.id] = !!contains[i])
          );
          setSavedMap(m);
        } else {
          setSavedMap({});
        }
        setStatus("done");
      } catch (e: any) {
        if (cancel) return;
        setErr(String(e?.message || e));
        setStatus("error");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id, offset]);

  async function fetchContains(idsCsv: string): Promise<boolean[]> {
    const res = await fetch(
      `https://api.spotify.com/v1/me/albums/contains?ids=${idsCsv}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sp_access_token")}`,
        },
      }
    );
    if (!res.ok) return [];
    return res.json();
  }

  async function toggleAlbum(albumId: string, shouldSave: boolean) {
    const endpoint = "https://api.spotify.com/v1/me/albums";
    const method = shouldSave ? "PUT" : "DELETE";
    const res = await fetch(`${endpoint}?ids=${albumId}`, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("sp_access_token")}`,
      },
    });
    if (res.ok) {
      setSavedMap((prev) => ({ ...prev, [albumId]: shouldSave }));
    }
  }

  const heroImg =
    artist?.images?.[0]?.url || "https://picsum.photos/seed/artist/400/400";
  const followers = artist?.followers?.total ?? 0;
  const popularity = artist?.popularity ?? 0;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>MusicApp</div>
        <nav className={styles.nav}>
          <Link className={styles.link} to="/search">
            Buscar
          </Link>
          <Link className={styles.link} to="/me/albums">
            Mis álbumes
          </Link>
          <span className={styles.sep} />
          <Link className={styles.link} to="/login">
            Cerrar sesión
          </Link>
        </nav>
      </header>

      {status === "loading" && <p className={styles.helper}>Cargando…</p>}
      {status === "error" && (
        <div className={styles.error} role="alert">
          <p>Ocurrió un error.</p>
          <pre>{err}</pre>
        </div>
      )}

      {status === "done" && artist && (
        <>
          <section className={styles.hero}>
            <div className={styles.avatarWrap}>
              <img src={heroImg} alt={artist.name} className={styles.avatar} />
            </div>
            <div className={styles.metaWrap}>
              <div className={styles.badge}>
                <span className={styles.dot} aria-hidden="true">
                  ✔
                </span>{" "}
                Artista certificado
              </div>
              <h1 className={styles.title}>{artist.name}</h1>

              <ul className={styles.kpis}>
                <li>
                  <span className={styles.kpiLabel}>Followers:</span>{" "}
                  {followers.toLocaleString()}
                </li>
                <li>
                  <span className={styles.kpiLabel}>Popularidad:</span>{" "}
                  {popularity} / 100
                </li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Guarda tus álbumes favoritos de{" "}
              <span className={styles.accent}>{artist.name}</span>
            </h2>

            {albums.length === 0 && (
              <p className={styles.helper}>
                Este artista no tiene álbumes listados.
              </p>
            )}

            <ul className={styles.grid}>
              {albums.map((al) => (
                <li key={al.id} className={styles.card}>
                  <div className={styles.thumbWrap}>
                    <img
                      src={
                        al.images?.[0]?.url ||
                        "https://picsum.photos/seed/album/500/500"
                      }
                      alt={al.name}
                      className={styles.thumb}
                      loading="lazy"
                    />
                  </div>

                  <h3 className={styles.cardTitle}>{al.name}</h3>
                  <p className={styles.metaText}>
                    Publicado: {al.release_date || "—"}
                  </p>

                  {savedMap[al.id] ? (
                    <button
                      className={`${styles.albumBtn} ${styles.remove}`}
                      onClick={() => toggleAlbum(al.id, false)}
                    >
                      − Remove album
                    </button>
                  ) : (
                    <button
                      className={`${styles.albumBtn} ${styles.add}`}
                      onClick={() => toggleAlbum(al.id, true)}
                    >
                      + Add album
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹
              </button>
              <span className={styles.pageInfo}>Página {page}</span>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
