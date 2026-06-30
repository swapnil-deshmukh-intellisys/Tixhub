import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  Bus,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit,
  Eye,
  IndianRupee,
  MapPin,
  MessageSquare,
  Percent,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sofa,
  Star,
  Ticket,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import "./BusVendorDashboard.css";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });

const emptyForm = {
  busName: "", operatorName: "", busNumber: "", busType: "AC Sleeper",
  fromCity: "", toCity: "", departureDate: "", departureTime: "", arrivalTime: "",
  duration: "", price: "", seatCount: "36", pickupPoint: "", dropPoint: "",
  amenities: "", status: "active"
};

const emptyTrend = [
  { label: "6 AM", bookings: 0, revenue: 0 },
  { label: "10 AM", bookings: 0, revenue: 0 },
  { label: "2 PM", bookings: 0, revenue: 0 },
  { label: "6 PM", bookings: 0, revenue: 0 },
  { label: "10 PM", bookings: 0, revenue: 0 },
];

const demoBookings = [
  ["THB123456", "Rahul Patil", "9876543210", "Volvo 9600", "Pune → Mumbai", "2026-06-30", "A5", "₹850", "Paid", "Confirmed"],
  ["THB123457", "Sneha Kadam", "9876501234", "Scania MultiAxle", "Pune → Nashik", "2026-06-30", "B7", "₹600", "Paid", "Confirmed"],
  ["THB123458", "Amit Singh", "9000090000", "Bharat Benz", "Mumbai → Pune", "2026-06-30", "L12", "₹750", "Pending", "Pending"],
];

const seatStatusInitial = { 5: "ladies", 9: "booked", 18: "reserved", 21: "blocked", 30: "ladies", 32: "booked" };

function getId(row) { return row?._id || row?.id; }
function getDetails(row) { return row?.details || row || {}; }
function formatRoute(d) { return `${d.fromCity || d.source || "-"} → ${d.toCity || d.destination || "-"}`; }
function money(value) { return `₹${Number(value || 0).toLocaleString("en-IN")}`; }
function normaliseTrend(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return emptyTrend;
  return rows.map((item, index) => ({
    label: item.label || item.date || item.day || item.month || `P${index + 1}`,
    bookings: Number(item.bookings || item.totalBookings || 0),
    revenue: Number(item.revenue || item.totalRevenue || 0),
  }));
}

