import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./SavedAlbums.module.css";
import { Spotify } from "../../api/spotify";

type Image = { url: string; width?: number; height?: number };
type Album = {
  id: string;
  name: string;
  images?: Image[];
  release_date?: string;
  artists?: { id: string; name: string }[];
};
type SavedItem = { added_at: string; album: Album };
type MeSavedAlbumsResponse = {
  items: SavedItem[];
  total: number;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 20;

export default function SavedAlbumsPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"loading" | "done" | "empty" | "error">(
    "loading"
  );
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const offset = useMemo(() => (page - 1) * PAGE_SIZE, [page]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setStatus("loading");
        setErr("");
        const data = (await Spotify.meSavedAlbums(
          PAGE_SIZE,
          offset
        )) as MeSavedAlbumsResponse;
        if (cancel) return;
        const arr = data.items ?? [];
        setItems(arr);
        setTotal(data.total ?? arr.length);
        setStatus(arr.length ? "done" : "empty");
      } catch (e: any) {
        if (cancel) return;
        setErr(String(e?.message || e));
        setStatus("error");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [offset]);

  const groups = useMemo(() => {
    const map = new Map<string, SavedItem[]>();
    for (const it of items) {
      const key = it.album.artists?.[0]?.name || "Varios";
      const list = map.get(key) || [];
      list.push(it);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [items]);

  async function handleRemove(albumId: string) {
    if (busy[albumId]) return;
    setBusy((b) => ({ ...b, [albumId]: true }));
    const prev = items;
    setItems((curr) => curr.filter((x) => x.album.id !== albumId));
    try {
      await Spotify.removeAlbums(albumId);
    } catch (e) {
      setItems(prev); // rollback
      console.error(e);
    } finally {
      setBusy((b) => ({ ...b, [albumId]: false }));
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>JOSHMUSICAPP</div>
        <nav className={styles.nav}>
          <Link className={styles.link} to="/search">
            Buscar
          </Link>
          <Link className={`${styles.link} ${styles.active}`} to="/me/albums">
            Mis álbumes
          </Link>
          <span className={styles.sep} aria-hidden="true" />
          <Link className={styles.link} to="/login">
            Cerrar sesión
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heading}>
          Mis albumes <span>guardados</span>
        </h1>
        <p className={styles.subheading}>
          Disfruta de tu música a un solo click y descubre qué discos has
          guardado dentro de “mis álbumes”.
        </p>
      </section>

      {status === "loading" && <p className={styles.helper}>Cargando…</p>}
      {status === "error" && (
        <div className={styles.error} role="alert">
          <p>Ocurrió un error.</p>
          <pre>{err}</pre>
        </div>
      )}
      {status === "empty" && (
        <p className={styles.helper}>Todavía no has guardado álbumes.</p>
      )}

      {status === "done" && (
        <>
          {groups.map(([artistName, list]) => (
            <section key={artistName} className={styles.group}>
              <h2 className={styles.groupTitle}>{artistName}</h2>
              <ul className={styles.grid}>
                {list.map(({ album }) => (
                  <li key={album.id} className={styles.card}>
                    <div className={styles.thumbWrap}>
                      <img
                        src={
                          album.images?.[0]?.url ||
                          "https://picsum.photos/seed/album/600/600"
                        }
                        alt={album.name}
                        className={styles.thumb}
                        loading="lazy"
                      />
                    </div>
                    <h3 className={styles.cardTitle}>{album.name}</h3>
                    <p className={styles.metaText}>
                      Publicado: {album.release_date || "—"}
                    </p>
                    <button
                      className={`${styles.albumBtn} ${styles.remove}`}
                      onClick={() => handleRemove(album.id)}
                      disabled={!!busy[album.id]}
                    >
                      {busy[album.id] ? "…" : "− Remove album"}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <NumberedPagination
            page={page}
            totalPages={totalPages}
            onPage={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
          />
        </>
      )}
    </main>
  );
}

function NumberedPagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const win = 7;
  const start = Math.max(1, page - Math.floor(win / 2));
  const end = Math.min(totalPages, start + win - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className={styles.pagination} aria-label="Paginación de mis álbumes">
      <button
        className={styles.pageBtn}
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label="Anterior"
      >
        ‹
      </button>

      {start > 1 && (
        <>
          <button className={styles.pageNum} onClick={() => onPage(1)}>
            1
          </button>
          {start > 2 && (
            <span className={styles.dots} aria-hidden="true">
              …
            </span>
          )}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={`${styles.pageNum} ${p === page ? styles.activePage : ""}`}
          onClick={() => onPage(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className={styles.dots} aria-hidden="true">
              …
            </span>
          )}
          <button className={styles.pageNum} onClick={() => onPage(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        className={styles.pageBtn}
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Siguiente"
      >
        ›
      </button>
    </nav>
  );
}
