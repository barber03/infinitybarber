import { createBrowserRouter, redirect } from "react-router";
import { AdminLogin } from "./components/AdminLogin";
import { AdminPanel } from "./components/AdminPanel";
import { BarberLogin } from "./components/BarberLogin";
import { BarberPanel } from "./components/BarberPanel";
import { ClientLogin } from "./components/ClientLogin";
import { ClientPanel } from "./components/ClientPanel";
import {
  adminLoginLoader,
  adminPanelLoader,
  barberLoginLoader,
  barberPanelLoader,
  clientLoginLoader,
  clientPanelLoader,
} from "./lib/authLoaders";
import { BookingPage } from "./components/BookingPage";
import FaceAnalyzer from "./components/FaceAnalyzer";
import { PublicLayout } from "./pages/PublicLayout";
import { HomePage } from "./pages/HomePage";
import { ServicesPage } from "./pages/ServicesPage";
import { TeamPage } from "./pages/TeamPage";
import { GalleryPage } from "./pages/GalleryPage";
import { getClientSession } from "./lib/clientStorage";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "servicios", Component: ServicesPage },
      { path: "equipo", Component: TeamPage },
      { path: "galeria", Component: GalleryPage },
      {
        path: "reserva",
        loader: () => {
          if (!getClientSession()) throw redirect("/mi-cuenta/login");
          return null;
        },
        Component: BookingPage,
      },
      { path: "ia-barber", Component: FaceAnalyzer },

    ],
  },
  {
    path: "/admin/login",
    loader: adminLoginLoader,
    Component: AdminLogin,
  },
  {
    path: "/admin",
    loader: adminPanelLoader,
    Component: AdminPanel,
  },
  {
    path: "/barber/login",
    loader: barberLoginLoader,
    Component: BarberLogin,
  },
  {
    path: "/barber",
    loader: barberPanelLoader,
    Component: BarberPanel,
  },
  {
    path: "/mi-cuenta/login",
    loader: clientLoginLoader,
    Component: ClientLogin,
  },
  {
    path: "/mi-cuenta",
    loader: clientPanelLoader,
    Component: ClientPanel,
  },
  {
    path: "*",
    loader: () => redirect("/"),
  },
]);
