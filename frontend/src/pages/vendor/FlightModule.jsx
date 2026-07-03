import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Armchair,
  BadgeIndianRupee,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  IndianRupee,
  MapPin,
  Plane,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./VendorDashboard.css";
import "./FlightModule.css";

const NOTES_KEY = "tixhub_vendor_flight_notes";
const SEATS_KEY = "tixhub_vendor_flight_seats";
const periodOptions = ["Day", "Week", "Month", "Year"];
const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const defaultFlightImage = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=75";

const dateAt = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const mockFlights = [
  { id: "fl-101", airlineName: "IndiGo", flightNumber: "6E 241", fromAirport: "DEL", toAirport: "BOM", departureDate: dateAt(0), departureTime: "08:15", arrivalTime: "10:25", aircraftType: "A320", flightClass: "Economy", totalSeats: 30, availableSeats: 11, ticketPrice: 6499, status: "On Time", terminal: "T2", hidden: false },
  { id: "fl-102", airlineName: "Air India", flightNumber: "AI 865", fromAirport: "BOM", toAirport: "BLR", departureDate: dateAt(0), departureTime: "12:40", arrivalTime: "14:25", aircraftType: "A320neo", flightClass: "Business + Economy", totalSeats: 30, availableSeats: 8, ticketPrice: 7890, status: "Boarding", terminal: "T1", hidden: false },
  { id: "fl-103", airlineName: "Vistara", flightNumber: "UK 955", fromAirport: "DEL", toAirport: "HYD", departureDate: dateAt(1), departureTime: "17:20", arrivalTime: "19:30", aircraftType: "A321", flightClass: "Business + Economy", totalSeats: 30, availableSeats: 17, ticketPrice: 8250, status: "Scheduled", terminal: "T3", hidden: false },
  { id: "fl-104", airlineName: "Akasa Air", flightNumber: "QP 1384", fromAirport: "BLR", toAirport: "GOI", departureDate: dateAt(3), departureTime: "06:30", arrivalTime: "07:45", aircraftType: "B737 MAX", flightClass: "Economy", totalSeats: 30, availableSeats: 4, ticketPrice: 4999, status: "Delayed", terminal: "T1", hidden: false },
  { id: "fl-105", airlineName: "SpiceJet", flightNumber: "SG 721", fromAirport: "CCU", toAirport: "DEL", departureDate: dateAt(7), departureTime: "21:10", arrivalTime: "23:35", aircraftType: "B737", flightClass: "Economy", totalSeats: 30, availableSeats: 22, ticketPrice: 5799, status: "Cancelled", terminal: "T2", hidden: false },
];

const mockBookings = [
  { id: "BKF-20481", passengerName: "Aarav Sharma", flightNumber: "6E 241", route: "DEL → BOM", seatNumber: "3A", amount: 6499, bookingStatus: "Confirmed", paymentStatus: "Paid", bookedAt: dateAt(0) },
  { id: "BKF-20482", passengerName: "Meera Iyer", flightNumber: "AI 865", route: "BOM → BLR", seatNumber: "2C", amount: 7890, bookingStatus: "Confirmed", paymentStatus: "Paid", bookedAt: dateAt(0) },
  { id: "BKF-20483", passengerName: "Kabir Singh", flightNumber: "UK 955", route: "DEL → HYD", seatNumber: "5F", amount: 8250, bookingStatus: "Pending", paymentStatus: "Awaiting", bookedAt: dateAt(-1) },
  { id: "BKF-20484", passengerName: "Diya Patel", flightNumber: "QP 1384", route: "BLR → GOI", seatNumber: "8A", amount: 4999, bookingStatus: "Cancelled", paymentStatus: "Refunded", bookedAt: dateAt(-2) },
  { id: "BKF-20485", passengerName: "Rohan Das", flightNumber: "6E 241", route: "DEL → BOM", seatNumber: "7D", amount: 6499, bookingStatus: "Confirmed", paymentStatus: "Paid", bookedAt: dateAt(-3) },
];

