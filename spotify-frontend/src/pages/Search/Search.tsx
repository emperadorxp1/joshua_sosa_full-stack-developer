import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import styles from "./Search.module.css";
import { Spotify } from "../../api/spotify";

type Image = { url: string };
type Artist = {
  id: string;
  name: string;
  images?: Image[];
  followers?: { total: number };
};
type SearchArtistsResponse = {
  artists: { items: Artist[]; total: number; limit: number; offset: number };
};

const LIMIT = 4;

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();

  const qParam = params.get("q") || "Nirvana";
  const pageParam = Math.max(1, Number(params.get("page") || 1));

  const [q, setQ] = useState(qParam);
  const [searchQuery, setSearchQuery] = useState(qParam);
  const [page, setPage] = useState(pageParam);

  const [items, setItems] = useState<Artist[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "loading" | "done" | "empty" | "error"
  >("idle");
  const [err, setErr] = useState("");

  const offset = useMemo(() => (page - 1) * LIMIT, [page]);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set("q", searchQuery);
    next.set("page", String(page));
    setParams(next, { replace: true });
  }, [searchQuery, page]);

  useEffect(() => {
    let cancel = false;
    async function run() {
      if (!searchQuery.trim()) {
        setItems([]);
        setTotal(0);
        setStatus("empty");
        return;
      }
      setStatus("loading");
      setErr("");
      try {
        const data = (await Spotify.searchArtists(
          searchQuery,
          LIMIT,
          offset
        )) as SearchArtistsResponse;
        if (cancel) return;
        const arr = data.artists?.items ?? [];
        const tot = data.artists?.total ?? 0;
        setItems(arr);
        setTotal(tot);
        setStatus(arr.length ? "done" : "empty");
        const tp = Math.max(1, Math.ceil(tot / LIMIT));
        if (page > tp) setPage(1);
      } catch (e: any) {
        if (cancel) return;
        setErr(String(e?.message || e));
        setStatus("error");
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [searchQuery, offset]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(q);
    if (page !== 1) setPage(1);
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>JOSHUAMUSICAPP</div>
        <nav className={styles.nav}>
          <Link className={`${styles.link} ${styles.active}`} to="/search">
            Buscar
          </Link>
          <Link className={styles.link} to="/me/albums">
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
          Busca tus <span>artistas</span>
        </h1>
        <p className={styles.subheading}>
          Encuentra tus artistas favoritos gracias a nuestro buscador y guarda
          tus álbumes favoritos
        </p>

        <form className={styles.searchBar} onSubmit={onSubmit}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nirvana"
            aria-label="Buscar artista"
          />
          <button type="submit">Search</button>
          <span className={styles.searchShadow} aria-hidden="true" />
        </form>
      </section>

      {status === "loading" && <p className={styles.helper}>Cargando…</p>}

      {status === "error" && (
        <div className={styles.error} role="alert">
          <p>Ocurrió un error.</p>
          <pre>{err}</pre>
        </div>
      )}

      {status === "empty" && (
        <p className={styles.helper}>No hay resultados para "{searchQuery}".</p>
      )}

      {status === "done" && (
        <>
          <p className={styles.resultInfo}>
            Mostrando <b>{items.length}</b> de <b>{total.toLocaleString()}</b>{" "}
            resultados
          </p>

          <ul className={styles.grid}>
            {items.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </ul>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPage={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
          />
        </>
      )}
    </main>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  const nav = useNavigate();
  const img =
    artist.images?.[0]?.url || "https://picsum.photos/seed/artist/400/400";
  const followers = artist.followers?.total ?? 0;

  return (
    <li className={styles.card} onClick={() => nav(`/artist/${artist.id}`)}>
      <div className={styles.thumbWrap}>
        <img
          src={img}
          alt={artist.name}
          className={styles.thumb}
          loading="lazy"
        />
      </div>
      <h3 className={styles.cardTitle}>{artist.name}</h3>
      <p className={styles.meta}>Followers: {followers.toLocaleString()}</p>
    </li>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const start = Math.max(1, page - 3);
  const end = Math.min(totalPages, start + 7);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <div
      className={styles.pagination}
      role="navigation"
      aria-label="Paginación"
    >
      <button
        className={styles.pageBtn}
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label="Anterior"
      >
        ‹
      </button>
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
      <button
        className={styles.pageBtn}
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Siguiente"
      >
        ›
      </button>
    </div>
  );
}