export default function BusVendorDashboard() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [view, setView] = useState("dashboard");
  const [range, setRange] = useState("day");
  const [trendData, setTrendData] = useState(emptyTrend);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState("lower");
  const [seatStatus, setSeatStatus] = useState(seatStatusInitial);
  const [now, setNow] = useState(new Date());

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/vendor-listings`, auth());
      const rows = Array.isArray(res.data) ? res.data : [];
      setBuses(rows.filter((item) => item.module === "bus"));
    } catch (err) {
      alert(err.response?.data?.message || "Unable to load bus data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingTrends = async (selectedRange = range) => {
    setTrendLoading(true);
    try {
      const res = await axios.get(`${API}/vendor/bus/booking-trends?range=${selectedRange}`, auth());
      setTrendData(normaliseTrend(res.data?.data || res.data));
    } catch (err) {
      setTrendData(emptyTrend);
    } finally {
      setTrendLoading(false);
    }
  };

  useEffect(() => { fetchBuses(); }, []);
  useEffect(() => { fetchBookingTrends(range); }, [range]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row) => {
    const d = getDetails(row);
    setEditing(row);
    setForm({
      ...emptyForm,
      ...d,
      busName: d.busName || row.title || "",
      operatorName: d.operatorName || "",
      busNumber: d.busNumber || "",
      busType: d.busType || "AC Sleeper",
      fromCity: d.fromCity || d.source || "",
      toCity: d.toCity || d.destination || "",
      price: d.price || row.price || "",
      seatCount: d.seatCount || row.inventory || "36",
      status: row.status || d.status || "active",
    });
    setModalOpen(true);
  };

  const saveBus = async (e) => {
    e.preventDefault();
    const details = { ...form, price: Number(form.price || 0), seatCount: Number(form.seatCount || 0), source: form.fromCity, destination: form.toCity };
    try {
      if (editing) {
        await axios.put(`${API}/vendor-listings/${getId(editing)}`, { module: "bus", details, status: form.status || "active" }, auth());
        alert("Bus updated successfully");
      } else {
        await axios.post(`${API}/vendor-listings`, { module: "bus", details }, auth());
        alert("Bus added successfully");
      }
      setModalOpen(false);
      fetchBuses();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to save bus");
    }
  };

  const deleteBus = async (row) => {
    if (!window.confirm("Delete this bus?")) return;
    try {
      await axios.delete(`${API}/vendor-listings/${getId(row)}`, auth());
      fetchBuses();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete bus");
    }
  };

  const blockSeat = () => {
    if (!selectedSeat) return alert("Select a seat first");
    setSeatStatus((s) => ({ ...s, [selectedSeat]: "blocked" }));
  };

  const unblockSeat = () => {
    if (!selectedSeat) return alert("Select a seat first");
    setSeatStatus((s) => {
      const next = { ...s };
      delete next[selectedSeat];
      return next;
    });
  };

  const updateSeatPrice = () => {
    if (!selectedSeat) return alert("Select a seat first");
    alert(`Update price opened for seat ${selectedSeat}`);
  };

  const summary = useMemo(() => {
    const active = buses.filter((b) => (b.status || "active") === "active").length;
    const routes = new Set(buses.map((b) => formatRoute(getDetails(b)))).size;
    const totalSeats = buses.reduce((sum, b) => sum + Number(getDetails(b).seatCount || b.inventory || 0), 0);
    const bookedSeats = Object.values(seatStatus).filter((s) => s === "booked").length;
    const blockedSeats = Object.values(seatStatus).filter((s) => s === "blocked").length;
    const ladiesSeats = Object.values(seatStatus).filter((s) => s === "ladies").length;
    const reservedSeats = Object.values(seatStatus).filter((s) => s === "reserved").length;
    const revenue = buses.reduce((sum, b) => sum + Number(getDetails(b).price || b.price || 0), 0);
    const availableSeats = Math.max(totalSeats - bookedSeats - blockedSeats, 0);
    const occupancy = totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0;
    return { active, routes, totalSeats, bookedSeats, blockedSeats, ladiesSeats, reservedSeats, revenue, availableSeats, occupancy };
  }, [buses, seatStatus]);

  const stats = [
    ["Total Buses", buses.length, Bus, "+12%"], ["Active Buses", summary.active, CheckCircle2, "+8%"],
    ["Today's Trips", buses.length, CalendarDays, "+14%"], ["Total Routes", summary.routes, Route, "+6%"],
    ["Total Bookings", demoBookings.length, Ticket, "+18%"], ["Today's Bookings", demoBookings.length, Users, "+9%"],
    ["Revenue", money(summary.revenue), IndianRupee, "+21%"], ["Occupancy Rate", `${summary.occupancy}%`, Percent, "+5%"],
    ["Available Seats", summary.availableSeats, Sofa, "+4%"], ["Booked Seats", summary.bookedSeats, Ticket, "+10%"],
    ["Blocked Seats", summary.blockedSeats, ShieldCheck, "-2%"], ["Cancelled Bookings", 0, XCircle, "0%"],
  ];

  const operationCards = [
    ["Manage Buses", Bus, "dashboard"], ["Manage Routes", Route, "routes"], ["Trip Schedule", CalendarDays, "schedules"],
    ["Seat Management", Sofa, "seats"], ["Pricing", IndianRupee, "pricing"], ["Offers", Percent, "offers"],
    ["QR Scanner", QrCode, "scanner"], ["Reports", TrendingUp, "reports"],
  ];

  return (
    <div className="bus-pro-page">
      <section className="bus-hero bus-premium-hero">
        <div className="bus-hero-title-block">
          <h1>Bus Vendor Dashboard</h1>
          <p>Manage buses, routes, schedules, bookings, seats, and revenue.</p>
        </div>
        <div className="bus-welcome-card">
          <div><b>Welcome, Sagar Travels</b><small>Bus Vendor Panel</small></div>
          <div className="welcome-time"><span>{now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span><strong>{now.toLocaleTimeString("en-IN")}</strong></div>
          <div className="welcome-mini-grid"><span>Trips <b>{buses.length}</b></span><span>Revenue <b>{money(summary.revenue)}</b></span><span>Online <b>Live</b></span></div>
        </div>
        <div className="bus-hero-actions">
          <label className="bus-search-box"><Search size={20} /><input placeholder="Search buses, routes, bookings..." /></label>
          <button className="bus-icon-btn"><Bell size={20} /></button>
          <div className="bus-profile"><span>S</span><div><b>Sagar Travels</b><small>Vendor</small></div></div>
          <button className="bus-primary" onClick={openAdd}><Plus size={19} /> Add Bus</button>
        </div>
      </section>

      <section className="bus-top-actions">
        {[ ["Add Bus", openAdd], ["Add Route", () => setView("routes")], ["Add Schedule", () => setView("schedules")], ["Block Seats", () => setView("seats")] ].map(([label, action]) => <button key={label} onClick={action}><Plus size={17} />{label}</button>)}
      </section>

      <section className="bus-stats-row">
        {stats.map(([label, value, Icon, trend]) => (
          <article className="bus-stat-card" key={label}>
            <span><Icon size={22} /></span>
            <div><p>{label}</p><h2>{value}</h2><small className={String(trend).startsWith("-") ? "down" : "up"}><TrendingUp size={13} /> {trend} this month</small></div>
          </article>
        ))}
      </section>

      <section className="bus-dashboard-grid">
        <div className="bus-panel bus-chart-panel">
          <div className="bus-panel-head"><h2>Booking Trend</h2><div className="range-tabs">{["day","week","month","year"].map((item) => <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div>
          {trendLoading ? <div className="bus-skeleton chart" /> : (
            <ResponsiveContainer width="100%" height={275}>
              <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value, name) => name === "revenue" ? money(value) : value} />
                <Area type="monotone" dataKey="bookings" stroke="#079449" fill="#dff8ea" strokeWidth={3} name="bookings" />
                <Area type="monotone" dataKey="revenue" stroke="#0f7a43" fill="#effcf4" strokeWidth={3} name="revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <RightPanel buses={buses} now={now} />
      </section>

      <section className="bus-panel">
        <div className="bus-panel-head"><h2>Bus Operations</h2><button onClick={fetchBuses}><RefreshCw size={15}/> Refresh</button></div>
        <div className="bus-quick-grid">
          {operationCards.map(([label, Icon, target]) => <button key={label} onClick={() => setView(target)}><Icon size={22} /><b>{label}</b><small>Open module</small></button>)}
        </div>
      </section>

      <section className="bus-content-grid bus-mid-grid">
        <SeatPanel selectedDeck={selectedDeck} setSelectedDeck={setSelectedDeck} selectedSeat={selectedSeat}
          setSelectedSeat={setSelectedSeat} seatStatus={seatStatus} blockSeat={blockSeat} unblockSeat={unblockSeat}
          updateSeatPrice={updateSeatPrice} summary={summary} />
        <DynamicPricing />
      </section>

      <section className="bus-panel bus-table-panel">
        <div className="bus-panel-head"><h2>Booking Management</h2><button onClick={() => setView("bookings")}>View Last 10</button></div>
        <Bookings />
      </section>

      <section className="bus-bottom-grid">
        <Reports summary={summary} />
        <Reviews />
        <Activity />
      </section>

      <section className="bus-panel bus-table-panel">
        <div className="bus-panel-head"><h2>Bus Table</h2><button onClick={fetchBuses}>Refresh</button></div>
        {loading ? <div className="bus-skeleton table" /> : (
          <div className="bus-table-scroll">
            <table className="bus-pro-table">
              <thead><tr><th>Bus Name</th><th>Operator</th><th>Bus Number</th><th>Bus Type</th><th>Source</th><th>Destination</th><th>Departure</th><th>Arrival</th><th>Duration</th><th>Fare</th><th>Seats</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {buses.length === 0 && <tr><td colSpan="13">No buses added yet. Click Add Bus.</td></tr>}
                {buses.map((row) => {
                  const d = getDetails(row);
                  return <tr key={getId(row)}><td>{d.busName || row.title || "Bus"}</td><td>{d.operatorName || "-"}</td><td>{d.busNumber || "-"}</td><td><span className="bus-pill">{d.busType || "-"}</span></td><td>{d.fromCity || "-"}</td><td>{d.toCity || "-"}</td><td>{d.departureTime || "-"}</td><td>{d.arrivalTime || "-"}</td><td>{d.duration || "-"}</td><td>₹{d.price || row.price || 0}</td><td>{d.seatCount || row.inventory || 0}</td><td><span className="bus-status">{row.status || "active"}</span></td><td><div className="bus-actions"><button title="Edit" onClick={() => openEdit(row)}><Edit size={16} /></button><button title="Delete" onClick={() => deleteBus(row)}><Trash2 size={16} /></button><button title="Seat Management" onClick={() => setView("seats")}><Sofa size={16} /></button><button title="Bookings" onClick={() => setView("bookings")}><Ticket size={16} /></button></div></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {view !== "dashboard" && (
        <section className="bus-panel bus-full-panel">
          <div className="bus-panel-head"><h2>{view[0].toUpperCase() + view.slice(1)}</h2><button onClick={() => setView("dashboard")}>Close</button></div>
          {view === "bookings" && <Bookings />}
          {view === "reports" && <Reports summary={summary} />}
          {view === "pricing" && <DynamicPricing />}
          {view === "routes" && <RouteManagement buses={buses} />}
          {view === "schedules" && <TripManagement buses={buses} />}
          {view === "passengers" && <SimpleRows rows={demoBookings.map((b) => [b[1], b[2], b[3], b[4]])} heads={["Passenger", "Mobile", "Bus", "Route"]} />}
          {view === "seats" && <p>Select seats from the Seat Management panel. Block, unblock, view passenger, booking, and price update actions are available.</p>}
          {["offers","scanner"].includes(view) && <EmptyState title={`${view} module`} text="Connect this card with your existing route/component when ready." />}
        </section>
      )}

      {modalOpen && (
        <div className="bus-modal-backdrop">
          <form className="bus-modal" onSubmit={saveBus}>
            <div className="bus-panel-head"><h2>{editing ? "Edit Bus" : "Add Bus"}</h2><button type="button" onClick={() => setModalOpen(false)}>Close</button></div>
            <div className="bus-form-grid">
              {[["busName", "Bus Name"], ["operatorName", "Operator"], ["busNumber", "Bus Number"], ["fromCity", "Source"], ["toCity", "Destination"], ["departureDate", "Departure Date", "date"], ["departureTime", "Departure Time", "time"], ["arrivalTime", "Arrival Time", "time"], ["duration", "Duration"], ["price", "Fare", "number"], ["seatCount", "Seats", "number"], ["pickupPoint", "Pickup Point"], ["dropPoint", "Drop Point"], ["amenities", "Amenities"]].map(([name, label, type = "text"]) => <label key={name}>{label}<input type={type} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required={["busName","operatorName","busNumber","fromCity","toCity","price","seatCount"].includes(name)} /></label>)}
              <label>Bus Type<select value={form.busType} onChange={(e) => setForm({ ...form, busType: e.target.value })}>{["AC", "Non AC", "Sleeper", "Semi Sleeper", "Seater", "Luxury", "AC Sleeper", "AC Seater"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
            <button className="bus-primary bus-save" type="submit">{editing ? "Update Bus" : "Save Bus"}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function RightPanel({ buses, now }) {
  const first = buses[0] ? getDetails(buses[0]) : null;
  return <aside className="bus-panel bus-right-panel"><h2>Today's Calendar</h2><div className="calendar-card"><CalendarDays size={26}/><div><b>{now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</b><small>{now.toLocaleDateString("en-IN", { weekday: "long" })}</small></div></div>{[["Upcoming Trips", buses.length], ["Next Departure", first?.departureTime || "--"], ["Pending Approvals", 0], ["Recent Notifications", 4], ["Driver Available", "Live"], ["Bus Available", buses.length]].map(([k,v]) => <div className="right-row" key={k}><span>{k}</span><b>{v}</b></div>)}</aside>;
}

function SeatPanel({ selectedDeck, setSelectedDeck, selectedSeat, setSelectedSeat, seatStatus, blockSeat, unblockSeat, updateSeatPrice, summary }) {
  return <div className="bus-panel seat-panel"><div className="bus-panel-head"><h2>Live Seat Overview</h2><button>View All</button></div><div className="seat-mini-grid">{[["Available", summary.availableSeats], ["Booked", summary.bookedSeats], ["Blocked", summary.blockedSeats], ["Ladies", summary.ladiesSeats], ["Sleeper", 12], ["Window", 8], ["Emergency", 2]].map(([a,b]) => <span key={a}>{a}<b>{b}</b></span>)}</div><div className="deck-tabs"><button className={selectedDeck === "lower" ? "active" : ""} onClick={() => setSelectedDeck("lower")}>Lower Deck</button><button className={selectedDeck === "upper" ? "active" : ""} onClick={() => setSelectedDeck("upper")}>Upper Deck</button></div><div className="seat-legend"><span><i />Available</span><span><i className="booked" />Booked</span><span><i className="blocked" />Blocked</span><span><i className="ladies" />Ladies</span><span><i className="reserved" />Reserved</span></div><div className="driver-door"><b>Driver</b><b>Entry Door</b></div><div className="bus-layout">{Array.from({ length: 36 }, (_, i) => { const seat = i + 1; const status = seatStatus[seat] || "available"; return <button key={seat} className={`seat-btn ${status} ${selectedSeat === seat ? "selected" : ""}`} onClick={() => setSelectedSeat(seat)}>{seat}</button>; })}</div><div className="seat-controls"><button onClick={blockSeat}>Block Seat</button><button className="danger" onClick={unblockSeat}>Unblock Seat</button><button className="outline" onClick={updateSeatPrice}><IndianRupee size={16}/> Update Price</button><button className="outline" onClick={() => selectedSeat ? alert(`Booking for seat ${selectedSeat}: THB123456`) : alert("Select a seat first")}><Ticket size={16}/> View Booking</button></div></div>;
}

function DynamicPricing() {
  return <div className="bus-panel"><div className="bus-panel-head"><h2>Dynamic Fare</h2><button>Update</button></div><div className="fare-grid">{["Morning Fare", "Afternoon Fare", "Evening Fare", "Weekend Fare", "Festival Fare"].map((label, i) => <label key={label}>{label}<input defaultValue={[650,720,800,950,1100][i]} /></label>)}</div><div className="category-pills">{["Regular", "Semi Sleeper", "Sleeper", "Luxury"].map((x) => <span key={x}>{x}</span>)}</div></div>;
}

function Bookings() {
  const heads = ["Booking ID","Passenger","Mobile","Bus","Route","Journey Date","Seats","Amount","Payment Status","Booking Status","QR Ticket","Actions"];
  return <div className="bus-table-scroll"><table className="bus-pro-table"><thead><tr>{heads.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{demoBookings.slice(0, 10).map((r) => <tr key={r[0]}>{r.map((c) => <td key={c}>{c}</td>)}<td><span className="bus-pill"><QrCode size={14}/> QR</span></td><td><div className="bus-actions"><button><Eye size={16}/></button><button><Printer size={16}/></button><button><XCircle size={16}/></button><button><CreditCard size={16}/></button></div></td></tr>)}</tbody></table></div>;
}

function RouteManagement({ buses }) { return <SimpleRows heads={["From", "To", "Distance", "Travel Time", "Boarding Points", "Dropping Points", "Status", "Actions"]} rows={buses.map((b) => { const d = getDetails(b); return [d.fromCity || "-", d.toCity || "-", d.distance || "-", d.duration || "-", d.pickupPoint || "-", d.dropPoint || "-", b.status || "active", "Edit / Delete / Activate"]; })} />; }
function TripManagement({ buses }) { return <SimpleRows heads={["Trip", "Departure Time", "Arrival Time", "Bus", "Driver", "Status", "Seats"]} rows={(buses.length ? buses : [{}]).map((b, i) => { const d = getDetails(b); return [["Morning", "Afternoon", "Evening", "Night"][i % 4], d.departureTime || "-", d.arrivalTime || "-", d.busName || "-", d.driver || "Assign Driver", b.status || "active", d.seatCount || "36"]; })} />; }
function Reports({ summary }) { return <div className="bus-panel reports-panel"><h2>Reports</h2><div className="revenue-grid">{[["Daily Revenue", money(summary.revenue)], ["Weekly Revenue", money(summary.revenue * 7)], ["Monthly Revenue", money(summary.revenue * 30)], ["Occupancy", `${summary.occupancy}%`], ["Cancellation Rate", "0%"]].map(([a,b]) => <article key={a}><p>{a}</p><h3>{b}</h3></article>)}</div></div>; }
function Reviews() { return <div className="bus-panel"><div className="bus-panel-head"><h2>Customer Reviews</h2><span className="rating"><Star size={15}/> 4.6</span></div>{["Clean bus and on-time pickup.", "Good driver behaviour.", "Seat booking was smooth."].map((x) => <div className="review-row" key={x}><MessageSquare size={16}/><span>{x}</span><button>Reply</button></div>)}</div>; }
function Activity() { return <div className="bus-panel"><h2>Live Activity</h2>{["Passenger booked seat A5.", "Bus MH12AB1234 departed.", "New schedule created.", "Fare updated.", "Refund request received."].map((x) => <div className="activity-row" key={x}><Clock3 size={15}/><span>{x}</span></div>)}</div>; }
function EmptyState({ title, text }) { return <div className="empty-state"><MapPin size={28}/><h3>{title}</h3><p>{text}</p></div>; }
function SimpleRows({ heads, rows }) { return <div className="bus-table-scroll"><table className="bus-pro-table"><thead><tr>{heads.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={heads.length}>No records found.</td></tr> : rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>; }
