const API = "http://localhost:5000/api";

export const hotelToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

export async function hotelRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(hotelToken() ? { Authorization: `Bearer ${hotelToken()}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to complete this request.");
  return data;
}

export const queryString = (values) => {
  const query = new URLSearchParams();
  Object.entries(values || {}).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) query.set(key, value);
  });
  return query.toString();
};

export const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
export const shortDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
export const nightsBetween = (start, end) => Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000));
export const hotelImage = (item) => item?.images?.find((image) => image.isPrimary)?.url || item?.images?.[0]?.url || item?.hotel_image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80";

export const getHotelDraft = () => JSON.parse(sessionStorage.getItem("hotelBookingDraft") || "{}");
export const saveHotelDraft = (patch) => {
  const next = { ...getHotelDraft(), ...patch };
  sessionStorage.setItem("hotelBookingDraft", JSON.stringify(next));
  return next;
};

export const filesToImages = (files) => Promise.all(Array.from(files || []).map((file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ url: reader.result, alt: file.name });
  reader.onerror = reject;
  reader.readAsDataURL(file);
})));
