import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Armchair, CalendarDays, CircleCheck, CircleX, ClipboardList, Eye, Pencil, Plane, Plus, Ticket, Trash2, Wallet } from "lucide-react";
import { useLocation } from "react-router-dom";
import "./VendorDashboard.css";
import "./FlightModule.css";

const apiBase = "http://localhost:5000/api";
const socketBase = "http://localhost:5000";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });

const emptyFlight = {
  flightName: "",
  airlineName: "",
  airlineLogo: "",
  flightNumber: "",
  aircraftType: "A320",
  cabinClass: "Economy",
  status: "active",
  fromCity: "",
  fromAirport: "",
  fromCode: "",
  toCity: "",
  toAirport: "",
  toCode: "",
  departureDate: "",
  departureTime: "",
  arrivalDate: "",
  arrivalTime: "",
  duration: "",
  stops: "Non-stop",
  baseFare: "",
  taxes: "",
  platformFee: "",
  ticketPrice: "",
  totalSeats: "",
  seatSelectionMode: "CHECK_IN",
  checkInOpenHoursBefore: 24,
  baggageAllowance: "",
  refundPolicy: "",
  cancellationPolicy: "",
};

const columnsByAircraft = {
  A320: [["A", "B", "C"], ["D", "E", "F"]],
  B737: [["A", "B", "C"], ["D", "E", "F"]],
  ATR72: [["A", "B"], ["C", "D"]],
  B777: [["A", "B", "C"], ["D", "E", "F", "G"], ["H", "J", "K"]],
};

function FlightModule({ page = "dashboard", navigate }) {
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [revenue, setRevenue] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const loadFlightData = async () => {
    setLoading(true);
    const [flightsRes, bookingsRes, passengersRes, revenueRes, statsRes] = await Promise.allSettled([
      axios.get(`${apiBase}/vendor/flights`, auth()),
      axios.get(`${apiBase}/vendor/flight-bookings`, auth()),
      axios.get(`${apiBase}/vendor/passengers`, auth()),
      axios.get(`${apiBase}/vendor/flight-revenue`, auth()),
      axios.get(`${apiBase}/vendor/flight-dashboard-stats`, auth()),
    ]);
    if (flightsRes.status === "fulfilled") setFlights(Array.isArray(flightsRes.value.data) ? flightsRes.value.data : []);
    if (bookingsRes.status === "fulfilled") setBookings(Array.isArray(bookingsRes.value.data) ? bookingsRes.value.data : []);
    if (passengersRes.status === "fulfilled") setPassengers(Array.isArray(passengersRes.value.data) ? passengersRes.value.data : []);
    if (revenueRes.status === "fulfilled") setRevenue(revenueRes.value.data || {});
    if (statsRes.status === "fulfilled") setStats(statsRes.value.data || {});
    setLoading(false);
  };

  useEffect(() => {
    loadFlightData();
  }, []);

  useEffect(() => {
    const rawUser = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
    const user = rawUser ? JSON.parse(rawUser) : {};
    const socket = io(socketBase, { auth: { token: getToken() }, transports: ["websocket", "polling"] });
    if (user._id || user.id) socket.emit("joinVendor", user._id || user.id);
    ["newBooking", "vendorDashboardUpdated"].forEach((eventName) => socket.on(eventName, loadFlightData));
    return () => socket.disconnect();
  }, []);

  if (page === "add-flight") return <FlightForm reload={loadFlightData} navigate={navigate} />;
  if (page.startsWith("edit-flight")) return <FlightForm editFlight={flights.find((flight) => page.endsWith(flight._id))} reload={loadFlightData} navigate={navigate} />;
  if (page === "my-flights") return <MyFlights flights={flights} reload={loadFlightData} navigate={navigate} />;
  if (page === "flight-seat-management") return <FlightSeatManagement flights={flights} reload={loadFlightData} />;
  if (page === "flight-bookings") return <FlightBookings bookings={bookings} />;
  if (page === "passengers") return <Passengers passengers={passengers} />;
  if (page === "flight-revenue") return <FlightRevenue revenue={revenue} />;
  if (page === "flight-reports") return <FlightReports flights={flights} bookings={bookings} stats={stats} />;
  return <FlightDashboard stats={stats} flights={flights} bookings={bookings} revenue={revenue} loading={loading} reload={loadFlightData} navigate={navigate} />;
}

const flightNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const bookingStatus = (booking) => String(booking.bookingStatus || booking.status || "confirmed").toLowerCase();

function FlightDashboard({ stats, flights, bookings, revenue, loading, reload, navigate }) {
  const [viewingFlight, setViewingFlight] = useState(null);
  const [today] = useState(() => new Date().toDateString());

  const summary = useMemo(() => {
    const totalFlights = flights.length || flightNumber(stats.totalFlights);
    const activeFlights = flights.filter((flight) => String(flight.status).toLowerCase() === "active").length || flightNumber(stats.activeFlights);
    const totalBookings = bookings.length || flightNumber(stats.totalBookings);
    const todayBookings = bookings.filter((booking) => {
      const date = new Date(booking.bookingDate || booking.createdAt || booking.updatedAt || 0);
      return !Number.isNaN(date.getTime()) && date.toDateString() === today;
    }).length || flightNumber(stats.todayBookings);
    const totalSeats = flights.reduce((sum, flight) => sum + flightNumber(flight.totalSeats), 0);
    const bookedSeats = flights.reduce((sum, flight) => sum + flightNumber(flight.bookedSeats), 0) || flightNumber(stats.bookedSeats);
    const availableSeats = Math.max(totalSeats - bookedSeats, 0) || flightNumber(stats.availableSeats);
    const totalRevenue = bookings.reduce((sum, booking) => sum + flightNumber(booking.amount || booking.totalAmount), 0) || flightNumber(revenue.totalRevenue || stats.totalRevenue);
    const confirmedBookings = bookings.filter((booking) => bookingStatus(booking) === "confirmed").length;
    const cancelledBookings = bookings.filter((booking) => bookingStatus(booking) === "cancelled").length;
    const occupancy = totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : flightNumber(stats.occupancyRate);
    return { totalFlights, activeFlights, totalBookings, todayBookings, totalSeats, bookedSeats, availableSeats, totalRevenue, confirmedBookings, cancelledBookings, occupancy };
  }, [bookings, flights, revenue, stats, today]);

  const chartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => ({ label, value: 0 }));
    bookings.forEach((booking) => {
      const date = new Date(booking.bookingDate || booking.createdAt || booking.updatedAt || 0);
      if (!Number.isNaN(date.getTime())) days[date.getDay()].value += 1;
    });
    return days;
  }, [bookings]);

  const cards = [
    ["Total Flights", summary.totalFlights, Plane],
    ["Active Flights", summary.activeFlights, CircleCheck],
    ["Total Bookings", summary.totalBookings, Ticket],
    ["Today's Bookings", summary.todayBookings, CalendarDays],
    ["Revenue", `Rs ${summary.totalRevenue}`, Wallet],
    ["Available Seats", summary.availableSeats, Armchair],
  ];

  const deleteFlight = async (flight) => {
    if (!window.confirm(`Delete ${flight.flightNumber}?`)) return;
    await axios.delete(`${apiBase}/vendor/flights/${flight._id}`, auth());
    await reload();
  };

  return (
    <>
      {loading && <div className="vendor-alert">Loading flight module...</div>}
      <section className="flight-vendor-hero">
        <div className="flight-vendor-hero-left"><span className="flight-vendor-icon"><Plane size={34} /></span><div><h1>Flight Vendor</h1><p>Manage flights, schedules, seats, bookings, and revenue.</p></div></div>
        <button className="flight-vendor-add-button" type="button" onClick={() => navigate("/vendor/add-flight")}><Plus size={18} />Add Flight</button>
      </section>

      <section className="vendor-card-grid flight-card-grid">
        {cards.map(([label, value, Icon]) => <article className="vendor-kpi-card flight-kpi-card" key={label}><div className="flight-kpi-icon"><Icon size={20} /></div><div><p>{label}</p><h2>{value}</h2><span>Flight module</span></div></article>)}
      </section>

      <section className="flight-dashboard-main-grid">
        <article className="vendor-panel flight-quick-panel"><PanelTitle title="Quick Actions" right="Flight" /><div className="flight-action-grid">
          <button type="button" onClick={() => navigate("/vendor/add-flight")}><Plus size={23} /><span>Add Flight</span></button>
          <button type="button" onClick={() => navigate("/vendor/my-flights")}><Plane size={23} /><span>My Flights</span></button>
          <button type="button" onClick={() => navigate("/vendor/flight-seat-management")}><Armchair size={23} /><span>Manage Seats</span></button>
          <button type="button" onClick={() => navigate("/vendor/flight-bookings")}><ClipboardList size={23} /><span>Bookings</span></button>
        </div></article>
        <article className="vendor-panel flight-live-chart-panel"><PanelTitle title="Live Flight Booking Chart" right="Live" /><FlightBookingChart data={chartData} /></article>
        <article className="vendor-panel flight-status-panel"><PanelTitle title="Booking Status" right={`${summary.occupancy}%`} /><div className="flight-status-summary">
          <div className="flight-occupancy-ring" style={{ "--value": `${summary.occupancy}%` }}><span><strong>{summary.occupancy}%</strong><small>Occupancy</small></span></div>
          <div className="flight-status-list"><p><CircleCheck size={16} /><span>Confirmed</span><strong>{summary.confirmedBookings}</strong></p><p><CircleX size={16} /><span>Cancelled</span><strong>{summary.cancelledBookings}</strong></p><p><Armchair size={16} /><span>Booked Seats</span><strong>{summary.bookedSeats}</strong></p><p><Ticket size={16} /><span>Available</span><strong>{summary.availableSeats}</strong></p></div>
        </div></article>
      </section>

      <section className="vendor-panel vendor-page-panel flight-list-panel">
        <div className="panel-title"><h2>Flight Listings</h2><button type="button" onClick={() => navigate("/vendor/my-flights")}>View All Flights</button></div>
        <div className="vendor-table-shell"><table className="vendor-table flight-list-table"><thead><tr><th>Flight Name</th><th>Flight Number</th><th>From</th><th>To</th><th>Departure Time</th><th>Arrival Time</th><th>Price</th><th>Total Seats</th><th>Booked Seats</th><th>Available Seats</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {flights.length ? flights.map((flight) => {
            const totalSeats = flightNumber(flight.totalSeats);
            const bookedSeats = flightNumber(flight.bookedSeats);
            const availableSeats = Math.max(totalSeats - bookedSeats, 0);
            return <tr key={flight._id}><td><div className="flight-name-cell">{flight.airlineLogo ? <img className="flight-logo" src={flight.airlineLogo} alt="" /> : <span><Plane size={17} /></span>}<div><strong>{flight.flightName || flight.airlineName || "Flight"}</strong><small>{flight.airlineName || "Airline"}</small></div></div></td><td>{flight.flightNumber || "-"}</td><td>{flight.fromCode || flight.fromCity || "-"}</td><td>{flight.toCode || flight.toCity || "-"}</td><td>{flight.departureTime || "-"}</td><td>{flight.arrivalTime || "-"}</td><td>Rs {flightNumber(flight.ticketPrice || flight.price)}</td><td>{totalSeats}</td><td>{bookedSeats}</td><td>{availableSeats}</td><td><span className="vendor-status">{flight.status || "active"}</span></td><td><div className="flight-icon-actions"><button title="View" onClick={() => setViewingFlight(flight)}><Eye size={15} /></button><button title="Edit" onClick={() => navigate(`/vendor/edit-flight/${flight._id}`)}><Pencil size={15} /></button><button title="Delete" onClick={() => deleteFlight(flight)}><Trash2 size={15} /></button><button title="Manage seats" onClick={() => navigate("/vendor/flight-seat-management", { state: { flightId: flight._id } })}><Armchair size={15} /></button><button title="Bookings" onClick={() => navigate("/vendor/flight-bookings")}><ClipboardList size={15} /></button></div></td></tr>;
          }) : <tr><td colSpan="12">No flight listings available yet.</td></tr>}
        </tbody></table></div>
      </section>

      <FlightViewModal flight={viewingFlight} onClose={() => setViewingFlight(null)} />
    </>
  );
}

function FlightBookingChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return <div className="flight-booking-chart">{data.map((item) => <div key={item.label}><strong>{item.value}</strong><span style={{ height: `${Math.max((item.value / maxValue) * 100, 8)}%` }} /><small>{item.label}</small></div>)}</div>;
}

function FlightViewModal({ flight, onClose }) {
  if (!flight) return null;
  return <div className="flight-view-backdrop" onClick={onClose}><article className="flight-view-card" onClick={(event) => event.stopPropagation()}><button className="flight-view-close" onClick={onClose}>Close</button><span className="flight-vendor-icon"><Plane size={28} /></span><h2>{flight.flightName || flight.airlineName}</h2><p>{flight.airlineName} - {flight.flightNumber}</p><div><span><small>Route</small><strong>{flight.fromCode || flight.fromCity} to {flight.toCode || flight.toCity}</strong></span><span><small>Departure</small><strong>{flight.departureDate} {flight.departureTime}</strong></span><span><small>Arrival</small><strong>{flight.arrivalDate} {flight.arrivalTime}</strong></span><span><small>Seat Mode</small><strong>{flight.seatSelectionMode || "CHECK_IN"}</strong></span></div></article></div>;
}

function FlightForm({ editFlight, reload, navigate }) {
  const [form, setForm] = useState(editFlight || emptyFlight);
  useEffect(() => setForm(editFlight || emptyFlight), [editFlight]);

  const update = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      const baseFare = Number(next.baseFare || 0);
      const taxes = Number(next.taxes || 0);
      const platformFee = Number(next.platformFee || 0);
      if (["baseFare", "taxes", "platformFee"].includes(field)) next.ticketPrice = baseFare + taxes + platformFee;
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (editFlight?._id) {
      await axios.put(`${apiBase}/vendor/flights/${editFlight._id}`, form, auth());
    } else {
      await axios.post(`${apiBase}/vendor/flights`, form, auth());
    }
    await reload();
    navigate("/vendor/my-flights");
  };

  const groups = [
    ["Airline Info", ["flightName", "flightNumber", "airlineName", "airlineLogo", "aircraftType", "cabinClass"]],
    ["Route Info", ["fromCity", "fromAirport", "fromCode", "toCity", "toAirport", "toCode"]],
    ["Schedule Info", ["departureDate", "departureTime", "arrivalDate", "arrivalTime", "duration", "stops"]],
    ["Pricing Info", ["baseFare", "taxes", "platformFee", "ticketPrice"]],
    ["Seat Info", ["totalSeats", "seatSelectionMode", "checkInOpenHoursBefore"]],
    ["Rules", ["baggageAllowance", "refundPolicy", "cancellationPolicy", "status"]],
  ];

  return (
    <div className="flight-form-page">
      <section className="flight-vendor-hero flight-form-hero"><div className="flight-vendor-hero-left"><span className="flight-vendor-icon"><Plane size={30} /></span><div><h1>{editFlight ? "Edit Flight" : "Add Flight"}</h1><p>Configure airline, route, schedule, pricing, seats, and check-in rules.</p></div></div></section>
      <section className="vendor-panel vendor-page-panel">
      <PanelTitle title="Flight Information" right={editFlight ? "Edit" : "New"} />
      <form className="flight-form" onSubmit={submit}>
        {groups.map(([title, fields]) => (
          <fieldset key={title}>
            <legend>{title}</legend>
            <div className="vendor-filter-grid">
              {fields.map((field) => <FlightField key={field} field={field} value={form[field]} update={update} />)}
            </div>
          </fieldset>
        ))}
        <button className="flight-primary-btn" type="submit"><Plus size={17} /> {editFlight ? "Update Flight" : "Add Flight"}</button>
      </form>
      </section>
    </div>
  );
}

