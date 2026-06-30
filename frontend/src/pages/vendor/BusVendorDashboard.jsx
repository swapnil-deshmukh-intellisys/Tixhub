import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Bell, Bus, CalendarDays, CheckCircle2, Edit, Eye, IndianRupee,
  Plus, Route, Search, Sofa, Ticket, Trash2, Users, XCircle
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

const demoBookings = [
  ["THB123456", "Rahul Patil", "12", "Volvo 9600", "Pune → Mumbai", "08:00 PM", "05:00 AM", "₹850", "Paid", "Confirmed"],
  ["THB123457", "Sneha Kadam", "21", "Scania MultiAxle", "Pune → Nashik", "07:30 PM", "11:00 PM", "₹600", "Paid", "Confirmed"],
  ["THB123458", "Amit Singh", "5", "Bharat Benz", "Mumbai → Pune", "06:00 AM", "12:30 PM", "₹750", "Pending", "Pending"],
];

const seatStatusInitial = { 5: "ladies", 9: "booked", 18: "reserved", 21: "blocked", 30: "ladies", 32: "booked" };

function getId(row) {
  return row?._id || row?.id;
}

function getDetails(row) {
  return row?.details || row || {};
}

function formatRoute(d) {
  return `${d.fromCity || d.source || "-"} → ${d.toCity || d.destination || "-"}`;
}

