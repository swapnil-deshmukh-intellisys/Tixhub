import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BarChart3, CalendarDays, Eye, Pencil, Plus, RefreshCw, ToggleLeft, Trash2 } from "lucide-react";
import "./VendorServiceModule.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });

const configs = {
  buses: {
    singular: "bus", title: "Bus", nameKey: "busName", numberKey: "busNumber", capacityKey: "totalSeats", availableKey: "availableSeats", bookedKey: "bookedSeats", priceKey: "seatPrice",
    fields: [
      ["busName", "Bus name", "text"], ["busNumber", "Bus number", "text"], ["operatorName", "Operator name", "text"],
      ["fromCity", "From city", "text"], ["toCity", "To city", "text"], ["departureDateTime", "Departure date/time", "datetime-local"],
      ["arrivalDateTime", "Arrival date/time", "datetime-local"], ["busType", "Bus type", "select", ["AC", "Non-AC", "Sleeper", "Seater", "AC Sleeper", "AC Seater"]],
      ["totalSeats", "Total seats", "number"], ["seatPrice", "Seat price", "number"], ["availableSeats", "Available seats", "number"], ["bookedSeats", "Booked seats", "number"],
    ],
    columns: [["busName", "Bus"], ["busNumber", "Number"], ["operatorName", "Operator"], ["fromCity", "From"], ["toCity", "To"], ["departureDateTime", "Departure"], ["busType", "Type"], ["seatPrice", "Price"]],
  },
  trains: {
    singular: "train", title: "Train", nameKey: "trainName", numberKey: "trainNumber", capacityKey: "totalSeats", availableKey: "availableSeats", bookedKey: "bookedSeats", priceKey: "seatPrice",
    fields: [
      ["trainName", "Train name", "text"], ["trainNumber", "Train number", "text"], ["fromStation", "From station", "text"], ["toStation", "To station", "text"],
      ["departureDateTime", "Departure date/time", "datetime-local"], ["arrivalDateTime", "Arrival date/time", "datetime-local"], ["coachType", "Coach type", "select", ["General", "Sleeper", "AC 3 Tier", "AC 2 Tier", "First Class"]],
      ["totalSeats", "Total seats", "number"], ["seatPrice", "Seat price", "number"], ["availableSeats", "Available seats", "number"], ["bookedSeats", "Booked seats", "number"],
    ],
    columns: [["trainName", "Train"], ["trainNumber", "Number"], ["fromStation", "From"], ["toStation", "To"], ["departureDateTime", "Departure"], ["coachType", "Coach"], ["seatPrice", "Price"]],
  },
  events: {
    singular: "event", title: "Event", nameKey: "eventName", capacityKey: "totalTickets", availableKey: "availableTickets", bookedKey: "bookedTickets", priceKey: "ticketPrice", imageKey: "posterImage",
    fields: [
      ["eventName", "Event name", "text"], ["eventType", "Event type", "select", ["Concert", "Sports", "Conference", "Comedy", "Festival", "Workshop"]], ["organizerName", "Organizer name", "text"],
      ["venue", "Venue", "text"], ["city", "City", "text"], ["eventDateTime", "Event date/time", "datetime-local"], ["ticketType", "Ticket type", "text"],
      ["ticketPrice", "Ticket price", "number"], ["totalTickets", "Total tickets", "number"], ["availableTickets", "Available tickets", "number"], ["bookedTickets", "Booked tickets", "number"], ["posterImage", "Poster image URL", "url"],
    ],
    columns: [["eventName", "Event"], ["eventType", "Type"], ["organizerName", "Organizer"], ["venue", "Venue"], ["city", "City"], ["eventDateTime", "Date"], ["ticketPrice", "Price"]],
  },
  hotels: {
    singular: "hotel", title: "Hotel", nameKey: "hotelName", capacityKey: "totalRooms", availableKey: "availableRooms", bookedKey: "bookedRooms", priceKey: "pricePerNight", imageKey: "hotelImage",
    fields: [
      ["hotelName", "Hotel name", "text"], ["city", "City", "text"], ["address", "Address", "textarea"], ["roomType", "Room type", "select", ["Standard", "Deluxe", "Suite", "Family", "Executive"]],
      ["totalRooms", "Total rooms", "number"], ["availableRooms", "Available rooms", "number"], ["bookedRooms", "Booked rooms", "number"], ["pricePerNight", "Price per night", "number"],
      ["checkInTime", "Check-in time", "time"], ["checkOutTime", "Check-out time", "time"], ["amenities", "Amenities (comma separated)", "textarea"], ["hotelImage", "Hotel image URL", "url"],
    ],
    columns: [["hotelName", "Hotel"], ["city", "City"], ["roomType", "Room type"], ["totalRooms", "Rooms"], ["availableRooms", "Available"], ["pricePerNight", "Per night"]],
  },
};

