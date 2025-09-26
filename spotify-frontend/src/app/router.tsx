// src/app/router.tsx
import { createBrowserRouter, Outlet } from "react-router-dom";
import RequireAuth from "./guards/RequireAuth";
import Login from "../pages/Login/Login";
import Search from "../pages/Search/Search";
import Artist from "../pages/Artist/Artist";

function Layout() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* aquí puedes poner un header con botón de logout si quieres */}
      <Outlet />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <RequireAuth />, // protege lo privado
    children: [
      {
        element: <Layout />, // tu layout (reemplaza al viejo App)
        children: [
          { path: "/", element: <Search /> },
          { path: "/search", element: <Search /> },
          { path: "/artist/:id", element: <Artist /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <div style={{ padding: 24 }}>404 — Página no encontrada</div>,
  },
]);
