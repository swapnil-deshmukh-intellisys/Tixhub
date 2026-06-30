import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import jsQR from "jsqr";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  CreditCard,
  Film,
  Globe2,
  Headphones,
  Hotel,
  LayoutDashboard,
  LogOut,
  Plane,
  Bus,
  QrCode,
  ShieldCheck,
  Search,
  Settings,
  Ticket,
  Train,
  UserCheck,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import FlightModule from "./FlightModule";
import BusVendorDashboard from "./BusVendorDashboard";
import VendorServiceModule from "./VendorServiceModule";
import "./VendorDashboard.css";


const apiBase = "http://localhost:5000/api";
const socketBase = "http://localhost:5000";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } });

const getStoredUser = () => {
  const raw = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
  return raw ? JSON.parse(raw) : {};
};

const getMovieShowId = (movie) => String(movie?.showId || movie?._id || "");

const normalizeVendorService = (value) => {
  const service = String(value || "").toLowerCase();
  if (["movie", "movies"].includes(service)) return "movies";
  if (["flight", "flights"].includes(service)) return "flights";
  if (["hotel", "hotels"].includes(service)) return "hotels";
  if (["bus", "buses"].includes(service)) return "buses";
  if (["train", "trains"].includes(service)) return "trains";
  if (["event", "events"].includes(service)) return "events";
  return service;
};

const sidebarItems = [
  ["Dashboard", LayoutDashboard, "/vendor-dashboard"],
  ["Bookings", Ticket, "/vendor/bookings"],
  ["Customers", Users, "/vendor/customers"],
  ["Revenue", BarChart3, "/vendor/revenue"],
  ["Settlements", CreditCard, "/vendor/settlements"],
  ["Payment Details", BriefcaseBusiness, "/vendor/payment-details"],
  ["Profile", Settings, "/vendor/profile"],
  ["Support", Headphones, "/vendor/support"],
];

const serviceMeta = {
  movies: { label: "Movies", icon: Film, route: "/vendor/movies", module: "movie" },
  flights: { label: "Flights", icon: Plane, route: "/vendor/flights", module: "flight" },
  buses: { label: "Buses", icon: Bus, route: "/vendor/buses", module: "bus" },
  trains: { label: "Trains", icon: Train, route: "/vendor/trains", module: "train" },
  hotels: { label: "Hotels", icon: Hotel, route: "/vendor/hotels", module: "hotel" },
  events: { label: "Events", icon: CalendarDays, route: "/vendor/events", module: "event" },
};

const serviceModules = ["movies", "flights", "buses", "trains", "hotels", "events"];
const commonServices = ["all", ...serviceModules];
const weeklySales = [42, 42, 34, 33, 22, 22, 33, 41, 38, 49, 44, 47, 39, 22, 25, 21, 24, 23, 31, 24, 18, 21];
const revenueBars = [46, 36, 72, 58, 44, 50, 45];
const trendRanges = ["day", "week", "month", "year", "all"];
const fallbackTrendData = {
  day: [
    { label: "8 AM", bookings: 3, revenue: 1800 }, { label: "10 AM", bookings: 7, revenue: 4200 },
    { label: "12 PM", bookings: 11, revenue: 7100 }, { label: "2 PM", bookings: 8, revenue: 5400 },
    { label: "4 PM", bookings: 14, revenue: 9200 }, { label: "6 PM", bookings: 18, revenue: 12800 },
  ],
  week: [
    { label: "Mon", bookings: 28, revenue: 18800 }, { label: "Tue", bookings: 35, revenue: 24100 },
    { label: "Wed", bookings: 31, revenue: 21900 }, { label: "Thu", bookings: 46, revenue: 32200 },
    { label: "Fri", bookings: 52, revenue: 37100 }, { label: "Sat", bookings: 68, revenue: 49600 },
    { label: "Sun", bookings: 61, revenue: 44300 },
  ],
  month: [
    { label: "Week 1", bookings: 142, revenue: 98600 }, { label: "Week 2", bookings: 176, revenue: 124300 },
    { label: "Week 3", bookings: 163, revenue: 115800 }, { label: "Week 4", bookings: 211, revenue: 149900 },
  ],
  year: [
    { label: "Jan", bookings: 420, revenue: 294000 }, { label: "Feb", bookings: 465, revenue: 328000 },
    { label: "Mar", bookings: 510, revenue: 361000 }, { label: "Apr", bookings: 488, revenue: 346000 },
    { label: "May", bookings: 575, revenue: 407000 }, { label: "Jun", bookings: 622, revenue: 441000 },
    { label: "Jul", bookings: 680, revenue: 482000 }, { label: "Aug", bookings: 645, revenue: 459000 },
    { label: "Sep", bookings: 710, revenue: 503000 }, { label: "Oct", bookings: 748, revenue: 532000 },
    { label: "Nov", bookings: 795, revenue: 568000 }, { label: "Dec", bookings: 860, revenue: 615000 },
  ],
  all: [
    { label: "2022", bookings: 2850, revenue: 1980000 }, { label: "2023", bookings: 4360, revenue: 3040000 },
    { label: "2024", bookings: 5870, revenue: 4150000 }, { label: "2025", bookings: 7240, revenue: 5160000 },
    { label: "2026", bookings: 6810, revenue: 4860000 },
  ],
};
const fallbackMovies = [];
const fallbackStats = {
  totalListings: 0,
  totalBookings: 0,
  todayBookings: 0,
  revenue: 0,
  pendingSettlements: 0,
  availableSeats: 0,
  bookedSeats: 0,
  blockedSeats: 0,
  totalCustomers: 0,
  cancelledBookings: 0,
  pendingConfirmations: 0,
  upcomingSchedules: 0,
  todayRevenue: 0,
  monthlyRevenue: 0,
  tixhubCommission: 0,
  vendorEarnings: 0,
  settledAmount: 0,
};

const fetchDashboardStats = async () => {
  try {
    return await axios.get(`${apiBase}/vendor/dashboard/stats`, auth());
  } catch {
    return axios.get(`${apiBase}/vendor/dashboard-stats`, auth());
  }
};

const normalizeTrendData = (payload, range) => {
  const source = Array.isArray(payload)
    ? payload
    : payload?.trends || payload?.data || payload?.results || [];
  if (!Array.isArray(source) || !source.length) return fallbackTrendData[range];
  return source.map((item, index) => ({
    label: item.label || item.dateLabel || item.month || item.date || item.period || `Point ${index + 1}`,
    bookings: Number(item.bookings ?? item.bookingCount ?? item.count ?? 0),
    revenue: Number(item.revenue ?? item.totalRevenue ?? item.amount ?? 0),
  }));
};

function VendorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [profile, setProfile] = useState(user);
  const activeRoute = location.pathname === "/vendor-dashboard" || location.pathname === "/vendor" ? "dashboard" : location.pathname.replace("/vendor/", "");
  const [stats, setStats] = useState(fallbackStats);
  const [movies, setMovies] = useState(fallbackMovies);
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState({});
  const [ticketScans, setTicketScans] = useState([]);
  const [theatreOverview, setTheatreOverview] = useState({ theatres: [], screens: [], shows: [] });
  const [showAnalytics, setShowAnalytics] = useState([]);
  const [pricing, setPricing] = useState({});
  const [refunds, setRefunds] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trendRange, setTrendRange] = useState("week");
  const [trendData, setTrendData] = useState(fallbackTrendData.week);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState("");

  const enabledServices = useMemo(() => {
    const configured = profile.enabledServices || profile.vendorServices || profile.services || user.enabledServices || user.vendorServices || user.services;
    if (Array.isArray(configured) && configured.length) {
      return configured.map(normalizeVendorService).filter((item) => serviceModules.includes(item));
    }
    if (String(profile.service || profile.module || profile.serviceType || user.service || user.module || user.serviceType || "").toLowerCase()) {
      const service = normalizeVendorService(profile.service || profile.module || profile.serviceType || user.service || user.module || user.serviceType);
      return serviceModules.includes(service) ? [service] : ["movies"];
    }
    return serviceModules;
  }, [flights.length, profile, user]);

  const vendorName = profile.name || profile.businessName || profile.companyName || user.name || "Vendor";
  const vendorInitials = vendorName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "TV";

  const activeService = activeRoute === "dashboard"
    ? "all"
    : serviceModules.includes(activeRoute)
    ? activeRoute
    : activeRoute.startsWith("flight") || ["add-flight", "my-flights"].includes(activeRoute)
      ? "flights"
      : "movies";

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    const [profileRes, statsRes, moviesRes, flightsRes, bookingsRes, customersRes, availabilityRes, settlementsRes, paymentRes] = await Promise.allSettled([
      axios.get(`${apiBase}/vendor/profile`, auth()),
      fetchDashboardStats(),
      axios.get(`${apiBase}/vendor/movies`, auth()),
      axios.get(`${apiBase}/vendor/flights`, auth()),
      axios.get(`${apiBase}/vendor/bookings`, auth()),
      axios.get(`${apiBase}/vendor/customers`, auth()),
      axios.get(`${apiBase}/vendor/availability`, auth()),
      axios.get(`${apiBase}/vendor/settlements`, auth()),
      axios.get(`${apiBase}/vendor/payment-details`, auth()),
    ]);

    if (profileRes.status === "fulfilled") setProfile(profileRes.value.data?.user || profileRes.value.data || user);
    if (statsRes.status === "fulfilled") {
      const statsPayload = statsRes.value.data?.stats || statsRes.value.data?.data || statsRes.value.data || {};
      setStats({ ...fallbackStats, ...statsPayload });
    }
    if (moviesRes.status === "fulfilled") setMovies(Array.isArray(moviesRes.value.data) ? moviesRes.value.data : fallbackMovies);
    if (flightsRes.status === "fulfilled") setFlights(Array.isArray(flightsRes.value.data) ? flightsRes.value.data : []);
    if (bookingsRes.status === "fulfilled") setBookings(Array.isArray(bookingsRes.value.data) ? bookingsRes.value.data : []);
    if (customersRes.status === "fulfilled") setCustomers(Array.isArray(customersRes.value.data) ? customersRes.value.data : []);
    if (availabilityRes.status === "fulfilled") setAvailability(Array.isArray(availabilityRes.value.data) ? availabilityRes.value.data : []);
    if (settlementsRes.status === "fulfilled") setSettlements(Array.isArray(settlementsRes.value.data) ? settlementsRes.value.data : []);
    if (paymentRes.status === "fulfilled") setPaymentDetails(paymentRes.value.data || {});

    if ([statsRes, moviesRes, flightsRes, bookingsRes, customersRes, availabilityRes, settlementsRes, paymentRes].some((item) => item.status === "rejected")) {
      setError("Live vendor data is unavailable. Showing safe fallback data where needed.");
    }

    const [scansRes, theatreRes, analyticsRes, pricingRes, refundsRes, payoutsRes, staffRes, notificationsRes, customerListRes] = await Promise.allSettled([
      axios.get(`${apiBase}/vendor/ticket-scans`, auth()),
      axios.get(`${apiBase}/vendor/theatre-overview`, auth()),
      axios.get(`${apiBase}/vendor/show-analytics`, auth()),
      axios.get(`${apiBase}/vendor/pricing`, auth()),
      axios.get(`${apiBase}/vendor/refunds`, auth()),
      axios.get(`${apiBase}/vendor/payouts`, auth()),
      axios.get(`${apiBase}/vendor/staff`, auth()),
      axios.get(`${apiBase}/vendor/notifications`, auth()),
      axios.get(`${apiBase}/vendor/customer-list`, auth()),
    ]);

    if (scansRes.status === "fulfilled") setTicketScans(Array.isArray(scansRes.value.data) ? scansRes.value.data : []);
    if (theatreRes.status === "fulfilled") setTheatreOverview(theatreRes.value.data || { theatres: [], screens: [], shows: [] });
    if (analyticsRes.status === "fulfilled") setShowAnalytics(Array.isArray(analyticsRes.value.data) ? analyticsRes.value.data : []);
    if (pricingRes.status === "fulfilled") setPricing(pricingRes.value.data || {});
    if (refundsRes.status === "fulfilled") setRefunds(Array.isArray(refundsRes.value.data) ? refundsRes.value.data : []);
    if (payoutsRes.status === "fulfilled") setPayouts(Array.isArray(payoutsRes.value.data) ? payoutsRes.value.data : []);
    if (staffRes.status === "fulfilled") setStaff(Array.isArray(staffRes.value.data) ? staffRes.value.data : []);
    if (notificationsRes.status === "fulfilled") setNotifications(Array.isArray(notificationsRes.value.data) ? notificationsRes.value.data : []);
    if (customerListRes.status === "fulfilled") setCustomerList(Array.isArray(customerListRes.value.data) ? customerListRes.value.data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    let active = true;
    const loadTrends = async () => {
      setTrendLoading(true);
      setTrendError("");
      try {
        const response = await axios.get(`${apiBase}/vendor/bookings/trends`, {
          ...auth(),
          params: { range: trendRange },
        });
        if (active) setTrendData(normalizeTrendData(response.data, trendRange));
      } catch {
        if (active) {
          setTrendData(fallbackTrendData[trendRange]);
          setTrendError("Live trend data is unavailable. Showing demo data.");
        }
      } finally {
        if (active) setTrendLoading(false);
      }
    };
    loadTrends();
    return () => { active = false; };
  }, [trendRange]);

  useEffect(() => {
    const vendorId = user._id || user.id;
    const socket = io(socketBase, {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
    });
    if (vendorId) socket.emit("joinVendor", vendorId);
    ["newBooking", "ticketCheckedIn", "refundUpdated", "payoutUpdated", "staffUpdated", "vendorNotification", "movieStatusUpdated", "vendorDashboardUpdated"].forEach((eventName) => {
      socket.on(eventName, loadDashboard);
    });
    return () => socket.disconnect();
  }, []);

  const topListings = useMemo(() => [
    ...movies.map((movie) => ({
      id: movie._id || movie.title,
      title: movie.title || "Untitled Movie",
      meta: `Movies - ${movie.theatre || movie.genre || "Listing"}`,
      price: movie.ticketPrice || movie.price || 250,
      image: movie.image || movie.posterUrl || movie.bannerUrl || "",
    })),
    ...flights.map((flight) => ({
      id: flight._id || flight.flightNumber,
      title: flight.airlineName || flight.flightNumber || "Flight",
      meta: `Flights - ${flight.fromCode || flight.fromCity || ""} ${flight.toCode ? `to ${flight.toCode}` : ""}`,
      price: flight.ticketPrice || flight.baseFare || 0,
      image: flight.airlineLogo || "",
    })),
  ].slice(0, 4).map((listing, index) => ({
    ...listing,
    value: [42, 28, 18, 12][index] || 10,
  })), [movies, flights]);

  const topMovies = useMemo(() => movies.slice(0, 4).map((movie, index) => ({
    id: movie._id || movie.title,
    title: movie.title || "Untitled Movie",
    meta: movie.genre || movie.language || "Movie",
    value: [42, 28, 18, 12][index] || 10,
    price: movie.ticketPrice || movie.price || 250,
    image: movie.image || movie.posterUrl || movie.bannerUrl || "",
  })), [movies]);

  const cardData = [
    ["Total Bookings", stats.totalBookings || bookings.length || 0, Ticket],
    ["Today's Bookings", stats.todayBookings || 0, CalendarDays],
    ["Total Revenue", `Rs ${stats.revenue || 0}`, BarChart3],
    ["Active Listings", stats.activeListings || movies.length + flights.length, BriefcaseBusiness],
    ["Upcoming Schedules", stats.upcomingSchedules || theatreOverview.shows?.length || 0, CalendarDays],
    ["Total Customers", stats.totalCustomers || customers.length || 0, Users],
    ["Cancelled Bookings", stats.cancelledBookings || bookings.filter((booking) => normalizeStatus(booking) === "cancelled").length, ShieldCheck],
    ["Pending Confirmations", stats.pendingConfirmations || bookings.filter((booking) => normalizeStatus(booking) === "pending").length, Bell],
  ];

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const renderPage = () => {
    if (activeRoute === "movies") return <MovieDashboard stats={stats} movies={movies} bookings={bookings} navigate={navigate} />;
    if (activeRoute === "my-movies") return <MoviesPage movies={movies} reload={loadDashboard} navigate={navigate} />;
    if (activeRoute === "seat-management") return <SeatManagementPage movies={movies} />;
    if (activeRoute === "qr-scanner") return <QrScannerPage scans={ticketScans} reload={loadDashboard} />;
    if (activeRoute === "theatres" || activeRoute === "shows") return <TheatreScreenPage overview={theatreOverview} reload={loadDashboard} movies={movies} />;
    if (activeRoute === "analytics") return <ShowAnalyticsPage rows={showAnalytics} />;
    if (activeRoute === "pricing") return <PricingPage pricing={pricing} shows={theatreOverview.shows || []} reload={loadDashboard} />;
    if (activeRoute === "refunds") return <RefundsPage refunds={refunds} reload={loadDashboard} />;
    if (activeRoute === "payouts") return <PayoutHistoryPage payouts={payouts} />;
    if (activeRoute === "staff") return <StaffPage staff={staff} reload={loadDashboard} />;
    if (activeRoute === "notification-center") return <NotificationCenterPage notifications={notifications} reload={loadDashboard} />;
    if (activeRoute === "movie-status") return <MovieStatusPage movies={movies} reload={loadDashboard} />;
    if (["flights", "add-flight", "my-flights", "flight-seat-management", "flight-bookings", "passengers", "flight-revenue", "flight-reports"].includes(activeRoute) || activeRoute.startsWith("edit-flight")) return <FlightModule page={activeRoute === "flights" ? "dashboard" : activeRoute} navigate={navigate} />;
    const serviceListMatch = activeRoute.match(/^(buses|trains|events|hotels)(?:\/([^/]+))?$/);
    if (serviceListMatch) return <VendorServiceModule service={serviceListMatch[1]} mode={serviceListMatch[2] ? "details" : "list"} id={serviceListMatch[2]} navigate={navigate} />;
    const serviceFormMatch = activeRoute.match(/^(add|edit)-(bus|train|event|hotel)(?:\/([^/]+))?$/);
    if (serviceFormMatch) {
      const service = { bus: "buses", train: "trains", event: "events", hotel: "hotels" }[serviceFormMatch[2]];
      return <VendorServiceModule service={service} mode={serviceFormMatch[1]} id={serviceFormMatch[3]} navigate={navigate} />;
    }
    if (["bus", "buses"].includes(activeRoute)) return <BusVendorDashboard />;
    if (["hotels", "events", "trains", "travel"].includes(activeRoute)) return <FutureService service={activeRoute} />;
    if (activeRoute === "bookings") return <BookingsPage bookings={bookings} />;
    if (activeRoute === "customers") return <CustomersPage customers={customers} customerList={customerList} />;
    if (activeRoute === "revenue" || activeRoute === "transactions") return <RevenuePage stats={stats} />;
    if (activeRoute === "settlements") return <SettlementsPage settlements={settlements} stats={stats} />;
    if (activeRoute === "payment-details" || activeRoute === "settings") return <PaymentDetailsPage details={paymentDetails} reload={loadDashboard} />;
    if (activeRoute === "profile") return <ProfilePage user={user} />;
    if (activeRoute === "support") return <SupportPage />;
    if (activeRoute === "reports") return <ShowAnalyticsPage rows={showAnalytics} />;
    if (activeRoute === "blocked-seats") return <AvailabilityPage rows={availability.filter((row) => Number(row.blockedSeats || row.blocked || 0) > 0)} movies={movies} />;
    if (activeRoute === "availability") return <AvailabilityPage rows={availability} movies={movies} />;
    return <DashboardHome cardData={cardData} stats={stats} bookings={bookings} customers={customers} scans={ticketScans} refunds={refunds} notifications={notifications} listings={[...movies, ...flights]} schedules={theatreOverview.shows || []} topListings={topListings} navigate={navigate} vendorName={vendorName} vendorRole={profile.vendorCategory || profile.category || profile.role || "Vendor"} enabledServices={enabledServices} trendRange={trendRange} setTrendRange={setTrendRange} trendData={trendData} trendLoading={trendLoading} trendError={trendError} />;
  };

  return (
    <div className="vendor-shell">
      <aside className="vendor-sidebar">
        <div className="vendor-brand">
          <span className="vendor-logo-mark"><Clapperboard size={24} /></span>
          <strong>TixHub Vendor</strong>
        </div>

        <nav className="vendor-sidebar-nav">
          {sidebarItems.map(([label, Icon, path]) => (
            <button
              key={label}
              className={(label === "Dashboard" && activeRoute === "dashboard") || path.endsWith(activeRoute) ? "active" : ""}
              type="button"
              onClick={() => navigate(path)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <button className="vendor-logout" type="button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="vendor-dashboard">
        <header className="vendor-header">
          <label className="vendor-search">
            <Search size={18} />
            <input type="search" placeholder="Search" />
          </label>

          <div className="vendor-header-actions">
            <button className="vendor-language" type="button"><Globe2 size={18} />English<ChevronDown size={16} /></button>
            <button className="vendor-icon-btn" type="button" aria-label="Notifications"><Bell size={19} /><span /></button>
            <button className="vendor-profile" type="button">
              <span className="vendor-avatar">{vendorInitials}</span>
              <span><strong>{vendorName}</strong><small>{profile.role || "Vendor"}</small></span>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <ServiceSwitcher enabledServices={enabledServices} activeService={activeService} navigate={navigate} />
        {loading && <div className="vendor-alert">Loading vendor data...</div>}
        {error && <div className="vendor-alert warning">{error}</div>}
        {renderPage()}
      </main>
    </div>
  );
}

function ServiceSwitcher({ enabledServices, activeService, navigate }) {
  return (
    <div className="service-switcher">
      {enabledServices.map((service) => {
        const Icon = serviceMeta[service]?.icon || BriefcaseBusiness;
        return (
          <button key={service} type="button" className={activeService === service ? "active" : ""} onClick={() => navigate(serviceMeta[service].route)}>
            <Icon size={17} />
            {serviceMeta[service].label}
          </button>
        );
      })}
    </div>
  );
}

function DashboardHome({ cardData, stats, bookings, customers, scans, refunds, notifications, listings, schedules, topListings, navigate, vendorName, vendorRole, enabledServices, trendRange, setTrendRange, trendData, trendLoading, trendError }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const bookingStatusRows = [
    ["Confirmed", stats.confirmedBookings ?? bookings.filter((booking) => normalizeStatus(booking) === "confirmed").length, "confirmed"],
    ["Pending", stats.pendingBookings ?? stats.pendingConfirmations ?? bookings.filter((booking) => normalizeStatus(booking) === "pending").length, "pending"],
    ["Cancelled", stats.cancelledBookings ?? bookings.filter((booking) => normalizeStatus(booking) === "cancelled").length, "cancelled"],
    ["Completed", stats.completedBookings ?? bookings.filter((booking) => normalizeStatus(booking) === "completed").length, "completed"],
  ];
  const scanRows = [
    ["Total Scans Today", scans.length],
    ["Successful Scans", scans.filter((scan) => ["valid", "checked_in", "success"].includes(String(scan.status || scan.scan_status).toLowerCase())).length],
    ["Failed Scans", scans.filter((scan) => ["invalid", "failed", "already_used"].includes(String(scan.status || scan.scan_status).toLowerCase())).length],
  ];

  return (
    <>
      <section className="vendor-welcome">
        <div className="vendor-welcome-copy">
          <h1>Welcome, {vendorName}</h1>
          <p>Manage your listings, bookings and revenue from one place.</p>
        </div>
        <div className="vendor-welcome-details">
          <span><small>Vendor</small><strong>{vendorName}</strong></span>
          <span><small>Role / Category</small><strong>{vendorRole}</strong></span>
          <span><small>Today</small><strong>{currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</strong></span>
          <span><small>Current time</small><strong>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong></span>
        </div>
      </section>

      <section className="vendor-service-card-grid">
        {serviceModules.map((service) => (
          <ServiceCard key={service} service={service} stats={stats} bookings={bookings} listings={listings} navigate={navigate} enabled={enabledServices.includes(service)} />
        ))}
      </section>

      <section className="vendor-card-grid">
        {cardData.map(([label, value, Icon]) => (
          <article className="vendor-kpi-card" key={label}>
            <div><p>{label}</p><h2>{value}</h2><span>Updated live</span></div>
            <div className="flight-kpi-icon"><Icon size={22} /></div>
          </article>
        ))}
      </section>

      <section className="booking-status-section" aria-label="Booking status overview">
        <div className="booking-status-heading"><div><h2>Booking Status</h2><p>Current booking distribution</p></div><span>Live</span></div>
        <div className="booking-status-grid">
          {bookingStatusRows.map(([label, value, status]) => (
            <article className={`booking-status-card ${status}`} key={label}>
              <span className="booking-status-dot" />
              <div><small>{label}</small><strong>{value || 0}</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className="vendor-analytics-grid">
        <BookingTrendChart data={trendData} range={trendRange} setRange={setTrendRange} loading={trendLoading} error={trendError} />
        <article className="vendor-panel revenue-panel"><PanelTitle title="Revenue Trends Chart" right="2026" /><h3>Rs {stats.revenue || 0}</h3><BarChart values={revenueBars} /></article>
        <article className="vendor-panel"><PanelTitle title="Category Wise Sales" right="All" /><CategorySales stats={stats} bookings={bookings} /></article>
        <article className="vendor-panel"><PanelTitle title="Monthly Performance Overview" right={`${occupancy(stats)}%`} /><PerformanceOverview stats={stats} /></article>
      </section>

      <section className="vendor-operations-grid">
        <BookingsTable title="Recent Bookings" bookings={bookings.slice(0, 6)} compact />
        <article className="vendor-panel"><PanelTitle title="Recent Customer Activity" right="Live" /><InfoList rows={(customers.length ? customers.slice(0, 5).map((customer) => `${customer.customerName || customer.name || "Customer"} - ${customer.totalBookings || 1} booking${Number(customer.totalBookings || 1) === 1 ? "" : "s"}`) : ["Customer activity will appear after the first booking."])} /></article>
      </section>

      <section className="vendor-operations-grid">
        <article className="vendor-panel"><PanelTitle title="Recent QR Scans" right="Gate" /><InfoList rows={(scans.length ? scans.slice(0, 5).map((scan) => `${scan.bookingCode || scan.booking_id || scan.bookingId || "Ticket"} - ${scan.status || scan.scan_status || "scanned"}`) : ["No QR scans today."])} /></article>
        <article className="vendor-panel"><PanelTitle title="Recent Refund Requests" right="Refunds" /><InfoList rows={(refunds.length ? refunds.slice(0, 5).map((refund) => `${refund.bookingCode || refund.bookingId || "Booking"} - Rs ${refund.amount || 0} - ${refund.refundStatus || refund.status || "pending"}`) : ["No refund requests waiting."])} /></article>
      </section>

      <section className="vendor-panel vendor-page-panel management-overview-panel">
        <PanelTitle title="Booking Overview" right="SaaS" />
        <div className="management-grid">
          <OverviewBlock title="Booking Status Distribution" rows={bookingStatusRows} />
          <OverviewBlock title="Customer Statistics" rows={[["Total Customers", stats.totalCustomers || customers.length || 0], ["Repeat Customers", customers.filter((customer) => Number(customer.totalBookings || 0) > 1).length], ["New Today", stats.todayCustomers || 0]]} />
        </div>
      </section>

      <section className="vendor-operations-grid">
        <article className="vendor-panel quick-actions-panel"><PanelTitle title="Quick Actions" right="Tools" /><VendorQuickActions navigate={navigate} /></article>
        <article className="vendor-panel"><PanelTitle title="Notification Center" right="Live" /><NotificationSummary notifications={notifications} bookings={bookings} refunds={refunds} schedules={schedules} /></article>
      </section>

      <section className="vendor-operations-grid">
        <article className="vendor-panel"><PanelTitle title="QR Scanner Module" right="Today" /><OverviewBlock rows={scanRows} /><button className="vendor-primary-action" type="button" onClick={() => navigate("/vendor/qr-scanner")}>Scan QR Code</button></article>
        <article className="vendor-panel movie-list-panel"><PanelTitle title="Top Selling Listings" right="All" /><MovieList movies={topListings} showValue /></article>
      </section>
    </>
  );
}

function BookingTrendChart({ data, range, setRange, loading, error }) {
  const currency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
  return (
    <article className="vendor-panel booking-trend-panel">
      <div className="booking-trend-header">
        <div><h2>Booking Trend</h2><p>Bookings and revenue performance</p></div>
        <div className="trend-filters" aria-label="Booking trend range">
          {trendRanges.map((item) => <button className={range === item ? "active" : ""} type="button" onClick={() => setRange(item)} key={item}>{item[0].toUpperCase() + item.slice(1)}</button>)}
        </div>
      </div>
      {loading && <div className="trend-state">Loading booking trends...</div>}
      {error && !loading && <div className="trend-state warning">{error}</div>}
      <div className="booking-trend-chart" aria-label={`${range} booking and revenue trend chart`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e7f1eb" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7f9187", fontSize: 11, fontWeight: 700 }} />
            <YAxis yAxisId="bookings" axisLine={false} tickLine={false} width={38} tick={{ fill: "#7f9187", fontSize: 11 }} />
            <YAxis yAxisId="revenue" orientation="right" axisLine={false} tickLine={false} width={55} tickFormatter={(value) => value >= 100000 ? `${Math.round(value / 100000)}L` : value >= 1000 ? `${Math.round(value / 1000)}K` : value} tick={{ fill: "#7f9187", fontSize: 11 }} />
            <Tooltip formatter={(value, name) => [name === "Revenue" ? currency(value) : Number(value).toLocaleString("en-IN"), name]} contentStyle={{ border: "1px solid #dfeee6", borderRadius: 12, boxShadow: "0 10px 28px rgba(33,86,54,.1)" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
            <Bar yAxisId="bookings" dataKey="bookings" name="Bookings" fill="#a9e3c2" radius={[6, 6, 0, 0]} maxBarSize={30} />
            <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="#249d5f" strokeWidth={3} dot={{ r: 3, fill: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function ServiceCard({ service, stats, bookings, listings, navigate, enabled }) {
  const meta = serviceMeta[service];
  const Icon = meta.icon || BriefcaseBusiness;
  const aliases = service === "buses" ? ["buses", "bus"] : service === "events" ? ["events", "event"] : [service, meta.module];
  const categoryStats = aliases.reduce((result, key) => result || stats.categories?.[key] || stats.services?.[key] || stats[key], null) || {};
  const moduleListings = listings.filter((listing) => aliases.includes(normalizeVendorService(listing.module || listing.service || listing.category))).length;
  const moduleBookings = bookings.filter((booking) => aliases.includes(normalizeVendorService(booking.module || booking.service || booking.category || booking.details?.module))).length;
  const totalKey = { movies: "totalMovies", flights: "totalFlights", buses: "totalBuses", trains: "totalTrains", hotels: "totalHotels", events: "totalEvents" }[service];
  const totalListings = Number(categoryStats.totalListings ?? categoryStats.listings ?? stats[totalKey] ?? stats.moduleCounts?.[meta.module] ?? moduleListings ?? 0);
  const totalBookings = Number(categoryStats.totalBookings ?? categoryStats.bookings ?? stats.moduleBookings?.[meta.module] ?? moduleBookings ?? 0);
  const revenue = Number(categoryStats.revenue ?? categoryStats.totalRevenue ?? stats.moduleRevenue?.[meta.module] ?? 0);
  const active = categoryStats.active ?? (categoryStats.status ? categoryStats.status === "active" : enabled);
  return (
    <button className={`vendor-service-card ${service}`} type="button" onClick={() => navigate(meta.route)} aria-label={`View ${meta.label} dashboard`}>
      <span className="vendor-service-card-head"><span className="vendor-service-icon"><Icon size={22} /></span><span className={`service-status ${active ? "active" : "inactive"}`}><i />{active ? "Active" : "Inactive"}</span></span>
      <strong className="vendor-service-title">{meta.label}</strong>
      <span className="vendor-service-metrics">
        <span><small>Listings</small><b>{totalListings}</b></span>
        <span><small>Bookings</small><b>{totalBookings}</b></span>
        <span><small>Revenue</small><b>Rs {revenue.toLocaleString("en-IN")}</b></span>
      </span>
      <span className="vendor-service-link">View dashboard <span aria-hidden="true">→</span></span>
    </button>
  );
}

function MovieDashboard({ stats, movies, bookings, navigate }) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const movieBookings = bookings.filter((booking) => {
    const moduleName = String(booking.module || booking.service || booking.details?.module || "").toLowerCase();
    return !moduleName || moduleName.includes("movie");
  });
  const bookingChartData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, value: 0 }));

  movieBookings.forEach((booking) => {
    const bookingDate = booking.createdAt || booking.bookingDate || booking.date || booking.updatedAt;
    const date = bookingDate ? new Date(bookingDate) : null;
    const dayIndex = !date || Number.isNaN(date.getTime()) ? 0 : (date.getDay() + 6) % 7;
    bookingChartData[dayIndex].value += 1;
  });

  const movieRevenue = movies.reduce((sum, movie) => sum + Number(movie.revenue || 0), 0) || stats.revenue || 0;
  const confirmed = movieBookings.filter((booking) => normalizeStatus(booking) === "confirmed").length;
  const pending = movieBookings.filter((booking) => normalizeStatus(booking) === "pending").length;
  const cancelled = movieBookings.filter((booking) => normalizeStatus(booking) === "cancelled").length;
  const cards = [
    ["Total Movies", movies.length],
    ["Total Bookings", stats.totalBookings || movieBookings.length || 0],
    ["Revenue", `Rs ${movieRevenue}`],
    ["Blocked Seats", stats.blockedSeats || 0],
    ["Available Seats", stats.availableSeats || 0],
    ["Booked Seats", stats.bookedSeats || 0],
  ];
  return (
    <>
      <section className="vendor-section-heading movie-management-heading">
        <div>
          <h1>Movie Management Dashboard</h1>
          <p>Movie-specific listings, schedules, seats, QR scans, pricing, refunds, staff, and status controls.</p>
        </div>
        <button className="vendor-primary-action movie-add-right-button" type="button" onClick={() => navigate("/vendor/add-movie")}>Add Movie</button>
      </section>
      <section className="booking-status-grid">
        <MiniCount label="Confirmed" value={confirmed} />
        <MiniCount label="Pending" value={pending} />
        <MiniCount label="Cancelled" value={cancelled} />
      </section>
      <section className="vendor-card-grid">{cards.map(([label, value]) => <article className="vendor-kpi-card" key={label}><div><p>{label}</p><h2>{value}</h2><span>Movie module</span></div></article>)}</section>
      <section className="movie-management-chart-grid">
        <article className="vendor-panel quick-actions-panel"><PanelTitle title="Movie Quick Actions" /><MovieQuickActions navigate={navigate} /></article>
        <article className="vendor-panel movie-booking-chart-panel"><PanelTitle title="Booking Chart" right="This Week" /><WeeklyMovieBookingChart data={bookingChartData} /></article>
      </section>
      <section className="movie-management-list-grid">
        <article className="vendor-panel movie-list-panel"><PanelTitle title="My Movies" /><MovieList movies={movies.slice(0, 5).map((movie, index) => ({ id: movie._id || index, title: movie.title, meta: `${movie.genre || "Movie"} - ${movie.language || ""}`, image: movie.image }))} /></article>
      </section>
      <section className="vendor-panel vendor-page-panel movie-card-panel">
        <PanelTitle title="Movie Cards" right="Open" />
        <div className="vendor-movie-card-grid">
          {movies.map((movie) => (
            <button className={`vendor-movie-card ${selectedMovie?._id === movie._id ? "active" : ""}`} key={movie._id || movie.title} type="button" onClick={() => setSelectedMovie(movie)}>
              {movie.image || movie.posterUrl || movie.bannerUrl ? <img src={movie.image || movie.posterUrl || movie.bannerUrl} alt={movie.title} /> : <span className="vendor-movie-card-placeholder"><Film size={28} /></span>}
              <strong>{movie.title || "Movie Name"}</strong>
            </button>
          ))}
        </div>
        {selectedMovie && (
          <div className="movie-card-details">
            <InfoGroup title={selectedMovie.title} rows={[["Language", selectedMovie.language], ["Theatre", selectedMovie.theatre || selectedMovie.theatreName], ["Screen", selectedMovie.screenName || selectedMovie.screenNumber], ["Show", selectedMovie.showTime || selectedMovie.showTimes?.[0]], ["Total Seats", selectedMovie.totalSeats], ["Regular", selectedMovie.regularSeats], ["Prime", selectedMovie.primeSeats], ["VIP", selectedMovie.vipSeats], ["Status", selectedMovie.status]]} />
          </div>
        )}
      </section>
      <section className="vendor-panel vendor-page-panel movie-production-panel">
        <PanelTitle title="Movie Production Modules" right="Movie" />
        <MovieProductionModules navigate={navigate} />
      </section>
    </>
  );
}

function DashboardMovieQuickActions({ navigate }) {
  return <div className="quick-action-grid"><button onClick={() => navigate("/vendor/add-movie")}>Add Movie</button><button onClick={() => navigate("/vendor/my-movies")}>My Movies</button><button onClick={() => navigate("/vendor/movies")}>Manage Shows</button><button onClick={() => navigate("/vendor/seat-management")}>Seat Management</button></div>;
}

function VendorQuickActions({ navigate }) {
  return <div className="quick-action-grid"><button onClick={() => navigate("/vendor/movies")}>Add New Listing</button><button onClick={() => navigate("/vendor/theatres")}>Manage Schedules</button><button onClick={() => navigate("/vendor/seat-management")}>Manage Seats</button><button onClick={() => navigate("/vendor/qr-scanner")}>Scan QR Code</button><button onClick={() => navigate("/vendor/bookings")}>View Bookings</button><button onClick={() => navigate("/vendor/customers")}>Manage Customers</button></div>;
}

function MovieQuickActions({ navigate }) {
  return <div className="quick-action-grid"><button onClick={() => navigate("/vendor/add-movie")}>Add Movie</button><button onClick={() => navigate("/vendor/my-movies")}>My Movies</button><button onClick={() => navigate("/vendor/theatres")}>Manage Shows</button><button onClick={() => navigate("/vendor/seat-management")}>Seat Management</button></div>;
}

function MovieProductionModules({ navigate }) {
  const modules = [
    ["QR Ticket Scanner", "/vendor/qr-scanner"],
    ["Theatre & Screen Management", "/vendor/theatres"],
    ["Show Analytics", "/vendor/analytics"],
    ["Pricing Management", "/vendor/pricing"],
    ["Refund & Cancellation", "/vendor/refunds"],
    ["Payout History", "/vendor/payouts"],
    ["Staff Management", "/vendor/staff"],
    ["Notification Center", "/vendor/notification-center"],
    ["Customer List", "/vendor/customers"],
    ["Movie Status Control", "/vendor/movie-status"],
  ];

  return <div className="movie-module-grid">{modules.map(([label, path]) => <button key={label} type="button" onClick={() => navigate(path)}><QrCode size={18} /><span>{label}</span></button>)}</div>;
}

function MoviesPage({ movies, reload, navigate }) {
  const deleteMovie = async (movie) => {
    if (!window.confirm(`Delete ${movie.title}?`)) return;
    try {
      await axios.delete(`${apiBase}/vendor/movies/${movie._id}`, auth());
      alert("Movie deleted");
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete movie");
    }
  };

  const hideMovie = async (movie) => {
    try {
      await axios.patch(`${apiBase}/vendor/movies/${movie._id}/status`, { status: "hidden" }, auth());
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to hide movie");
    }
  };

  return (
    <section className="vendor-panel vendor-page-panel">
      <PanelTitle title="My Movies" right="Vendor" />
      <div className="vendor-table-shell">
        <table className="vendor-table">
          <thead><tr><th>Poster</th><th>Movie Name</th><th>Genre</th><th>Language</th><th>Theatre</th><th>Bookings</th><th>Revenue</th><th>Status</th><th>Actions</th></tr></thead>
<tbody>
  {movies.map((movie) => (
    <tr key={movie._id || movie.title}>
      <td>
        {movie.image ? (
          <img
            className="table-poster"
            src={movie.image}
            alt={movie.title}
          />
        ) : (
          <span className="movie-thumb">
            <Film size={18} />
          </span>
        )}
      </td>

      <td>{movie.title}</td>

      <td>{movie.genre || "-"}</td>

      <td>{movie.language || "-"}</td>

      <td>{movie.theatre || movie.theatreName || "-"}</td>

      <td>{movie.bookedSeats?.length || 0}</td>

      <td>Rs {movie.revenue || 0}</td>

      <td>
        <span className="vendor-status">
          {movie.status || "active"}
        </span>
      </td>

      <td>
        <div className="vendor-row-actions">
          <button type="button">
            View
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/vendor/add-movie", {
                state: { editMovieId: movie._id, movie },
              })
            }
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => hideMovie(movie)}
          >
            Hide
          </button>

          <button
            type="button"
            onClick={() => deleteMovie(movie)}
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/vendor/seat-management", {
                state: {
                  movieId: movie._id,
                },
              })
            }
          >
            Manage Seats
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>        </table>
      </div>
    </section>
  );
}

function SeatManagementPage({ movies }) {
  const location = useLocation();
  const [movieId, setMovieId] = useState(location.state?.movieId || movies[0]?._id || "");
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [blockedSeatType, setBlockedSeatType] = useState("regular");
  const selectedMovie = movies.find((movie) => movie._id === movieId) || movies[0];
  const showId = getMovieShowId(selectedMovie);
  const seatContext = {
    showId,
    movieId,
    theatre: selectedMovie?.theatre || selectedMovie?.theatreName || "",
    screenId: selectedMovie?.screenNumber || "Screen 1",
    showDate: selectedMovie?.showDate || selectedMovie?.releaseDate || "",
    showTime: selectedMovie?.showTime || selectedMovie?.showTimes?.[0] || "",
    totalSeats: selectedMovie?.totalSeats || 187,
    regularSeats: selectedMovie?.regularSeats || 0,
    primeSeats: selectedMovie?.primeSeats || 0,
    vipSeats: selectedMovie?.vipSeats || 0,
    blockedSeats: selectedMovie?.blockedSeats || 0,
    price: selectedMovie?.ticketPrice || 240,
    regularSeatPrice: selectedMovie?.regularSeatPrice || selectedMovie?.ticketPrice || 240,
    premiumSeatPrice: selectedMovie?.premiumSeatPrice || selectedMovie?.primeSeatPrice || selectedMovie?.ticketPrice || 240,
    vipSeatPrice: selectedMovie?.vipSeatPrice || selectedMovie?.ticketPrice || 240,
  };

  const loadSeats = async () => {
    if (!showId) return;
    try {
      const res = await axios.get(`${apiBase}/seats/${encodeURIComponent(showId)}`, {
        ...auth(),
        params: seatContext,
      });
      setSeats(res.data.seats || []);
      setSelectedSeat(null);
    } catch (error) {
      setSeats([]);
      alert(error.response?.data?.message || "Unable to load live seat data");
    }
  };

  useEffect(() => {
    if (!movieId && movies[0]?._id) setMovieId(movies[0]._id);
  }, [movies.length, movieId]);

  useEffect(() => {
    if (showId) loadSeats();
  }, [showId]);

  useEffect(() => {
    if (!showId) return undefined;
    const socket = io(socketBase, {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
    });

    socket.emit("joinShow", showId);
    socket.on("seatUpdated", (updatedSeat) => {
      setSeats((current) => current.map((seat) => (
        seat.seatNo === updatedSeat.seatNo || seat.seatNumber === updatedSeat.seatNumber ? { ...seat, ...updatedSeat } : seat
      )));
      setSelectedSeat((current) => (
        current && (current.seatNo === updatedSeat.seatNo || current.seatNumber === updatedSeat.seatNumber) ? { ...current, ...updatedSeat } : current
      ));
    });

    return () => socket.disconnect();
  }, [showId]);

  const runSeatAction = async (action, seat = selectedSeat) => {
    if (!showId || !seat) return;
    try {
      if (action === "block") {
        const blockedReason = window.prompt("Blocked reason", seat.blockedReason || "Blocked by vendor") || "Blocked by vendor";
        await axios.patch(`${apiBase}/seats/block`, { ...seatContext, seatNo: seat.seatNo || seat.seatNumber, blockedReason, blockedSeatType }, auth());
      }
      if (action === "unblock") await axios.patch(`${apiBase}/seats/unblock`, { ...seatContext, seatNo: seat.seatNo || seat.seatNumber }, auth());
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update seat");
    }
  };

  return (
    <section className="vendor-operations-grid seat-management-page">
      <article className="vendor-panel seat-panel">
        <PanelTitle title="Movie Seat Management" right="Movie" />
        <div className="vendor-filter-grid">
          <label><span>Movie</span><select value={movieId} onChange={(event) => setMovieId(event.target.value)}>{movies.map((movie) => <option key={movie._id || movie.title} value={movie._id}>{movie.title}</option>)}</select></label>
          <label><span>Theatre</span><input value={selectedMovie?.theatre || selectedMovie?.theatreName || ""} readOnly /></label>
          <label><span>Screen</span><input value={selectedMovie?.screenNumber || "Screen 1"} readOnly /></label>
          <label><span>Show</span><input value={`${selectedMovie?.showDate || selectedMovie?.releaseDate || ""} ${selectedMovie?.showTime || selectedMovie?.showTimes?.[0] || ""}`} readOnly /></label>
        </div>
        <div className="vendor-filter-grid seat-type-grid">
          <SelectField label="Blocked seat type" value={blockedSeatType} options={["regular", "prime", "vip"]} onChange={setBlockedSeatType} />
        </div>
        <SeatLegend />
        <SeatCategoryGrid seats={seats} selectedSeat={selectedSeat} setSelectedSeat={setSelectedSeat} />
      </article>
      <SeatDetails seat={selectedSeat} blockedSeatType={blockedSeatType} onBlock={() => runSeatAction("block")} onUnblock={() => runSeatAction("unblock")} />
    </section>
  );
}

function SeatCategoryGrid({ seats, selectedSeat, setSelectedSeat }) {
  const sections = ["vip", "prime", "regular"];
  return (
    <div className="vendor-seat-sections">
      {sections.map((section) => {
        const sectionSeats = seats.filter((seat) => String(seat.seatType || seat.type || "").toLowerCase() === section);
        if (!sectionSeats.length) return null;
        return (
          <div className="vendor-seat-section" key={section}>
            <h3>{labelize(section)}</h3>
            <div className="vendor-seat-grid">
              {sectionSeats.map((seat) => {
                const seatKey = seat.seatNo || `${seat.rowName || ""}${seat.seatNumber}`;
                const selectedKey = selectedSeat?.seatNo || `${selectedSeat?.rowName || ""}${selectedSeat?.seatNumber || ""}`;
                return <button className={`vendor-seat ${seat.status} ${selectedKey === seatKey ? "selected" : ""}`} key={seatKey} type="button" onClick={() => setSelectedSeat(seat)}>{seatKey}</button>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SeatDetails({ seat, blockedSeatType, onBlock, onUnblock }) {
  return (
    <article className="vendor-panel seat-details-panel">
      <PanelTitle title="Seat Details" right="Live" />
      {!seat ? <p>Select a seat to view details.</p> : <div className="seat-detail-list">{[["Seat Number", seat.seatNo || seat.seatNumber], ["Category", seat.seatType || seat.type], ["Status", seat.status], ["Block As", blockedSeatType], ["Customer Name", seat.customerName], ["Booking ID", seat.bookingId], ["Mobile", seat.customerMobile || seat.mobile], ["Email", seat.customerEmail || seat.email], ["Amount", seat.amount ? `Rs ${seat.amount}` : ""], ["Payment Status", seat.paymentStatus], ["Booking Status", seat.bookingStatus], ["Blocked By", seat.blockedBy], ["Blocked Type", seat.blockedSeatType], ["Blocked Reason", seat.blockedReason], ["Updated At", seat.updatedAt ? new Date(seat.updatedAt).toLocaleString() : ""]].map(([label, value]) => <p key={label}><strong>{label}</strong><span>{value || "-"}</span></p>)}<div className="vendor-row-actions"><button type="button" onClick={onBlock} disabled={seat.status !== "available"}>Block Seat</button><button type="button" onClick={onUnblock} disabled={seat.status !== "blocked"}>Unblock Seat</button><button type="button" disabled={seat.status !== "booked"}>View Customer</button></div></div>}
    </article>
  );
}

function QrScannerPage({ scans, reload }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const [ticketCode, setTicketCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [cameraState, setCameraState] = useState("");

  const submitScan = async (code = ticketCode) => {
    if (!String(code || "").trim()) return;
    try {
      const res = await axios.post(`${apiBase}/vendor/ticket-scans`, { ticketCode: code }, auth());
      setScanResult(res.data);
      setTicketCode("");
      reload();
    } catch (error) {
      setScanResult(error.response?.data || { status: "invalid", message: "Ticket scan failed" });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraState("Scanning...");
      const detector = "BarcodeDetector" in window ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        let rawValue = "";
        if (detector) {
          const codes = await detector.detect(videoRef.current).catch(() => []);
          rawValue = codes[0]?.rawValue || "";
        } else if (context && videoRef.current.readyState >= 2) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          rawValue = jsQR(imageData.data, imageData.width, imageData.height)?.data || "";
        }
        if (rawValue) {
          stopCamera();
          submitScan(rawValue);
          return;
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (error) {
      setCameraState("Camera permission was blocked or unavailable.");
    }
  };

  const stopCamera = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraState("");
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <section className="vendor-operations-grid scanner-page">
      <article className="vendor-panel">
        <PanelTitle title="QR Ticket Scanner" right="Live" />
        <div className="scanner-box">
          <video ref={videoRef} muted playsInline />
          <div className="scanner-frame"><QrCode size={42} /></div>
        </div>
        <div className="seat-toolbar">
          <button type="button" onClick={startCamera}>Start Camera</button>
          <button type="button" onClick={stopCamera}>Stop</button>
          <input value={ticketCode} onChange={(event) => setTicketCode(event.target.value)} placeholder="Paste QR or booking code" />
          <button type="button" onClick={() => submitScan()}>Check In</button>
        </div>
        {cameraState && <div className="vendor-alert">{cameraState}</div>}
        {scanResult && <div className={`scan-result ${scanResult.status}`}><ShieldCheck size={22} /><strong>{scanResult.status?.replace("_", " ") || "Result"}</strong><span>{scanResult.message}</span></div>}
      </article>
      <DataTable title="Recent Ticket Scans" columns={["Booking", "Customer", "Movie", "Seat", "Status", "Checked In"]} rows={scans.map((scan) => [scan.bookingCode, scan.customerName, scan.movieTitle, scan.seatNumber, scan.status, scan.checkedInAt ? new Date(scan.checkedInAt).toLocaleString() : "-"])} />
    </section>
  );
}

function TheatreScreenPage({ overview, reload, movies }) {
  const theatres = overview.theatres || [];
  const screens = overview.screens || [];
  const shows = overview.shows || [];
  const [theatreForm, setTheatreForm] = useState({ name: "", city: "", address: "", status: "active" });
  const [screenForm, setScreenForm] = useState({ theatreId: "", name: "", rows: 10, seatsPerRow: 12, status: "active" });
  const [showForm, setShowForm] = useState({ theatreId: "", screenId: "", movieId: "", showDate: "", showTime: "", price: 250, status: "active" });

  useEffect(() => {
    setScreenForm((current) => ({ ...current, theatreId: current.theatreId || rowId(theatres[0]) || "" }));
    setShowForm((current) => ({ ...current, theatreId: current.theatreId || rowId(theatres[0]) || "", screenId: current.screenId || rowId(screens[0]) || "", movieId: current.movieId || rowId(movies[0]) || "" }));
  }, [theatres.length, screens.length, movies.length]);

  const submit = async (event, endpoint, body, reset) => {
    event.preventDefault();
    try {
      await axios.post(`${apiBase}/vendor/${endpoint}`, body, auth());
      reset();
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save");
    }
  };

  const layoutPreview = Array.from({ length: Number(screenForm.rows || 0) }).flatMap((_, rowIndex) =>
    Array.from({ length: Number(screenForm.seatsPerRow || 0) }).map((__, seatIndex) => `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`)
  );

  return (
    <>
      <section className="vendor-card-grid">
        <MiniCount label="Theatres" value={theatres.length} />
        <MiniCount label="Screens" value={screens.length} />
        <MiniCount label="Shows" value={shows.length} />
        <MiniCount label="Active Screens" value={screens.filter((screen) => screen.status !== "inactive").length} />
      </section>
      <section className="vendor-dashboard-grid theatre-screen-grid">
        <article className="vendor-panel">
          <PanelTitle title="Theatre Management" right="Theatre" />
          <form className="vendor-settings-form compact-form" onSubmit={(event) => submit(event, "theatres", theatreForm, () => setTheatreForm({ name: "", city: "", address: "", status: "active" }))}>
            <Field label="Theatre name" value={theatreForm.name} onChange={(value) => setTheatreForm({ ...theatreForm, name: value })} />
            <Field label="City" value={theatreForm.city} onChange={(value) => setTheatreForm({ ...theatreForm, city: value })} />
            <Field label="Address" value={theatreForm.address} onChange={(value) => setTheatreForm({ ...theatreForm, address: value })} />
            <SelectField label="Status" value={theatreForm.status} options={["active", "inactive"]} onChange={(value) => setTheatreForm({ ...theatreForm, status: value })} />
            <button type="submit">Add Theatre</button>
          </form>
          <DataTable title="Theatres" columns={["Theatre name", "City", "Address", "Total Screens"]} rows={theatres.map((theatre) => [theatre.theatre_name || theatre.name, theatre.city, theatre.location || theatre.address, screens.filter((screen) => String(screen.theatre_id || screen.theatreId) === String(rowId(theatre))).length])} />
        </article>
        <article className="vendor-panel">
          <PanelTitle title="Screen Management" right="Layout" />
          <form className="vendor-settings-form compact-form" onSubmit={(event) => submit(event, "screens", screenForm, () => setScreenForm({ theatreId: rowId(theatres[0]) || "", name: "", rows: 10, seatsPerRow: 12, status: "active" }))}>
            <SelectField label="Theatre" value={screenForm.theatreId} options={theatres.map((item) => ({ value: rowId(item), label: item.theatre_name || item.name }))} onChange={(value) => setScreenForm({ ...screenForm, theatreId: value })} />
            <Field label="Screen number" value={screenForm.name} onChange={(value) => setScreenForm({ ...screenForm, name: value })} />
            <SelectField label="Screen type" value={screenForm.screenType || "2D"} options={["2D", "3D", "IMAX", "4DX"]} onChange={(value) => setScreenForm({ ...screenForm, screenType: value })} />
            <Field label="Total rows" type="number" value={screenForm.rows} onChange={(value) => setScreenForm({ ...screenForm, rows: value })} />
            <Field label="Seats per row" type="number" value={screenForm.seatsPerRow} onChange={(value) => setScreenForm({ ...screenForm, seatsPerRow: value })} />
            <SelectField label="Status" value={screenForm.status} options={["active", "inactive"]} onChange={(value) => setScreenForm({ ...screenForm, status: value })} />
            <button type="submit">Add Screen</button>
          </form>
          <div className="mini-seat-layout">{layoutPreview.slice(0, 96).map((seat) => <span key={seat}>{seat}</span>)}</div>
          <DataTable title="Screens" columns={["Screen number", "Screen type", "Seat layout", "Movie assigned", "Show timings"]} rows={screens.map((screen) => {
            const screenShows = shows.filter((show) => String(show.screen_id || show.screenId) === String(rowId(screen)));
            const assignedMovies = screenShows.map((show) => movies.find((movie) => String(rowId(movie)) === String(show.movie_id || show.movieId))?.title).filter(Boolean).join(", ");
            return [screen.screen_name || screen.name, screen.screen_type || screen.screenType || "2D", `${screen.total_rows || screen.rows || 0} x ${screen.seats_per_row || screen.seatsPerRow || 0}`, assignedMovies || "-", screenShows.map((show) => show.show_time || show.showTime).filter(Boolean).join(", ") || "-"];
          })} />
        </article>
      </section>
      <section className="vendor-panel vendor-page-panel">
        <PanelTitle title="Manage Shows" right="Shows" />
        <form className="vendor-settings-form compact-form" onSubmit={(event) => submit(event, "shows", showForm, () => setShowForm({ theatreId: rowId(theatres[0]) || "", screenId: rowId(screens[0]) || "", movieId: rowId(movies[0]) || "", showDate: "", showTime: "", price: 250, status: "active" }))}>
          <SelectField label="Movie" value={showForm.movieId} options={movies.map((item) => ({ value: rowId(item), label: item.title }))} onChange={(value) => setShowForm({ ...showForm, movieId: value })} />
          <SelectField label="Theatre" value={showForm.theatreId} options={theatres.map((item) => ({ value: rowId(item), label: item.theatre_name || item.name }))} onChange={(value) => setShowForm({ ...showForm, theatreId: value })} />
          <SelectField label="Screen" value={showForm.screenId} options={screens.map((item) => ({ value: rowId(item), label: item.screen_name || item.name }))} onChange={(value) => setShowForm({ ...showForm, screenId: value })} />
          <Field label="Show date" type="date" value={showForm.showDate} onChange={(value) => setShowForm({ ...showForm, showDate: value })} />
          <Field label="Show time" type="time" value={showForm.showTime} onChange={(value) => setShowForm({ ...showForm, showTime: value })} />
          <Field label="Price" type="number" value={showForm.price} onChange={(value) => setShowForm({ ...showForm, price: value })} />
          <button type="submit">Add Show</button>
        </form>
        <DataTable title="Shows" columns={["Movie", "Theatre", "Screen", "Date", "Time", "Price", "Status"]} rows={shows.map((show) => [show.movieId?.title || show.movieTitle || show.movieId, show.theatreId?.name || show.theatreId, show.screenId?.name || show.screenId, show.showDate, show.showTime, `Rs ${show.price || 0}`, show.status])} />
      </section>
    </>
  );
}

function ShowAnalyticsPage({ rows }) {
  return <DataTable title="Show Analytics" columns={["Movie", "Theatre", "Show Time", "Total Seats", "Booked", "Available", "Occupancy", "Revenue"]} rows={rows.map((row) => [row.movieTitle, row.theatre, row.showTime, row.totalSeats, row.bookedSeats, row.availableSeats, `${row.occupancyPercentage}%`, `Rs ${row.revenuePerShow || row.revenue || 0}`])} />;
}

function PricingPage({ pricing, shows, reload }) {
  const [form, setForm] = useState(pricing || {});
  const [showPrice, setShowPrice] = useState({ showId: "", price: "" });
  useEffect(() => setForm(pricing || {}), [pricing]);
  useEffect(() => setShowPrice((current) => ({ ...current, showId: current.showId || shows[0]?._id || "" })), [shows.length]);

  const save = async (event) => {
    event.preventDefault();
    await axios.put(`${apiBase}/vendor/pricing`, form, auth());
    reload();
  };

  const saveShowPrice = async (event) => {
    event.preventDefault();
    if (!showPrice.showId) return;
    await axios.patch(`${apiBase}/vendor/shows/${showPrice.showId}/price`, { price: showPrice.price }, auth());
    reload();
  };

  return (
    <section className="vendor-dashboard-grid">
      <article className="vendor-panel">
        <PanelTitle title="Pricing Management" right="Base" />
        <form className="vendor-settings-form" onSubmit={save}>
          {["morningPrice", "afternoonPrice", "eveningPrice", "weekendPrice", "premiumSeatPrice"].map((field) => <Field key={field} label={labelize(field)} type="number" value={form[field] || ""} onChange={(value) => setForm({ ...form, [field]: value })} />)}
          <button type="submit">Save Prices</button>
        </form>
      </article>
      <article className="vendor-panel">
        <PanelTitle title="Update Price By Show" right="Show" />
        <form className="vendor-settings-form compact-form" onSubmit={saveShowPrice}>
          <SelectField label="Show" value={showPrice.showId} options={shows.map((show) => ({ value: show._id, label: `${show.movieId?.title || show.movieId || "Show"} - ${show.showDate || ""} ${show.showTime || ""}` }))} onChange={(value) => setShowPrice({ ...showPrice, showId: value })} />
          <Field label="Show price" type="number" value={showPrice.price} onChange={(value) => setShowPrice({ ...showPrice, price: value })} />
          <button type="submit">Update Show Price</button>
        </form>
      </article>
    </section>
  );
}

function RefundsPage({ refunds, reload }) {
  const update = async (refund, status) => {
    try {
      await axios.patch(`${apiBase}/vendor/refunds/${refund._id || refund.bookingId}`, { refundStatus: status }, auth());
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update refund");
    }
  };
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Refund & Cancellation Management" right="Refunds" /><div className="vendor-table-shell"><table className="vendor-table"><thead><tr><th>Booking</th><th>Customer</th><th>Movie</th><th>Amount</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>{refunds.length ? refunds.map((refund) => <tr key={refund._id}><td>{refund.bookingCode || refund.bookingId}</td><td>{refund.customerName}</td><td>{refund.movieTitle}</td><td>Rs {refund.amount || 0}</td><td>{refund.reason}</td><td><span className="vendor-status">{refund.refundStatus}</span></td><td><div className="vendor-row-actions"><button onClick={() => update(refund, "approved")}>Approve</button><button onClick={() => update(refund, "rejected")}>Reject</button><button onClick={() => update(refund, "paid")}>Paid</button></div></td></tr>) : <tr><td colSpan="7">No cancellation requests.</td></tr>}</tbody></table></div></section>;
}

function PayoutHistoryPage({ payouts }) {
  return <DataTable title="Payout History" columns={["Settlement ID", "Total Revenue", "Platform Commission", "Vendor Payable", "Status", "Settlement Date"]} rows={payouts.map((item) => [item.settlementId || item._id, `Rs ${item.totalRevenue || item.grossRevenue || 0}`, `Rs ${item.platformCommission || item.commission || 0}`, `Rs ${item.vendorPayableAmount || item.netPayable || item.amount || 0}`, item.settlementStatus || item.status, item.settlementDate || item.date ? new Date(item.settlementDate || item.date).toLocaleDateString() : "-"])} />;
}

function StaffPage({ staff, reload }) {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", role: "Ticket Checker", loginPermission: false, status: "active" });
  const save = async (event) => {
    event.preventDefault();
    await axios.post(`${apiBase}/vendor/staff`, form, auth());
    setForm({ name: "", mobile: "", email: "", role: "Ticket Checker", loginPermission: false, status: "active" });
    reload();
  };
  const toggle = async (person, patch) => {
    await axios.patch(`${apiBase}/vendor/staff/${person._id}`, patch, auth());
    reload();
  };
  return (
    <section className="vendor-dashboard-grid">
      <article className="vendor-panel">
        <PanelTitle title="Add Staff" right="Team" />
        <form className="vendor-settings-form compact-form" onSubmit={save}>
          <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="Mobile" value={form.mobile} onChange={(value) => setForm({ ...form, mobile: value })} />
          <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <SelectField label="Role" value={form.role} options={["Manager", "Ticket Checker", "Cashier"]} onChange={(value) => setForm({ ...form, role: value })} />
          <label className="toggle-row"><input type="checkbox" checked={form.loginPermission} onChange={(event) => setForm({ ...form, loginPermission: event.target.checked })} /> Staff login permission</label>
          <button type="submit">Add Staff</button>
        </form>
      </article>
      <section className="vendor-panel vendor-page-panel">
        <PanelTitle title="Staff Management" right="Access" />
        <div className="staff-list">{staff.map((person) => <div className="staff-card" key={person._id}><UserCheck size={24} /><div><strong>{person.name}</strong><span>{person.role} - {person.mobile || person.email || "-"}</span></div><div className="vendor-row-actions"><button onClick={() => toggle(person, { status: person.status === "active" ? "inactive" : "active" })}>{person.status === "active" ? "Deactivate" : "Activate"}</button><button onClick={() => toggle(person, { loginPermission: !person.loginPermission })}>{person.loginPermission ? "Disable Login" : "Enable Login"}</button></div></div>)}</div>
      </section>
    </section>
  );
}

function NotificationCenterPage({ notifications, reload }) {
  const [form, setForm] = useState({ type: "new_booking", title: "", message: "" });
  const save = async (event) => {
    event.preventDefault();
    await axios.post(`${apiBase}/vendor/notifications`, form, auth());
    setForm({ type: "new_booking", title: "", message: "" });
    reload();
  };
  return (
    <section className="vendor-dashboard-grid">
      <article className="vendor-panel">
        <PanelTitle title="Notification Center" right="Alerts" />
        <div className="notification-list">{notifications.map((item) => <div className="notification-row" key={item._id}><Bell size={18} /><div><strong>{item.title}</strong><span>{item.message}</span></div><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small></div>)}</div>
      </article>
      <article className="vendor-panel">
        <PanelTitle title="Create Alert" right="Vendor" />
        <form className="vendor-settings-form compact-form" onSubmit={save}>
          <SelectField label="Alert type" value={form.type} options={["new_booking", "low_seat", "show_cancelled", "settlement_paid", "refund_request"]} onChange={(value) => setForm({ ...form, type: value })} />
          <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Field label="Message" value={form.message} onChange={(value) => setForm({ ...form, message: value })} />
          <button type="submit">Send Alert</button>
        </form>
      </article>
    </section>
  );
}

function MovieStatusPage({ movies, reload }) {
  const statuses = ["upcoming", "now_showing", "house_full", "ended", "cancelled", "hidden"];
  const update = async (movie, status) => {
    await axios.patch(`${apiBase}/vendor/movies/${movie._id}/status`, { status }, auth());
    reload();
  };
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Movie Status Control" right="Visibility" /><div className="vendor-table-shell"><table className="vendor-table"><thead><tr><th>Movie</th><th>Theatre</th><th>Current Status</th><th>Change Status</th></tr></thead><tbody>{movies.map((movie) => <tr key={movie._id}><td>{movie.title}</td><td>{movie.theatre || movie.theatreName || "-"}</td><td><span className="vendor-status">{movie.status || "active"}</span></td><td><div className="status-button-grid">{statuses.map((status) => <button key={status} type="button" className={movie.status === status ? "active" : ""} onClick={() => update(movie, status)}>{status.replace("_", " ")}</button>)}</div></td></tr>)}</tbody></table></div></section>;
}

function BookingsPage({ bookings }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const rows = filter === "all" ? bookings : bookings.filter((booking) => normalizeService(booking.module) === filter);
  return (
    <>
      <ServiceTabs active={filter} setActive={setFilter} />
      <BookingsTable title="Bookings" bookings={rows} onSelect={setSelected} />
      {selected && <BookingDrawer booking={selected} close={() => setSelected(null)} />}
    </>
  );
}

function BookingsTable({ title, bookings, compact = false, onSelect }) {
  return (
    <section className="vendor-panel vendor-page-panel">
      <PanelTitle title={title} right="Live" />
      <div className="vendor-table-shell"><table className="vendor-table"><thead><tr><th>Booking ID</th><th>Service Type</th><th>Customer Name</th><th>Listing Name</th><th>Date</th><th>Amount</th><th>Payment Status</th><th>Booking Status</th><th>Action</th></tr></thead><tbody>{bookings.length ? bookings.map((booking) => <tr key={booking._id}><td>{booking.bookingCode || booking._id}</td><td>{booking.module}</td><td>{booking.user?.name || booking.customerName || booking.details?.customerName || "Customer"}</td><td>{booking.title}</td><td>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "-"}</td><td>Rs {booking.amount || 0}</td><td>{booking.paymentStatus}</td><td>{booking.status}</td><td><button className="table-action-btn" type="button" onClick={() => onSelect?.(booking)}>{compact ? "Open" : "View"}</button></td></tr>) : <tr><td colSpan="9">No bookings yet.</td></tr>}</tbody></table></div>
    </section>
  );
}

function BookingDrawer({ booking, close }) {
  return <aside className="booking-drawer"><button className="drawer-close" onClick={close}>Close</button><h2>{booking.title}</h2><InfoGroup title="Customer Info" rows={[["Name", booking.user?.name || booking.customerName], ["Mobile", booking.user?.mobile || booking.customerMobile], ["Email", booking.user?.email || booking.customerEmail]]} /><InfoGroup title="Payment Info" rows={[["Amount", `Rs ${booking.amount || 0}`], ["Payment", booking.paymentStatus], ["Status", booking.status]]} /><InfoGroup title="Seat Info" rows={[["Seats", booking.seats?.join(", ")], ["Service", booking.module]]} /><InfoGroup title="Booking Timeline" rows={[["Created", booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "-"], ["Updated", booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : "-"]]} /></aside>;
}

function CustomersPage({ customers, customerList = [] }) {
  if (customerList.length) {
    return <DataTable title="Customer List" columns={["Customer Name", "Mobile", "Email", "Movie Booked", "Seat Number", "Booking Date", "Payment Status"]} rows={customerList.map((customer) => [customer.customerName, customer.mobile, customer.email, customer.movieBooked, customer.seatNumber, customer.bookingDate ? new Date(customer.bookingDate).toLocaleDateString() : "-", customer.paymentStatus])} />;
  }
  return <DataTable title="Customers" columns={["Customer Name", "Mobile", "Email", "Total Bookings", "Last Booking", "Total Spend"]} rows={customers.map((customer) => [customer.customerName, customer.mobile || "-", customer.email || "-", customer.totalBookings || 0, customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString() : "-", `Rs ${customer.totalSpend || 0}`])} />;
}

function RevenuePage({ stats }) {
  const [filter, setFilter] = useState("all");
  const cards = [["Gross Revenue", stats.revenue], ["Vendor Earnings", stats.vendorEarnings], ["Platform Commission", stats.tixhubCommission || stats.platformCommission], ["Pending Settlement", stats.pendingSettlement || stats.pendingSettlements], ["Settled Amount", stats.settledAmount]];
  return <><ServiceTabs active={filter} setActive={setFilter} /><section className="vendor-card-grid revenue-card-grid">{cards.map(([label, value]) => <article className="vendor-kpi-card" key={label}><div><p>{label}</p><h2>Rs {value || 0}</h2><span>{filter === "all" ? "All services" : serviceMeta[filter]?.label}</span></div></article>)}</section><section className="vendor-dashboard-grid"><article className="vendor-panel sales-panel"><PanelTitle title="Daily Revenue" /><LineChart values={weeklySales} /></article><article className="vendor-panel revenue-panel"><PanelTitle title="Monthly Revenue" right="2026" /><BarChart values={revenueBars} /></article></section></>;
}

function SettlementsPage({ settlements, stats }) {
  const rows = settlements.length ? settlements.map((item) => [item._id, `Rs ${item.netPayable || item.amount || 0}`, item.createdAt ? new Date(item.createdAt).toLocaleDateString() : item.cycle || "Current cycle", item.status, item.transactionId || "-"]) : [["current-cycle", `Rs ${stats.pendingSettlement || stats.pendingSettlements || 0}`, "Current cycle", "pending", "-"]];
  return <DataTable title="Settlements" columns={["Settlement ID", "Amount", "Date", "Status", "Transaction ID"]} rows={rows} />;
}

function PaymentDetailsPage({ details, reload }) {
  const [form, setForm] = useState(details || {});
  useEffect(() => setForm(details || {}), [details]);
  const fields = ["businessName", "businessType", "accountHolderName", "bankName", "accountNumber", "confirmAccountNumber", "ifscCode", "upiId", "panNumber", "gstNumber", "settlementPreference"];
  const labels = ["Business Name", "Business Type", "Account Holder Name", "Bank Name", "Account Number", "Confirm Account Number", "IFSC Code", "UPI ID", "PAN Number", "GST Number", "Settlement Preference"];
  const submit = async (event) => {
    event.preventDefault();
    try {
      await axios.put(`${apiBase}/vendor/payment-details`, form, auth());
      alert("Payment details saved");
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save payment details");
    }
  };
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Payment Details" right="Bank" /><p>TixHub owns Razorpay. Vendors only add settlement bank details.</p><form className="vendor-settings-form" onSubmit={submit}>{fields.map((field, index) => <label key={field}><span>{labels[index]}</span><input value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} /></label>)}<button type="submit">Save Payment Details</button></form></section>;
}

function ProfilePage({ user }) {
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Profile" right="Vendor" /><InfoGroup title="Account" rows={[["Name", user.name], ["Email", user.email], ["Role", user.role], ["Status", user.status]]} /></section>;
}

function SupportPage() {
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title="Support" right="TixHub" /><InfoList rows={["Raise payment, booking, listing, or settlement issues from this section.", "Support tickets can be connected here when the support API is added.", "For now, keep vendor operational notes visible here."]} /></section>;
}

function AvailabilityPage({ rows, movies }) {
  const fallbackRows = movies.map((movie) => {
    const bookedSeats = movie.bookedSeats?.length || 0;
    const totalSeats = movie.totalSeats || 0;
    return { _id: movie._id, movie: movie.title, theatre: movie.theatre || movie.theatreName || "-", showTime: movie.showTime || "-", totalSeats, bookedSeats, availableSeats: Math.max(totalSeats - bookedSeats, 0), blockedSeats: 0, occupancy: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0 };
  });
  const source = rows.length ? rows : fallbackRows;
  return <DataTable title="Booking Availability" columns={["Movie", "Theatre", "Show Time", "Total Seats", "Booked Seats", "Available Seats", "Blocked Seats", "Occupancy %"]} rows={source.map((row) => [row.movie, row.theatre, row.showTime, row.totalSeats, row.bookedSeats, row.availableSeats, row.blockedSeats, `${row.occupancy}%`])} />;
}

function FutureService({ service }) {
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title={serviceMeta[service]?.label || "Service"} right="Future" /><p>{serviceMeta[service]?.label} support is ready for navigation and can be enabled when listings/API are added.</p></section>;
}

function ServiceTabs({ active, setActive }) {
  return <div className="booking-service-tabs">{commonServices.map((service) => <button className={active === service ? "active" : ""} type="button" onClick={() => setActive(service)} key={service}>{service === "all" ? "All" : serviceMeta[service]?.label}</button>)}</div>;
}

function DataTable({ title, columns, rows }) {
  return <section className="vendor-panel vendor-page-panel"><PanelTitle title={title} right="Live" /><div className="vendor-table-shell"><table className="vendor-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell || "-"}</td>)}</tr>) : <tr><td colSpan={columns.length}>No data available yet.</td></tr>}</tbody></table></div></section>;
}

function CategorySales({ stats, bookings }) {
  const counts = bookings.reduce((acc, booking) => {
    const key = normalizeService(booking.module || "other");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const source = Object.keys(stats.moduleCounts || {}).length ? stats.moduleCounts : counts;
  const moduleKey = (service) => ({ movies: "movie", flights: "flight", hotels: "hotel", events: "event", travel: "travel-package" }[service] || service);
  const rows = commonServices.filter((service) => service !== "all").map((service) => [serviceMeta[service]?.label || service, source[service] || source[moduleKey(service)] || 0]);
  return <div className="category-sales">{rows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>;
}

function PerformanceOverview({ stats }) {
  return (
    <div className="performance-overview">
      <div className="flight-seat-summary"><span style={{ "--value": `${occupancy(stats)}%` }} /><p>Capacity Utilization</p><strong>{occupancy(stats)}%</strong></div>
      <OverviewBlock rows={[["Monthly Revenue", `Rs ${stats.monthlyRevenue || 0}`], ["Today Revenue", `Rs ${stats.todayRevenue || 0}`], ["Vendor Earnings", `Rs ${stats.vendorEarnings || 0}`]]} />
    </div>
  );
}

function OverviewBlock({ title, rows }) {
  return <div className="overview-block">{title && <h3>{title}</h3>}{rows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value || 0}</strong></p>)}</div>;
}

function NotificationSummary({ notifications, bookings, refunds, schedules }) {
  const rows = [
    ["New Bookings", bookings.filter((booking) => isToday(booking.createdAt)).length],
    ["Schedule Updates", schedules.length],
    ["Refund Requests", refunds.length],
    ["System Notifications", notifications.length],
  ];
  return <OverviewBlock rows={rows} />;
}

function MiniCount({ label, value }) {
  return <article className="vendor-kpi-card"><div><p>{label}</p><h2>{value || 0}</h2><span>Production module</span></div></article>;
}

function WeeklyMovieBookingChart({ data }) {
  const maxValue = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <div className="movie-weekly-chart" aria-label="Weekly movie booking chart">
      {data.map((item) => (
        <div className="movie-weekly-bar" key={item.day}>
          <strong>{item.value || 0}</strong>
          <span style={{ height: `${Math.max((Number(item.value || 0) / maxValue) * 100, item.value ? 12 : 4)}%` }} />
          <small>{item.day}</small>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return <label><span>{label}</span><input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, options, onChange }) {
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option.replace(/_/g, " ") } : option));
  return <label><span>{label}</span><select value={value || ""} onChange={(event) => onChange(event.target.value)}>{normalized.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function labelize(value) {
  return String(value || "").replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function rowId(row) {
  return row?._id || row?.id || "";
}

function InfoGroup({ title, rows }) {
  return <div className="info-group"><h3>{title}</h3>{rows.map(([label, value]) => <p key={label}><strong>{label}</strong><span>{value || "-"}</span></p>)}</div>;
}

function InfoList({ rows }) {
  return <div className="info-list">{rows.map((row) => <p key={row}>{row}</p>)}</div>;
}

function PanelTitle({ title, right = "April" }) {
  return <div className="panel-title"><h2>{title}</h2><button type="button">{right}<ChevronDown size={15} /></button></div>;
}

function SeatLegend() {
  return <div className="seat-legend"><span className="available">Available</span><span className="booked">Booked</span><span className="blocked">Blocked</span></div>;
}

function occupancy(stats) {
  const total = Number(stats.availableSeats || 0) + Number(stats.bookedSeats || 0) + Number(stats.blockedSeats || 0);
  return total ? Math.round((Number(stats.bookedSeats || 0) / total) * 100) : 0;
}

function normalizeService(module) {
  const value = String(module || "").toLowerCase();
  if (value === "movie") return "movies";
  if (value === "flight") return "flights";
  if (value === "bus") return "buses";
  if (value === "train") return "trains";
  if (value === "hotel") return "hotels";
  if (value === "event") return "events";
  if (value === "travel-package") return "travel";
  return value;
}

function normalizeStatus(booking) {
  return String(booking?.bookingStatus || booking?.status || booking?.paymentStatus || "").toLowerCase();
}

function isToday(value) {
  if (!value) return false;
  return new Date(value).toDateString() === new Date().toDateString();
}

function LineChart({ values }) {
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${92 - value}`).join(" ");
  return <div className="line-chart"><div className="chart-tooltip">Bookings <strong>345,678</strong></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Booking trend line chart"><polyline points={points} /><path d={`M0,100 L${points.replaceAll(" ", " L")} L100,100 Z`} /></svg><div className="chart-days">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div></div>;
}

function BarChart({ values }) {
  return <div className="bar-chart">{values.map((value, index) => <div className="bar-column" key={`${value}-${index}`}><span style={{ height: `${value}%` }} /><small>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][index]}</small></div>)}</div>;
}

function MovieList({ movies, showValue = false }) {
  return <div className="vendor-movie-list">{movies.map((movie) => <div className="vendor-movie-row" key={movie.id || movie._id}>{movie.image ? <img src={movie.image} alt={movie.title} /> : <span className="movie-thumb"><Film size={18} /></span>}<div><strong>{movie.title}</strong><small>{movie.date || movie.meta || movie.genre}</small></div>{showValue && <b>{movie.value}%</b>}</div>)}</div>;
}

export default VendorDashboard;
