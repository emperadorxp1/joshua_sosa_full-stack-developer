// src/pages/Login/Login.tsx
import { useEffect } from "react";
import { handleCallback, startLogin, getToken } from "../../auth/auth";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Login.module.css";
import arrowPng from "../../assets/arrow.png";

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
        .catch(() => {});
    } else if (getToken()) {
      nav("/search", { replace: true });
    }
  }, []);

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.logo}>JoshMusicApp</h1>
      </header>

      <section className={styles.hero}>
        {/* imagen decorativa → alt="" y aria-hidden */}
        <img
          src={arrowPng}
          alt=""
          aria-hidden="true"
          className={styles.arrow}
          width={222}
          height={222}
          loading="eager"
        />

        <h2 className={styles.title}>
          Disfruta de la <span className={styles.accent}>mejor música</span>
        </h2>
        <p className={styles.subtitle}>
          Accede a tu cuenta para guardar tus álbumes favoritos.
        </p>

        <button className={styles.linkBtn} onClick={startLogin}>
          Log in con Spotify <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
}