export default function BusVendorDashboard() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("dashboard");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState("lower");
  const [seatStatus, setSeatStatus] = useState(seatStatusInitial);

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

  useEffect(() => { fetchBuses(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

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
    const details = {
      ...form,
      price: Number(form.price || 0),
      seatCount: Number(form.seatCount || 0),
      source: form.fromCity,
      destination: form.toCity,
    };

    try {
      if (editing) {
        await axios.put(`${API}/vendor-listings/${getId(editing)}`, {
          module: "bus",
          details,
          status: form.status || "active",
        }, auth());
        alert("Bus updated successfully");
      } else {
        await axios.post(`${API}/vendor-listings`, {
          module: "bus",
          details,
        }, auth());
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

  const stats = useMemo(() => {
    const active = buses.filter((b) => (b.status || "active") === "active").length;
    const routes = new Set(buses.map((b) => formatRoute(getDetails(b)))).size;
    const totalSeats = buses.reduce((sum, b) => sum + Number(getDetails(b).seatCount || b.inventory || 0), 0);
    const bookedSeats = Object.values(seatStatus).filter((s) => s === "booked").length;
    const revenue = buses.reduce((sum, b) => sum + Number(getDetails(b).price || b.price || 0), 0);
    return [
      ["Total Buses", buses.length, Bus],
      ["Active Buses", active, CheckCircle2],
      ["Routes", routes, Route],
      ["Today's Trips", buses.length, CalendarDays],
      ["Passengers", 568, Users],
      ["Revenue", `₹${revenue.toLocaleString("en-IN")}`, IndianRupee],
      ["Available Seats", Math.max(totalSeats - bookedSeats, 0), Sofa],
      ["Booked Seats", bookedSeats, Ticket],
      ["Cancelled Bookings", 0, XCircle],
    ];
  }, [buses, seatStatus]);

  return (
    <div className="bus-pro-page">
      <section className="bus-hero">
        <div>
          <h1>Welcome Bus Vendor</h1>
          <p>Manage buses, routes, schedules, bookings, seats, and revenue.</p>
        </div>
        <div className="bus-hero-actions">
          <label className="bus-search-box"><Search size={20} /><input placeholder="Search buses, routes, bookings..." /></label>
          <button className="bus-icon-btn"><Bell size={20} /></button>
          <div className="bus-profile"><span>S</span><div><b>Sagar Travels</b><small>Vendor</small></div></div>
          <button className="bus-primary" onClick={openAdd}><Plus size={19} /> Add Bus</button>
        </div>
      </section>

      <section className="bus-stats-row">
        {stats.map(([label, value, Icon]) => (
          <article className="bus-stat-card" key={label}>
            <span><Icon size={24} /></span>
            <div><p>{label}</p><h2>{value}</h2></div>
          </article>
        ))}
      </section>

      <section className="bus-panel">
        <h2>Quick Actions</h2>
        <div className="bus-quick-grid">
          {[
            ["Add Bus", openAdd], ["Manage Bus", () => setView("dashboard")], ["Routes", () => setView("routes")],
            ["Schedules", () => setView("schedules")], ["Seat Management", () => setView("seats")],
            ["Bookings", () => setView("bookings")], ["Passengers", () => setView("passengers")], ["Revenue", () => setView("revenue")]
          ].map(([label, action]) => (
            <button key={label} onClick={action}><Bus size={22} /><b>{label}</b></button>
          ))}
        </div>
      </section>

      <section className="bus-content-grid">
        <div className="bus-panel bus-table-panel">
          <div className="bus-panel-head"><h2>Bus Table</h2><button onClick={fetchBuses}>Refresh</button></div>
          {loading ? <p>Loading...</p> : (
            <div className="bus-table-scroll">
              <table className="bus-pro-table">
                <thead><tr>
                  <th>Bus Name</th><th>Operator</th><th>Bus Number</th><th>Bus Type</th><th>Source</th><th>Destination</th>
                  <th>Departure</th><th>Arrival</th><th>Duration</th><th>Fare</th><th>Seats</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {buses.length === 0 && <tr><td colSpan="13">No buses added yet. Click Add Bus.</td></tr>}
                  {buses.map((row) => {
                    const d = getDetails(row);
                    return (
                      <tr key={getId(row)}>
                        <td>{d.busName || row.title || "Bus"}</td>
                        <td>{d.operatorName || "-"}</td>
                        <td>{d.busNumber || "-"}</td>
                        <td><span className="bus-pill">{d.busType || "-"}</span></td>
                        <td>{d.fromCity || "-"}</td>
                        <td>{d.toCity || "-"}</td>
                        <td>{d.departureTime || "-"}</td>
                        <td>{d.arrivalTime || "-"}</td>
                        <td>{d.duration || "-"}</td>
                        <td>₹{d.price || row.price || 0}</td>
                        <td>{d.seatCount || row.inventory || 0}</td>
                        <td><span className="bus-status">{row.status || "active"}</span></td>
                        <td><div className="bus-actions">
                          <button title="Edit" onClick={() => openEdit(row)}><Edit size={16} /></button>
                          <button title="Delete" onClick={() => deleteBus(row)}><Trash2 size={16} /></button>
                          <button title="Seat Management" onClick={() => setView("seats")}><Sofa size={16} /></button>
                          <button title="Bookings" onClick={() => setView("bookings")}><Ticket size={16} /></button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <SeatPanel selectedDeck={selectedDeck} setSelectedDeck={setSelectedDeck} selectedSeat={selectedSeat}
          setSelectedSeat={setSelectedSeat} seatStatus={seatStatus} blockSeat={blockSeat} unblockSeat={unblockSeat} />
      </section>

      {view !== "dashboard" && (
        <section className="bus-panel bus-full-panel">
          <div className="bus-panel-head"><h2>{view[0].toUpperCase() + view.slice(1)}</h2><button onClick={() => setView("dashboard")}>Close</button></div>
          {view === "bookings" && <Bookings />}
          {view === "revenue" && <Revenue />}
          {view === "routes" && <SimpleRows rows={buses.map((b) => [formatRoute(getDetails(b)), getDetails(b).departureTime || "-", getDetails(b).price || 0])} heads={["Route", "Departure", "Fare"]} />}
          {view === "schedules" && <SimpleRows rows={buses.map((b) => [getDetails(b).busName || "Bus", getDetails(b).departureDate || "-", getDetails(b).departureTime || "-", getDetails(b).arrivalTime || "-"])} heads={["Bus", "Date", "Departure", "Arrival"]} />}
          {view === "passengers" && <SimpleRows rows={demoBookings.map((b) => [b[1], b[2], b[3], b[4]])} heads={["Passenger", "Seat", "Bus", "Route"]} />}
          {view === "seats" && <p>Select seats from the Seat Management panel. Block, unblock, view passenger and booking are working.</p>}
        </section>
      )}

      {modalOpen && (
        <div className="bus-modal-backdrop">
          <form className="bus-modal" onSubmit={saveBus}>
            <div className="bus-panel-head"><h2>{editing ? "Edit Bus" : "Add Bus"}</h2><button type="button" onClick={() => setModalOpen(false)}>Close</button></div>
            <div className="bus-form-grid">
              {[
                ["busName", "Bus Name"], ["operatorName", "Operator"], ["busNumber", "Bus Number"], ["fromCity", "Source"],
                ["toCity", "Destination"], ["departureDate", "Departure Date", "date"], ["departureTime", "Departure Time", "time"],
                ["arrivalTime", "Arrival Time", "time"], ["duration", "Duration"], ["price", "Fare", "number"],
                ["seatCount", "Seats", "number"], ["pickupPoint", "Pickup Point"], ["dropPoint", "Drop Point"], ["amenities", "Amenities"]
              ].map(([name, label, type = "text"]) => (
                <label key={name}>{label}
                  <input type={type} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required={["busName","operatorName","busNumber","fromCity","toCity","price","seatCount"].includes(name)} />
                </label>
              ))}
              <label>Bus Type
                <select value={form.busType} onChange={(e) => setForm({ ...form, busType: e.target.value })}>
                  {["AC", "Non AC", "Sleeper", "Semi Sleeper", "Seater", "Luxury", "AC Sleeper", "AC Seater"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </label>
              <label>Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <button className="bus-primary bus-save" type="submit">{editing ? "Update Bus" : "Save Bus"}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function SeatPanel({ selectedDeck, setSelectedDeck, selectedSeat, setSelectedSeat, seatStatus, blockSeat, unblockSeat }) {
  return (
    <div className="bus-panel seat-panel">
      <div className="bus-panel-head"><h2>Seat Management</h2><button>View All</button></div>
      <div className="deck-tabs"><button className={selectedDeck === "lower" ? "active" : ""} onClick={() => setSelectedDeck("lower")}>Lower Deck</button><button className={selectedDeck === "upper" ? "active" : ""} onClick={() => setSelectedDeck("upper")}>Upper Deck</button></div>
      <div className="seat-legend"><span><i />Available</span><span><i className="booked" />Booked</span><span><i className="blocked" />Blocked</span><span><i className="ladies" />Ladies</span><span><i className="reserved" />Reserved</span></div>
      <div className="driver-door"><b>Driver</b><b>Entry Door</b></div>
      <div className="bus-layout">
        {Array.from({ length: 36 }, (_, i) => {
          const seat = i + 1;
          const status = seatStatus[seat] || "available";
          return <button key={seat} className={`seat-btn ${status} ${selectedSeat === seat ? "selected" : ""}`} onClick={() => setSelectedSeat(seat)}>{seat}</button>;
        })}
      </div>
      <div className="seat-controls">
        <button onClick={blockSeat}>Block Seat</button>
        <button className="danger" onClick={unblockSeat}>Unblock Seat</button>
        <button className="outline" onClick={() => selectedSeat ? alert(`Passenger for seat ${selectedSeat}: Demo Passenger`) : alert("Select a seat first")}><Eye size={16}/> View Passenger</button>
        <button className="outline" onClick={() => selectedSeat ? alert(`Booking for seat ${selectedSeat}: THB123456`) : alert("Select a seat first")}><Ticket size={16}/> View Booking</button>
      </div>
    </div>
  );
}

function Bookings() {
  return <div className="bus-table-scroll"><table className="bus-pro-table"><thead><tr>{["Booking ID","Passenger","Seat Number","Bus","Route","Departure","Arrival","Amount","Payment Status","Booking Status"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{demoBookings.map((r) => <tr key={r[0]}>{r.map((c) => <td key={c}>{c}</td>)}</tr>)}</tbody></table></div>;
}

function Revenue() {
  return <div className="revenue-grid">{["Today's Revenue ₹1,24,560","Weekly Revenue ₹8,45,230","Monthly Revenue ₹32,45,680","Platform Commission ₹45,780","Vendor Earnings ₹31,99,900","Top Route Pune → Mumbai","Most Booked Bus Volvo 9600","Occupancy 82%"].map((x) => <article key={x}><p>{x.split(" ").slice(0,-1).join(" ")}</p><h3>{x.split(" ").slice(-1)}</h3></article>)}</div>;
}

function SimpleRows({ heads, rows }) {
  return <div className="bus-table-scroll"><table className="bus-pro-table"><thead><tr>{heads.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>;
}
