import axios from "axios";

const API = "http://localhost:5000/api";
export const eventToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
export const eventAuth = () => ({ headers: eventToken() ? { Authorization: `Bearer ${eventToken()}` } : {} });

export async function eventRequest(path, options = {}) {
  const response = await axios({
    url: `${API}${path}`,
    method: options.method || "GET",
    data: options.body,
    params: options.params,
    ...eventAuth(),
  });
  return response.data;
}

export const eventMoney = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
export const eventDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
export const eventImage = (item) => item?.poster_url || item?.posterUrl || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80";
export const fileToDataUrl = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });

export const getEventDraft = () => JSON.parse(sessionStorage.getItem("eventBookingDraft") || "{}");
export const saveEventDraft = (patch) => { const next = { ...getEventDraft(), ...patch }; sessionStorage.setItem("eventBookingDraft", JSON.stringify(next)); return next; };
