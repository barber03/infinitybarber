import { redirect } from "react-router";
import { getAuthSession, getBarberSession } from "./storage";
import { getClientSession } from "./clientStorage";

export function adminPanelLoader() {
  if (getAuthSession()?.user.role !== "admin") {
    throw redirect("/admin/login");
  }
  return null;
}

export function adminLoginLoader() {
  if (getAuthSession()?.user.role === "admin") {
    throw redirect("/admin");
  }
  return null;
}

export function barberPanelLoader() {
  if (!getBarberSession()) {
    throw redirect("/barber/login");
  }
  return null;
}

export function barberLoginLoader() {
  if (getBarberSession()) {
    throw redirect("/barber");
  }
  return null;
}

export function clientPanelLoader() {
  if (!getClientSession()) {
    throw redirect("/mi-cuenta/login");
  }
  return null;
}

export function clientLoginLoader() {
  if (getClientSession()) {
    throw redirect("/mi-cuenta");
  }
  return null;
}