const emptyForm = (config) => Object.fromEntries([...config.fields.map(([key, , type, options]) => [key, type === "select" ? options[0] : ""]), ["status", "active"]]);
const money = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
const rowId = (row) => row?._id || row?.id;
const displayValue = (key, value, config) => key === config.priceKey ? money(value) : key.toLowerCase().includes("datetime") && value ? new Date(value).toLocaleString("en-IN") : value ?? "-";
const formFromRecord = (config, record) => ({
  ...emptyForm(config),
  ...record,
  ...Object.fromEntries(config.fields.map(([key, , type]) => [key, type === "datetime-local" && record?.[key] ? String(record[key]).slice(0, 16) : record?.[key] ?? ""])),
});

export default function VendorServiceModule({ service, mode = "list", id, navigate }) {
  const config = configs[service];
  const endpoint = `${apiBase}/vendor/${service}`;
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(() => emptyForm(config));
  const [tab, setTab] = useState("listings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "details" || mode === "edit") {
        const response = await axios.get(`${endpoint}/${id}`, auth());
        const nextRecord = response.data?.data || response.data;
        setRecord(nextRecord);
        setForm(formFromRecord(config, nextRecord));
      } else if (mode === "list") {
        const [listingResponse, bookingResponse] = await Promise.allSettled([
          axios.get(endpoint, auth()),
          axios.get(`${endpoint}/bookings`, auth()),
        ]);
        if (listingResponse.status === "rejected") throw listingResponse.reason;
        setListings(Array.isArray(listingResponse.value.data) ? listingResponse.value.data : listingResponse.value.data?.data || []);
        setBookings(bookingResponse.status === "fulfilled" ? (Array.isArray(bookingResponse.value.data) ? bookingResponse.value.data : bookingResponse.value.data?.data || []) : []);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to load ${config.title.toLowerCase()} data.`);
    } finally {
      setLoading(false);
    }
  }, [config, endpoint, id, mode]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => ({
    total: listings.length,
    active: listings.filter((item) => item.status === "active").length,
    bookings: bookings.length || listings.reduce((sum, item) => sum + Number(item.totalBookings || 0), 0),
    revenue: bookings.reduce((sum, item) => sum + Number(item.amount || item.totalAmount || 0), 0) || listings.reduce((sum, item) => sum + Number(item.revenue || 0), 0),
  }), [bookings, listings]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (mode === "edit") await axios.put(`${endpoint}/${id}`, form, auth());
      else await axios.post(endpoint, form, auth());
      navigate(`/vendor/${service}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to save ${config.singular}.`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete ${item[config.nameKey] || config.title}?`)) return;
    try { await axios.delete(`${endpoint}/${rowId(item)}`, auth()); await loadData(); }
    catch (requestError) { setError(requestError.response?.data?.message || `Unable to delete ${config.singular}.`); }
  };

  const setStatus = async (item, status) => {
    setMessage("");
    try {
      await axios.put(`${endpoint}/${rowId(item)}`, { ...item, status }, auth());
      setMessage(`${item[config.nameKey] || config.title} is now ${status}.`);
      await loadData();
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to update status."); }
  };

  if (loading) return <div className="vsm-alert">Loading {config.title.toLowerCase()} module...</div>;

  if (mode === "add" || mode === "edit") return (
    <section className="vsm-panel">
      <div className="vsm-heading"><div><h1>{mode === "edit" ? "Edit" : "Add"} {config.title}</h1><p>Enter the listing, inventory, schedule and pricing details.</p></div><button type="button" onClick={() => navigate(`/vendor/${service}`)}>Back to listings</button></div>
      {error && <div className="vsm-alert error">{error}</div>}
      <form className="vsm-form" onSubmit={submit}>
        {config.fields.map(([key, label, type, options]) => <label className={type === "textarea" ? "wide" : ""} key={key}><span>{label}</span>{type === "select" ? <select value={form[key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}>{options.map((option) => <option key={option}>{option}</option>)}</select> : type === "textarea" ? <textarea value={form[key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} required /> : <input min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} type={type} value={form[key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} required />}</label>)}
        <label><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="active">Active</option><option value="hidden">Hidden</option><option value="inactive">Inactive</option></select></label>
        <div className="vsm-form-actions"><button type="button" onClick={() => navigate(`/vendor/${service}`)}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving..." : `Save ${config.title}`}</button></div>
      </form>
    </section>
  );

  if (mode === "details") return (
    <section className="vsm-panel">
      <div className="vsm-heading"><div><h1>{record?.[config.nameKey] || `${config.title} details`}</h1><p>Complete listing and inventory information.</p></div><div className="vsm-heading-actions"><button onClick={() => navigate(`/vendor/edit-${config.singular}/${id}`)}><Pencil size={15} />Edit</button><button onClick={() => navigate(`/vendor/${service}`)}>Back</button></div></div>
      {error && <div className="vsm-alert error">{error}</div>}
      <div className="vsm-detail-grid">{config.fields.map(([key, label]) => <div key={key}><small>{label}</small><strong>{displayValue(key, record?.[key], config)}</strong></div>)}<div><small>Status</small><strong className={`vsm-status ${record?.status}`}>{record?.status || "active"}</strong></div></div>
    </section>
  );

  return (
    <>
      <section className="vsm-heading vsm-page-heading"><div><h1>{config.title} Vendor Dashboard</h1><p>Manage listings, bookings, inventory, status and revenue.</p></div><button className="primary" type="button" onClick={() => navigate(`/vendor/add-${config.singular}`)}><Plus size={16} />Add {config.title}</button></section>
      {error && <div className="vsm-alert error">{error}</div>}{message && <div className="vsm-alert success">{message}</div>}
      <section className="vsm-stats"><article><span><BarChart3 /></span><div><small>Total listings</small><strong>{stats.total}</strong></div></article><article><span><CalendarDays /></span><div><small>Total bookings</small><strong>{stats.bookings}</strong></div></article><article><span><BarChart3 /></span><div><small>Revenue</small><strong>{money(stats.revenue)}</strong></div></article><article><span><ToggleLeft /></span><div><small>Active listings</small><strong>{stats.active}</strong></div></article></section>
      <section className="vsm-panel">
        <div className="vsm-tabs"><button className={tab === "listings" ? "active" : ""} onClick={() => setTab("listings")}>Listings</button><button className={tab === "bookings" ? "active" : ""} onClick={() => setTab("bookings")}>Booking management</button><button className="refresh" onClick={loadData}><RefreshCw size={14} />Refresh</button></div>
        {tab === "listings" ? <div className="vsm-table-wrap"><table><thead><tr>{config.columns.map(([, label]) => <th key={label}>{label}</th>)}<th>Inventory</th><th>Status</th><th>Actions</th></tr></thead><tbody>{listings.map((item) => <tr key={rowId(item)}>{config.columns.map(([key]) => <td key={key}>{displayValue(key, item[key], config)}</td>)}<td>{item[config.availableKey] ?? 0} / {item[config.capacityKey] ?? 0}</td><td><span className={`vsm-status ${item.status}`}>{item.status}</span></td><td><div className="vsm-actions"><button title="View" onClick={() => navigate(`/vendor/${service}/${rowId(item)}`)}><Eye size={14} /></button><button title="Edit" onClick={() => navigate(`/vendor/edit-${config.singular}/${rowId(item)}`)}><Pencil size={14} /></button><button title="Active" onClick={() => setStatus(item, "active")}>Active</button><button title="Hide" onClick={() => setStatus(item, "hidden")}>Hide</button><button className="danger" title="Delete" onClick={() => remove(item)}><Trash2 size={14} /></button></div></td></tr>)}{!listings.length && <tr><td colSpan={config.columns.length + 3}>No {service} found. Add your first listing.</td></tr>}</tbody></table></div> : <BookingTable bookings={bookings} title={config.title} />}
      </section>
    </>
  );
}

function BookingTable({ bookings, title }) {
  return <div className="vsm-table-wrap"><table><thead><tr><th>Booking ID</th><th>{title}</th><th>Customer</th><th>Quantity</th><th>Amount</th><th>Status</th><th>Booked on</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id || booking._id}><td>{booking.bookingCode || booking.booking_code || booking.id}</td><td>{booking.title || booking.listingName || title}</td><td>{booking.customerName || booking.customer_name || "Customer"}</td><td>{booking.quantity || booking.seats?.length || booking.rooms || booking.tickets || 1}</td><td>{money(booking.amount || booking.totalAmount)}</td><td><span className={`vsm-status ${booking.bookingStatus || booking.status}`}>{booking.bookingStatus || booking.status}</span></td><td>{booking.createdAt || booking.created_at ? new Date(booking.createdAt || booking.created_at).toLocaleDateString("en-IN") : "-"}</td></tr>)}{!bookings.length && <tr><td colSpan="7">No bookings available for this module.</td></tr>}</tbody></table></div>;
}