const mockNotes = [
  { id: "note-1", title: "Morning departure check", description: "Confirm ground crew and gate allocation before 06:30.", flightId: "fl-101", priority: "High", pinned: true },
  { id: "note-2", title: "Catering update", description: "Vegetarian meal count has been shared with the airline team.", flightId: "fl-102", priority: "Medium", pinned: false },
];

const chartSets = {
  Day: ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"],
  Week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  Month: ["W1", "W2", "W3", "W4"],
  Year: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
};

const buildChartData = (period) => chartSets[period].map((label, index) => ({
  label,
  bookings: 12 + ((index * 7 + period.length) % 18),
  revenue: 28 + ((index * 13 + period.length) % 52),
  availableSeats: 46 - ((index * 5) % 20),
  bookedSeats: 18 + ((index * 6) % 26),
  cancelledBookings: 1 + ((index * 2) % 6),
}));

const readStore = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const flightRequest = async (path, options = {}) => {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Unable to load flights");
  return body;
};

const normalizeFlight = (flight) => ({
  ...flight,
  id: flight.id || flight._id,
  ticketPrice: Number(flight.ticketPrice || flight.totalPrice || 0),
  availableSeats: Number(flight.availableSeats || 0),
  totalSeats: Number(flight.totalSeats || 0),
  hidden: flight.status === "inactive",
});

const getFlights = async () => (await flightRequest("/vendor/flights")).map(normalizeFlight);
const getFlightCalendar = async (period, flights) => ({ period, flights });
const getFlightChartData = async (period) => buildChartData(period);
const updateFlight = async (flight) => {
  await flightRequest(`/vendor/flights/${flight.id}`, { method: "PUT", body: JSON.stringify(flight) });
  return getFlights();
};
const deleteFlight = async (flightId) => {
  await flightRequest(`/vendor/flights/${flightId}`, { method: "DELETE" });
  return getFlights();
};
const hideFlight = async (flightId) => {
  const flight = (await getFlights()).find((item) => item.id === flightId);
  return flight ? updateFlight({ ...flight, status: flight.hidden ? "active" : "inactive" }) : getFlights();
};
const addFlightNote = async (note) => {
  const notes = readStore(NOTES_KEY, mockNotes);
  const next = [{ ...note, id: `note-${Date.now()}` }, ...notes];
  writeStore(NOTES_KEY, next);
  return next;
};
const updateFlightNote = async (note) => {
  const next = readStore(NOTES_KEY, mockNotes).map((item) => item.id === note.id ? note : item);
  writeStore(NOTES_KEY, next);
  return next;
};
const deleteFlightNote = async (noteId) => {
  const next = readStore(NOTES_KEY, mockNotes).filter((note) => note.id !== noteId);
  writeStore(NOTES_KEY, next);
  return next;
};
const blockSeat = async (flightId, seatNumber, seats) => {
  const next = seats.map((seat) => seat.number === seatNumber && seat.status === "available" ? { ...seat, status: "blocked" } : seat);
  writeStore(`${SEATS_KEY}_${flightId}`, next);
  return next;
};
const unblockSeat = async (flightId, seatNumber, seats) => {
  const next = seats.map((seat) => seat.number === seatNumber && seat.status === "blocked" ? { ...seat, status: "available" } : seat);
  writeStore(`${SEATS_KEY}_${flightId}`, next);
  return next;
};

