// src/app/router.tsx
import { createBrowserRouter, Outlet } from "react-router-dom";
import RequireAuth from "./guards/RequireAuth";
import Login from "../pages/Login/Login";
import Search from "../pages/Search/Search";
import Artist from "../pages/Artist/Artist";
import SavedAlbums from "../pages/SavedAlbums/SavedAlbums";

function Layout() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Outlet />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <Search /> },
          { path: "/search", element: <Search /> },
          { path: "/artist/:id", element: <Artist /> },
          { path: "/me/albums", element: <SavedAlbums /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <div style={{ padding: 24 }}>404 — Página no encontrada</div>,
  },
]);
