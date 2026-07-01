import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHotel, FaSearch } from "react-icons/fa";
import { queryString } from "../services/hotelApi";
import "./HotelModule.css";

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfter = new Date(Date.now() + 172800000).toISOString().slice(0, 10);

export default function HotelSearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ city: "", checkIn: tomorrow, checkOut: dayAfter, guests: 2, rooms: 1 });
  const update = (key, value) => setSearch((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!search.city.trim()) return alert("Please enter a city or hotel name.");
    if (search.checkOut <= search.checkIn) return alert("Check-out must be after check-in.");
    navigate(`/dashboard/hotels/list?${queryString(search)}`);
  };
  return <div className="hotel-page">
    <section className="hotel-hero">
      <h1><FaHotel /> Find your perfect stay</h1>
      <p>Search real hotel inventory, live room prices, and flexible options.</p>
      <form className="hotel-search-form" onSubmit={submit}>
        <Field label="City or hotel" value={search.city} onChange={(v) => update("city", v)} placeholder="Goa, Mumbai, Jaipur..." />
        <Field label="Check-in" type="date" min={tomorrow} value={search.checkIn} onChange={(v) => update("checkIn", v)} />
        <Field label="Check-out" type="date" min={search.checkIn} value={search.checkOut} onChange={(v) => update("checkOut", v)} />
        <Field label="Guests" type="number" min="1" value={search.guests} onChange={(v) => update("guests", v)} />
        <Field label="Rooms" type="number" min="1" value={search.rooms} onChange={(v) => update("rooms", v)} />
        <button className="hotel-btn" type="submit"><FaSearch /> Search</button>
      </form>
    </section>
    <div className="hotel-panel"><h2>Book with confidence</h2><div className="hotel-grid">
      <Info title="Live availability" text="Room stock and pricing come directly from hotel vendors." />
      <Info title="Secure TixHub payment" text="Your payment is verified before inventory is reserved." />
      <Info title="Easy trip management" text="Confirmation, QR check-in, invoice, and cancellation in one place." />
    </div></div>
  </div>;
}
function Field({ label, onChange, ...props }) { return <label className="hotel-field"><span>{label}</span><input {...props} onChange={(e) => onChange(e.target.value)} required /></label>; }
function Info({ title, text }) { return <div><h3>{title}</h3><p>{text}</p></div>; }