function FlightModule({ navigate, section = "flights" }) {
  const [flights, setFlights] = useState([]);
  const [bookings] = useState(mockBookings);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarPeriod, setCalendarPeriod] = useState("Week");
  const [chartPeriod, setChartPeriod] = useState("Week");
  const [chartData, setChartData] = useState([]);
  const [calendarSource, setCalendarSource] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [flightSearch, setFlightSearch] = useState("");
  const [flightStatus, setFlightStatus] = useState("All");
  const [viewingFlight, setViewingFlight] = useState(null);
  const [selectedFlightId, setSelectedFlightId] = useState("");
  const [seats, setSeats] = useState([]);
  const [noteForm, setNoteForm] = useState({ title: "", description: "", flightId: "", priority: "Medium", pinned: false });
  const [editingNoteId, setEditingNoteId] = useState(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [flightRows, chartRows] = await Promise.all([getFlights(), getFlightChartData(chartPeriod)]);
      setFlights(flightRows);
      setSelectedFlightId((current) => current || flightRows[0]?.id || "");
      setNotes(readStore(NOTES_KEY, mockNotes));
      setChartData(chartRows);
    } catch {
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, [chartPeriod]);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => { getFlightCalendar(calendarPeriod, flights).then((result) => setCalendarSource(result.flights)); }, [calendarPeriod, flights]);
  useEffect(() => {
    if (loading) return;
    const sectionIds = {
      "my-flights": "manage-flights",
      "flight-seat-management": "flight-seat-management",
      "flight-bookings": "flight-bookings",
      passengers: "flight-bookings",
      "flight-revenue": "flight-revenue",
      "flight-calendar": "flight-calendar",
      "flight-notes": "flight-notes",
      "flight-reports": "flight-performance",
    };
    const target = document.getElementById(sectionIds[section]);
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [loading, section]);

  useEffect(() => {
    if (!selectedFlightId) return;
    const stored = readStore(`${SEATS_KEY}_${selectedFlightId}`, []);
    if (stored.length) {
      setSeats(stored);
      return;
    }
    const generated = Array.from({ length: 30 }, (_, index) => {
      const row = Math.floor(index / 6) + 1;
      const letter = ["A", "B", "C", "D", "E", "F"][index % 6];
      const status = index % 9 === 0 ? "blocked" : index % 4 === 0 ? "booked" : "available";
      return { number: `${row}${letter}`, status, cabin: row <= 2 ? "business" : "economy" };
    });
    setSeats(generated);
  }, [selectedFlightId]);

  const summary = useMemo(() => {
    const today = dateAt(0);
    const totalSeats = flights.reduce((sum, flight) => sum + Number(flight.totalSeats || 0), 0);
    const availableSeats = flights.reduce((sum, flight) => sum + Number(flight.availableSeats || 0), 0);
    const totalRevenue = bookings.filter((booking) => booking.paymentStatus === "Paid").reduce((sum, booking) => sum + booking.amount, 0);
    return {
      totalFlights: flights.length,
      activeFlights: flights.filter((flight) => !["Cancelled", "Inactive"].includes(flight.status)).length,
      todayFlights: flights.filter((flight) => flight.departureDate === today).length,
      totalBookings: bookings.length,
      totalRevenue,
      availableSeats,
      bookedSeats: Math.max(totalSeats - availableSeats, 0),
      cancelledBookings: bookings.filter((booking) => booking.bookingStatus === "Cancelled").length,
    };
  }, [bookings, flights]);

  const overviewCards = [
    { label: "Total Flights", value: summary.totalFlights, description: "All scheduled inventory", icon: Plane, tone: "green" },
    { label: "Active Flights", value: summary.activeFlights, description: "Live and bookable", icon: CheckCircle2, tone: "emerald" },
    { label: "Today's Flights", value: summary.todayFlights, description: "Departing today", icon: CalendarDays, tone: "blue" },
    { label: "Total Bookings", value: summary.totalBookings, description: "Across all flights", icon: Ticket, tone: "violet" },
    { label: "Total Revenue", value: money(summary.totalRevenue), description: "Paid booking value", icon: IndianRupee, tone: "amber" },
    { label: "Available Seats", value: summary.availableSeats, description: "Ready to book", icon: Armchair, tone: "teal" },
    { label: "Booked Seats", value: summary.bookedSeats, description: "Confirmed inventory", icon: Users, tone: "indigo" },
    { label: "Cancelled", value: summary.cancelledBookings, description: "Bookings cancelled", icon: Ban, tone: "red" },
  ];

  const filteredFlights = useMemo(() => flights.filter((flight) => {
    const query = flightSearch.trim().toLowerCase();
    const matchesSearch = !query || `${flight.airlineName} ${flight.flightNumber} ${flight.fromAirport} ${flight.toAirport}`.toLowerCase().includes(query);
    return matchesSearch && (flightStatus === "All" || flight.status === flightStatus);
  }), [flightSearch, flightStatus, flights]);

  const calendarFlights = useMemo(() => {
    const focus = new Date(calendarDate);
    return calendarSource.filter((flight) => {
      const date = new Date(`${flight.departureDate}T00:00:00`);
      if (calendarPeriod === "Day") return date.toDateString() === focus.toDateString();
      if (calendarPeriod === "Week") {
        const diff = Math.floor((date - focus) / 86400000);
        return diff >= 0 && diff < 7;
      }
      if (calendarPeriod === "Month") return date.getMonth() === focus.getMonth() && date.getFullYear() === focus.getFullYear();
      return date.getFullYear() === focus.getFullYear();
    });
  }, [calendarDate, calendarPeriod, calendarSource]);

  const moveCalendar = (direction) => {
    const next = new Date(calendarDate);
    const amount = calendarPeriod === "Day" ? 1 : calendarPeriod === "Week" ? 7 : calendarPeriod === "Month" ? 30 : 365;
    next.setDate(next.getDate() + (direction * amount));
    setCalendarDate(next);
  };

  const handleDeleteFlight = async (flight) => {
    if (!window.confirm(`Delete ${flight.flightNumber}? This cannot be undone.`)) return;
    setFlights(await deleteFlight(flight.id));
  };

  const handleHideFlight = async (flight) => setFlights(await hideFlight(flight.id));
  const handleSeat = async (seat) => {
    if (seat.status === "booked") return;
    const next = seat.status === "blocked"
      ? await unblockSeat(selectedFlightId, seat.number, seats)
      : await blockSeat(selectedFlightId, seat.number, seats);
    setSeats(next);
  };

  const submitNote = async (event) => {
    event.preventDefault();
    if (!noteForm.title.trim() || !noteForm.description.trim()) return;
    const next = editingNoteId
      ? await updateFlightNote({ ...noteForm, id: editingNoteId })
      : await addFlightNote(noteForm);
    setNotes(next);
    setNoteForm({ title: "", description: "", flightId: "", priority: "Medium", pinned: false });
    setEditingNoteId(null);
  };

  const startNoteEdit = (note) => {
    setEditingNoteId(note.id);
    setNoteForm({ title: note.title, description: note.description, flightId: note.flightId || "", priority: note.priority, pinned: note.pinned });
  };

  return (
    <div className="flight-module-page">
      <header className="flight-module-hero">
        <div className="flight-module-heading">
          <span className="flight-module-hero-icon"><Plane size={32} /></span>
          <div><span className="flight-eyebrow">Flight operations center</span><h1>Flight Vendor Module</h1><p>Run schedules, seats, bookings, revenue, and team notes from one live workspace.</p></div>
        </div>
        <div className="flight-hero-actions">
          <button className="flight-outline-button" type="button" onClick={loadWorkspace}><RefreshCw size={17} /> Refresh</button>
          <button className="flight-primary-button" type="button" onClick={() => navigate("/vendor/add-flight")}><Plus size={18} /> Add Flight</button>
        </div>
      </header>

      {loading && <div className="flight-loading"><RefreshCw size={17} /> Loading flight workspace...</div>}

      <section className="flight-overview-grid" aria-label="Flight dashboard overview">
        {overviewCards.map(({ label, value, description, icon: Icon, tone }) => (
          <article className="flight-overview-card" key={label}>
            <span className={`flight-card-icon ${tone}`}><Icon size={20} /></span>
            <div><p>{label}</p><h2>{value}</h2><small>{description}</small></div>
          </article>
        ))}
      </section>

      <SectionCard id="flight-calendar" icon={CalendarDays} title="Live Flight Calendar" description="Review scheduled departures by your preferred time range." action={<PeriodFilter value={calendarPeriod} onChange={setCalendarPeriod} />}>
        <div className="flight-calendar-toolbar">
          <div className="flight-calendar-navigation"><button onClick={() => moveCalendar(-1)} aria-label="Previous period"><ChevronLeft size={18} /></button><strong>{calendarLabel(calendarDate, calendarPeriod)}</strong><button onClick={() => moveCalendar(1)} aria-label="Next period"><ChevronRight size={18} /></button></div>
          <button className="flight-text-button" type="button" onClick={() => setCalendarDate(new Date())}>Today</button>
        </div>
        {calendarFlights.length ? <div className="flight-calendar-grid">{calendarFlights.map((flight) => <article className="flight-calendar-card" key={flight.id}><div className="flight-calendar-date"><strong>{new Date(`${flight.departureDate}T00:00:00`).getDate()}</strong><span>{new Date(`${flight.departureDate}T00:00:00`).toLocaleDateString("en-IN", { month: "short" })}</span></div><div className="flight-calendar-main"><div><strong>{flight.flightNumber}</strong><StatusBadge value={flight.status} /></div><h3>{flight.airlineName}</h3><p><MapPin size={14} /> {flight.fromAirport} <span>→</span> {flight.toAirport}</p><footer><span><Clock3 size={14} /> {flight.departureTime}</span><span><Armchair size={14} /> {flight.availableSeats} seats left</span></footer></div></article>)}</div> : <EmptyState icon={CalendarDays} title="No flights in this period" text="Try another calendar range or add a new flight schedule." />}
      </SectionCard>

      <SectionCard id="flight-performance" icon={TrendingUp} title="Live Flight Performance" description="Compare demand, seat inventory, cancellations, and revenue trends." action={<PeriodFilter value={chartPeriod} onChange={setChartPeriod} />}>
        <div className="flight-chart-wrap">
          <ResponsiveContainer width="100%" height={330}>
            <LineChart data={chartData} margin={{ top: 12, right: 18, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e5efe9" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#718179", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#718179", fontSize: 12 }} />
              <Tooltip contentStyle={{ border: "1px solid #dcebe2", borderRadius: 12, boxShadow: "0 12px 28px rgba(26, 67, 43, .12)" }} />
              <Legend iconType="circle" />
              <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#159957" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue (x1000)" stroke="#d79b24" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="availableSeats" name="Available seats" stroke="#3287d8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bookedSeats" name="Booked seats" stroke="#7758c8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cancelledBookings" name="Cancelled" stroke="#d15b63" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard id="manage-flights" icon={Plane} title="Manage Flights" description="Search, review, update, hide, or remove flight inventory." action={<button className="flight-primary-button compact" type="button" onClick={() => navigate("/vendor/add-flight")}><Plus size={16} /> New Flight</button>}>
        <div className="flight-table-filters"><label className="flight-search"><Search size={17} /><input value={flightSearch} onChange={(event) => setFlightSearch(event.target.value)} placeholder="Search airline, number, or route" /></label><select value={flightStatus} onChange={(event) => setFlightStatus(event.target.value)}><option>All</option>{[...new Set(flights.map((flight) => flight.status))].map((status) => <option key={status}>{status}</option>)}</select></div>
        <TableShell columns={["Airline", "Banner Preview", "Flight number", "Route", "Date", "Time", "Seats", "Price", "Seat Selection Mode", "Status", "Actions"]} emptyText="No flights match the current filters.">
          {filteredFlights.map((flight) => <tr className={flight.hidden ? "is-hidden" : ""} key={flight.id}><td><div className="flight-airline-cell"><span><img src={flight.flightThumbnail || flight.airlineLogo || defaultFlightImage} alt="Flight thumbnail" width="34" height="34" /></span><div><strong>{flight.airlineName}</strong><small>{flight.aircraftType}</small></div></div></td><td><img src={flight.flightBanner || defaultFlightImage} alt="Flight banner" width="110" height="52" /></td><td><strong>{flight.flightNumber}</strong></td><td>{flight.fromAirport} → {flight.toAirport}</td><td>{formatDate(flight.departureDate)}</td><td>{flight.departureTime}</td><td><strong>{flight.availableSeats}</strong> / {flight.totalSeats}</td><td>{money(flight.ticketPrice)}</td><td><StatusBadge value={flight.seatSelectionMode || "CHECK_IN"} /></td><td><StatusBadge value={flight.hidden ? "Hidden" : flight.status} /></td><td><div className="flight-row-actions"><IconButton title="View flight" onClick={() => setViewingFlight(flight)} icon={Eye} /><IconButton title="Edit, replace, or delete images" onClick={() => navigate(`/vendor/edit-flight/${flight.id}`, { state: { flight } })} icon={Edit3} /><IconButton title={flight.hidden ? "Show flight" : "Hide flight"} onClick={() => handleHideFlight(flight)} icon={flight.hidden ? Eye : EyeOff} /><IconButton danger title="Delete flight" onClick={() => handleDeleteFlight(flight)} icon={Trash2} /></div></td></tr>)}
        </TableShell>
      </SectionCard>

      <SectionCard id="flight-seat-management" icon={Armchair} title="Flight Seat Management" description="Select an available or blocked seat to change its availability.">
        <div className="flight-seat-toolbar"><label><span>Flight</span><select value={selectedFlightId} onChange={(event) => setSelectedFlightId(event.target.value)}>{flights.map((flight) => <option key={flight.id} value={flight.id}>{flight.flightNumber} · {flight.fromAirport} → {flight.toAirport}</option>)}</select></label><div className="flight-seat-legend"><span className="available">Available</span><span className="booked">Booked</span><span className="blocked">Blocked</span><span className="business">Business</span><span className="economy">Economy</span></div></div>
        {flights.length ? <div className="flight-aircraft"><div className="flight-cockpit"><Plane size={24} /><span>Front</span></div><div className="flight-seat-map">{[1, 2, 3, 4, 5].map((row) => <div className="flight-seat-map-row" key={row}><span>{row}</span>{["A", "B", "C", "D", "E", "F"].map((letter, index) => { const seat = seats.find((item) => item.number === `${row}${letter}`); return <button type="button" key={letter} title={`${seat?.number} · ${seat?.cabin} · ${seat?.status}`} className={`flight-seat ${seat?.status || "available"} ${seat?.cabin || "economy"} ${index === 3 ? "aisle" : ""}`} onClick={() => seat && handleSeat(seat)} disabled={seat?.status === "booked"}>{seat?.number}</button>; })}</div>)}</div><p className="flight-seat-help"><ShieldCheck size={16} /> Booked seats are protected. Click available seats to block them, or blocked seats to release them.</p></div> : <EmptyState icon={Armchair} title="No aircraft selected" text="Add a flight to create its seat inventory." />}
      </SectionCard>

      <SectionCard id="flight-bookings" icon={Ticket} title="Flight Bookings" description="Track passenger, seat, payment, and booking information.">
        <TableShell columns={["Passenger name", "Flight number", "Route", "Seat number", "Amount", "Booking status", "Payment status"]} emptyText="Bookings will appear here after the first reservation.">{bookings.map((booking) => <tr key={booking.id}><td><div className="flight-passenger"><span>{booking.passengerName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><strong>{booking.passengerName}</strong><small>{booking.id}</small></div></div></td><td><strong>{booking.flightNumber}</strong></td><td>{booking.route}</td><td><span className="flight-seat-number">{booking.seatNumber}</span></td><td>{money(booking.amount)}</td><td><StatusBadge value={booking.bookingStatus} /></td><td><StatusBadge value={booking.paymentStatus} /></td></tr>)}</TableShell>
      </SectionCard>

      <SectionCard id="flight-revenue" icon={CircleDollarSign} title="Flight Revenue" description="A clear settlement snapshot for your finance team.">
        <div className="flight-revenue-grid">{[
          ["Today revenue", 48320, "from 8 paid bookings", IndianRupee],
          ["Weekly revenue", 286450, "+12.6% vs last week", TrendingUp],
          ["Monthly revenue", 1128400, "current billing cycle", BadgeIndianRupee],
          ["Yearly revenue", 9876500, "gross booking value", CircleDollarSign],
          ["Pending settlement", 148600, "estimated in 2 business days", Clock3],
        ].map(([label, value, detail, Icon]) => <article key={label}><span><Icon size={20} /></span><p>{label}</p><h3>{money(value)}</h3><small>{detail}</small></article>)}</div>
      </SectionCard>

      <SectionCard id="flight-notes" icon={FileText} title="Flight Notes" description="Keep private operational reminders linked to individual flights.">
        <div className="flight-notes-layout">
          <form className="flight-note-form" onSubmit={submitNote}><div className="flight-note-form-heading"><span><Sparkles size={18} /></span><div><h3>{editingNoteId ? "Edit internal note" : "Add internal note"}</h3><p>Only vendor team members can see these notes.</p></div></div><label><span>Note title</span><input value={noteForm.title} onChange={(event) => setNoteForm({ ...noteForm, title: event.target.value })} placeholder="e.g. Gate assignment" required /></label><label><span>Note description</span><textarea value={noteForm.description} onChange={(event) => setNoteForm({ ...noteForm, description: event.target.value })} placeholder="Add the operational details your team needs..." required /></label><div className="flight-note-form-row"><label><span>Linked flight</span><select value={noteForm.flightId} onChange={(event) => setNoteForm({ ...noteForm, flightId: event.target.value })}><option value="">General note</option>{flights.map((flight) => <option key={flight.id} value={flight.id}>{flight.flightNumber}</option>)}</select></label><label><span>Priority</span><select value={noteForm.priority} onChange={(event) => setNoteForm({ ...noteForm, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label></div><label className="flight-pin-control"><input type="checkbox" checked={noteForm.pinned} onChange={(event) => setNoteForm({ ...noteForm, pinned: event.target.checked })} /><span>Pin this note to the top</span></label><div className="flight-note-form-actions">{editingNoteId && <button className="flight-outline-button" type="button" onClick={() => { setEditingNoteId(null); setNoteForm({ title: "", description: "", flightId: "", priority: "Medium", pinned: false }); }}><X size={16} /> Cancel</button>}<button className="flight-primary-button" type="submit"><Save size={16} /> {editingNoteId ? "Update Note" : "Save Note"}</button></div></form>
          <div className="flight-note-list">{notes.length ? [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned)).map((note) => { const linked = flights.find((flight) => flight.id === note.flightId); return <article className={`flight-note-card priority-${note.priority.toLowerCase()}`} key={note.id}><header><div><span className="flight-priority-badge">{note.priority}</span>{note.pinned && <span className="flight-pinned-badge">Pinned</span>}</div><div className="flight-note-actions"><IconButton title="Edit note" onClick={() => startNoteEdit(note)} icon={Edit3} /><IconButton danger title="Delete note" onClick={async () => setNotes(await deleteFlightNote(note.id))} icon={Trash2} /></div></header><h3>{note.title}</h3><p>{note.description}</p><footer><Plane size={14} /> {linked ? `${linked.flightNumber} · ${linked.fromAirport} → ${linked.toAirport}` : "General operations"}</footer></article>; }) : <EmptyState icon={FileText} title="No internal notes yet" text="Create a note to keep the operations team aligned." />}</div>
        </div>
      </SectionCard>

      {viewingFlight && <FlightModal flight={viewingFlight} onClose={() => setViewingFlight(null)} onEdit={() => navigate(`/vendor/edit-flight/${viewingFlight.id}`, { state: { flight: viewingFlight } })} />}
    </div>
  );
}

function SectionCard({ id, icon: Icon, title, description, action, children }) {
  return <section id={id} className="flight-section-card"><header className="flight-section-header"><div className="flight-section-title"><span><Icon size={20} /></span><div><h2>{title}</h2><p>{description}</p></div></div>{action && <div className="flight-section-action">{action}</div>}</header><div className="flight-section-body">{children}</div></section>;
}

function PeriodFilter({ value, onChange }) {
  return <div className="flight-period-filter" role="group" aria-label="Select reporting period">{periodOptions.map((period) => <button className={period === value ? "active" : ""} type="button" key={period} onClick={() => onChange(period)}>{period}</button>)}</div>;
}

function TableShell({ columns, children, emptyText }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <div className="flight-table-shell"><table className="flight-data-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{hasRows ? children : <tr><td colSpan={columns.length}><div className="flight-table-empty">{emptyText}</div></td></tr>}</tbody></table></div>;
}

function StatusBadge({ value }) {
  const tone = String(value || "").toLowerCase().replace(/\s+/g, "-");
  return <span className={`flight-status-badge ${tone}`}>{value || "Unknown"}</span>;
}

function IconButton({ title, onClick, icon: Icon, danger = false }) {
  return <button className={`flight-icon-button${danger ? " danger" : ""}`} type="button" title={title} aria-label={title} onClick={onClick}><Icon size={15} /></button>;
}

function EmptyState({ icon: Icon, title, text }) {
  return <div className="flight-empty-state"><span><Icon size={24} /></span><h3>{title}</h3><p>{text}</p></div>;
}

function FlightModal({ flight, onClose, onEdit }) {
  return <div className="flight-modal-backdrop" role="presentation" onMouseDown={onClose}><article className="flight-modal" role="dialog" aria-modal="true" aria-labelledby="flight-modal-title" onMouseDown={(event) => event.stopPropagation()}><button className="flight-modal-close" type="button" onClick={onClose} aria-label="Close"><X size={20} /></button><img src={flight.flightBanner || defaultFlightImage} alt="Flight banner preview" width="100%" height="180" /><div className="flight-modal-plane">{flight.airlineLogo ? <img src={flight.airlineLogo} alt="Airline logo" width="40" height="40" /> : <Plane size={28} />}</div><span className="flight-eyebrow">Flight details</span><h2 id="flight-modal-title">{flight.airlineName} · {flight.flightNumber}</h2><p className="flight-modal-route">{flight.fromAirport} <span>→</span> {flight.toAirport}</p><div className="flight-modal-grid">{[["Departure", `${formatDate(flight.departureDate)} · ${flight.departureTime}`], ["Aircraft", flight.aircraftType], ["Terminal", flight.terminal || "Not assigned"], ["Seat inventory", `${flight.availableSeats} available of ${flight.totalSeats}`], ["Ticket price", money(flight.ticketPrice)], ["Seat Selection Mode", flight.seatSelectionMode || "CHECK_IN"], ["Status", flight.status]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>{flight.flightGallery?.length > 0 && <div>{flight.flightGallery.map((image) => <img key={image} src={image} alt="Cabin interior" width="120" height="78" />)}</div>}<div className="flight-modal-actions"><button className="flight-outline-button" type="button" onClick={onClose}>Close</button><button className="flight-primary-button" type="button" onClick={onEdit}><Edit3 size={16} /> Edit Images / Flight</button></div></article></div>;
}

const formatDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const calendarLabel = (date, period) => period === "Day" ? date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : period === "Year" ? String(date.getFullYear()) : date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export default FlightModule;
