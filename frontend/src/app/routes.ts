import { createBrowserRouter, redirect } from "react-router";
import {
  adminLoginLoader,
  adminPanelLoader,
  barberLoginLoader,
  barberPanelLoader,
  clientLoginLoader,
  clientPanelLoader,
} from "./lib/authLoaders";
import { PublicLayout } from "./pages/PublicLayout";
import { HomePage } from "./pages/HomePage";
import { getClientSession } from "./lib/clientStorage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    children: [
      { index: true, Component: HomePage },
      {
        path: "servicios",
        lazy: () => import("./pages/ServicesPage").then((m) => ({ Component: m.ServicesPage })),
      },
      {
        path: "equipo",
        lazy: () => import("./pages/TeamPage").then((m) => ({ Component: m.TeamPage })),
      },
      {
        path: "galeria",
        lazy: () => import("./pages/GalleryPage").then((m) => ({ Component: m.GalleryPage })),
      },
      {
        path: "reserva",
        loader: () => {
          if (!getClientSession()) throw redirect("/mi-cuenta/login");
          return null;
        },
        lazy: () => import("./components/BookingPage").then((m) => ({ Component: m.BookingPage })),
      },
      {
        path: "ia-barber",
        lazy: () => import("./components/FaceAnalyzer").then((m) => ({ Component: m.default })),
      },
    ],
  },
  {
    path: "/admin/login",
    loader: adminLoginLoader,
    lazy: () => import("./components/AdminLogin").then((m) => ({ Component: m.AdminLogin })),
  },
  {
    path: "/admin",
    loader: adminPanelLoader,
    lazy: () => import("./components/AdminPanel").then((m) => ({ Component: m.AdminPanel })),
  },
  {
    path: "/barber/login",
    loader: barberLoginLoader,
    lazy: () => import("./components/BarberLogin").then((m) => ({ Component: m.BarberLogin })),
  },
  {
    path: "/barber",
    loader: barberPanelLoader,
    lazy: () => import("./components/BarberPanel").then((m) => ({ Component: m.BarberPanel })),
  },
  {
    path: "/mi-cuenta/login",
    loader: clientLoginLoader,
    lazy: () => import("./components/ClientLogin").then((m) => ({ Component: m.ClientLogin })),
  },
  {
    path: "/mi-cuenta",
    loader: clientPanelLoader,
    lazy: () => import("./components/ClientPanel").then((m) => ({ Component: m.ClientPanel })),
  },
  {
    path: "*",
    loader: () => redirect("/"),
  },
]);