function FlightField({ field, value, update }) {
  const fieldLabels = {
    flightName: "Flight Name",
    airlineLogo: "Airline Logo URL",
    fromCity: "From",
    toCity: "To",
    fromCode: "From Airport Code",
    toCode: "To Airport Code",
    ticketPrice: "Price",
  };
  const labels = fieldLabels[field] || field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
  const options = {
    aircraftType: ["A320", "B737", "ATR72", "B777"],
    cabinClass: ["Economy", "Business", "First Class"],
    status: ["active", "inactive"],
    stops: ["Non-stop", "1 Stop", "2 Stops"],
    seatSelectionMode: ["DURING_BOOKING", "AFTER_BOOKING", "CHECK_IN", "AUTO_ASSIGN"],
  };
  const numberFields = ["baseFare", "taxes", "platformFee", "ticketPrice", "totalSeats", "availableSeats", "bookedSeats", "blockedSeats", "checkInOpenHoursBefore"];
  const dateFields = ["departureDate", "arrivalDate"];
  const timeFields = ["departureTime", "arrivalTime"];
  if (options[field]) {
    return <label><span>{labels}</span><select value={value || ""} onChange={(event) => update(field, event.target.value)}>{options[field].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
  }
  return <label><span>{labels}</span><input type={dateFields.includes(field) ? "date" : timeFields.includes(field) ? "time" : numberFields.includes(field) ? "number" : "text"} value={value || ""} onChange={(event) => update(field, event.target.value)} /></label>;
}

function MyFlights({ flights, reload, navigate }) {
  const [viewingFlight, setViewingFlight] = useState(null);
  const deleteFlight = async (flight) => {
    if (!window.confirm(`Delete ${flight.flightNumber}?`)) return;
    await axios.delete(`${apiBase}/vendor/flights/${flight._id}`, auth());
    reload();
  };
  return (
    <>
    <DataTable
      title="My Flights"
      columns={["Flight Name", "Flight Number", "From", "To", "Departure Time", "Arrival Time", "Price", "Total Seats", "Booked Seats", "Available Seats", "Status", "Actions"]}
      rows={flights.map((flight) => [
        flight.flightName || flight.airlineName,
        flight.flightNumber,
        flight.fromCode || flight.fromCity,
        flight.toCode || flight.toCity,
        flight.departureTime || "-",
        flight.arrivalTime || "-",
        `Rs ${flight.ticketPrice || 0}`,
        flight.totalSeats || 0,
        flight.bookedSeats || 0,
        Math.max(flightNumber(flight.totalSeats) - flightNumber(flight.bookedSeats), 0),
        <span className="vendor-status">{flight.status}</span>,
        <div className="vendor-row-actions"><button onClick={() => setViewingFlight(flight)}>View</button><button onClick={() => navigate(`/vendor/edit-flight/${flight._id}`)}>Edit</button><button onClick={() => deleteFlight(flight)}>Delete</button><button onClick={() => navigate("/vendor/flight-seat-management", { state: { flightId: flight._id } })}>Manage Seats</button><button onClick={() => navigate("/vendor/flight-bookings")}>Bookings</button></div>,
      ])}
    />
    <FlightViewModal flight={viewingFlight} onClose={() => setViewingFlight(null)} />
    </>
  );
}

function FlightSeatManagement({ flights }) {
  const location = useLocation();
  const requestedFlightId = location.state?.flightId || "";
  const [flightId, setFlightId] = useState(requestedFlightId || flights[0]?._id || "");
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const flight = flights.find((item) => item._id === flightId) || flights[0];
  const groups = columnsByAircraft[flight?.aircraftType || "A320"] || columnsByAircraft.A320;
  const seatsByRow = useMemo(() => {
    return seats.reduce((acc, seat) => {
      const row = String(seat.seatNumber).replace(/^[A-Z]+/, "");
      acc[row] = acc[row] || {};
      acc[row][String(seat.seatNumber).replace(/\d+$/, "")] = seat;
      return acc;
    }, {});
  }, [seats]);
  const rowNumbers = Object.keys(seatsByRow).sort((a, b) => Number(a) - Number(b));

  useEffect(() => {
    if (requestedFlightId && flights.some((item) => item._id === requestedFlightId)) {
      setFlightId(requestedFlightId);
      return;
    }
    if (!flightId && flights[0]?._id) setFlightId(flights[0]._id);
  }, [flightId, flights, requestedFlightId]);

  const loadSeats = useCallback(async (id = flightId) => {
    if (!id) return;
    const res = await axios.get(`${apiBase}/vendor/flights/${id}/seats`, auth());
    setSeats(res.data.seats || []);
    setSelectedSeat(null);
  }, [flightId]);

  useEffect(() => {
    if (flightId) loadSeats(flightId);
  }, [flightId, loadSeats]);

  const seatAction = async (action) => {
    if (!selectedSeat) return;
    await axios.patch(`${apiBase}/vendor/flights/${flightId}/seats/${selectedSeat.seatNumber}/${action}`, {}, auth());
    loadSeats(flightId);
  };

  return (
    <section className="vendor-operations-grid seat-management-page">
      <article className="vendor-panel seat-panel">
        <PanelTitle title="Flight Seat Management" right={flight?.aircraftType || "Aircraft"} />
        <div className="vendor-filter-grid">
          <label><span>Flight</span><select value={flightId} onChange={(event) => setFlightId(event.target.value)}>{flights.map((item) => <option value={item._id} key={item._id}>{item.airlineName} {item.flightNumber}</option>)}</select></label>
          <label><span>Departure Date</span><input value={flight?.departureDate || ""} readOnly /></label>
          <label><span>Cabin Class</span><input value={flight?.cabinClass || ""} readOnly /></label>
        </div>
        <SeatLegend />
        <div className="flight-aircraft-layout">
          {rowNumbers.map((row) => (
            <div className="flight-seat-row" key={row}>
              {groups.map((group, groupIndex) => (
                <div className="flight-seat-group" key={`${row}-${groupIndex}`}>
                  {group.map((letter) => {
                    const seat = seatsByRow[row]?.[letter];
                    return seat ? (
                      <button key={seat.seatNumber} className={`vendor-seat ${seat.status} ${selectedSeat?.seatNumber === seat.seatNumber ? "selected" : ""}`} type="button" onClick={() => setSelectedSeat(seat)}>{seat.seatNumber}</button>
                    ) : <span className="vendor-seat-placeholder" key={`${letter}${row}`} />;
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="flight-layout-note">{groups.map((group) => group.join(" ")).join(" | ")}</p>
      </article>
      <SeatDetails seat={selectedSeat} onBlock={() => seatAction("block")} onUnblock={() => seatAction("unblock")} />
    </section>
  );
}

function SeatDetails({ seat, onBlock, onUnblock }) {
  const rows = [
    ["Seat Number", seat?.seatNumber],
    ["Status", seat?.status],
    ["Passenger Name", seat?.passengerName || seat?.customerName],
    ["PNR Number", seat?.pnr],
    ["Booking ID", seat?.bookingId],
    ["Mobile", seat?.mobile || seat?.customerMobile],
    ["Email", seat?.email || seat?.customerEmail],
    ["Amount", seat?.amount ? `Rs ${seat.amount}` : ""],
    ["Payment Status", seat?.paymentStatus],
    ["Booking Status", seat?.bookingStatus],
    ["Booking Date", seat?.bookingDate ? new Date(seat.bookingDate).toLocaleString() : ""],
  ];
  return (
    <article className="vendor-panel seat-details-panel">
      <PanelTitle title="Seat Details" right="Live" />
      {!seat ? <p>Select a seat to view details.</p> : <div className="seat-detail-list">{rows.map(([label, value]) => <p key={label}><strong>{label}</strong><span>{value || "-"}</span></p>)}<div className="vendor-row-actions"><button disabled={seat.status !== "available"} onClick={onBlock}>Block Seat</button><button disabled={seat.status !== "blocked"} onClick={onUnblock}>Unblock Seat</button><button disabled={seat.status !== "booked"}>View Booking</button></div></div>}
    </article>
  );
}

function FlightBookings({ bookings }) {
  return <DataTable title="Flight Bookings" columns={["Booking ID", "PNR", "Passenger Name", "Flight Number", "Route", "Departure Date", "Departure Time", "Seat Number", "Amount", "Payment Status", "Booking Status", "Booking Date"]} rows={bookings.map((item) => [item.bookingId, item.pnr, item.passengerName, item.flightNumber, item.route, item.departureDate, item.departureTime, item.seatNumber, `Rs ${item.amount || 0}`, item.paymentStatus, item.bookingStatus, item.bookingDate ? new Date(item.bookingDate).toLocaleDateString() : "-"])} />;
}

function Passengers({ passengers }) {
  return <DataTable title="Passengers" columns={["Passenger Name", "Age", "Gender", "Mobile", "Email", "Flight Number", "Seat Number", "PNR", "ID Proof Type", "ID Proof Number"]} rows={passengers.map((item) => [item.passengerName, item.age, item.gender, item.mobile, item.email, item.flightNumber, item.seatNumber, item.pnr, item.idProofType, item.idProofNumber])} />;
}

function FlightRevenue({ revenue }) {
  const cards = [["Total Revenue", revenue.totalRevenue], ["Today Revenue", revenue.todayRevenue], ["Monthly Revenue", revenue.monthlyRevenue], ["TixHub Commission", revenue.tixhubCommission], ["Vendor Earnings", revenue.vendorEarnings], ["Pending Settlement", revenue.pendingSettlement], ["Settled Amount", revenue.settledAmount]];
  return <section className="vendor-card-grid revenue-card-grid">{cards.map(([label, value]) => <article className="vendor-kpi-card" key={label}><div><p>{label}</p><h2>Rs {value || 0}</h2><span>Flight revenue</span></div></article>)}</section>;
}

function FlightReports({ flights, bookings, stats }) {
  return <DataTable title="Flight Reports" columns={["Metric", "Value"]} rows={[["Total Flights", flights.length], ["Total Bookings", bookings.length], ["Occupancy Rate", `${stats.occupancyRate || 0}%`], ["Available Seats", stats.availableSeats || 0], ["Booked Seats", stats.bookedSeats || 0], ["Blocked Seats", stats.blockedSeats || 0]]} />;
}

function DataTable({ title, columns, rows }) {
  return (
    <section className="vendor-panel vendor-page-panel">
      <PanelTitle title={title} right="Live" />
      <div className="vendor-table-shell"><table className="vendor-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell || "-"}</td>)}</tr>) : <tr><td colSpan={columns.length}>No data available yet.</td></tr>}</tbody></table></div>
    </section>
  );
}

function PanelTitle({ title, right = "Flight" }) {
  return <div className="panel-title"><h2>{title}</h2><button type="button">{right}</button></div>;
}

function SeatLegend() {
  return <div className="seat-legend"><span className="available">Available</span><span className="booked">Booked</span><span className="blocked">Blocked</span><span className="selected">Selected</span></div>;
}

export default FlightModule;
