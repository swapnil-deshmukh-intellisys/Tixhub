import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  Film,
  LayoutDashboard,
  MonitorPlay,
  Plus,
  QrCode,
  Search,
  Settings,
  Sofa,
  Ticket,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { vendorSidebarConfig } from "./vendorSidebarConfig";
import "./MovieVendorDashboard.css";

const apiBase = "http://localhost:5000/api";
const ranges = ["day", "week", "month", "year", "all"];
const showTypes = ["morning", "afternoon", "evening"];

const demoTrends = {
  day: [
    { label: "8 AM", bookings: 4, revenue: 2400 }, { label: "11 AM", bookings: 8, revenue: 5200 },
    { label: "2 PM", bookings: 13, revenue: 8600 }, { label: "5 PM", bookings: 11, revenue: 7400 },
    { label: "8 PM", bookings: 18, revenue: 12800 }, { label: "11 PM", bookings: 7, revenue: 4900 },
  ],
  week: [
    { label: "Mon", bookings: 24, revenue: 16800 }, { label: "Tue", bookings: 31, revenue: 21700 },
    { label: "Wed", bookings: 28, revenue: 19600 }, { label: "Thu", bookings: 42, revenue: 29400 },
    { label: "Fri", bookings: 49, revenue: 34300 }, { label: "Sat", bookings: 65, revenue: 45500 },
    { label: "Sun", bookings: 58, revenue: 40600 },
  ],
  month: [
    { label: "Week 1", bookings: 132, revenue: 92400 }, { label: "Week 2", bookings: 168, revenue: 117600 },
    { label: "Week 3", bookings: 155, revenue: 108500 }, { label: "Week 4", bookings: 194, revenue: 135800 },
  ],
  year: [
    { label: "Jan", bookings: 380, revenue: 266000 }, { label: "Feb", bookings: 425, revenue: 297500 },
    { label: "Mar", bookings: 468, revenue: 327600 }, { label: "Apr", bookings: 442, revenue: 309400 },
    { label: "May", bookings: 515, revenue: 360500 }, { label: "Jun", bookings: 574, revenue: 401800 },
    { label: "Jul", bookings: 612, revenue: 428400 }, { label: "Aug", bookings: 590, revenue: 413000 },
    { label: "Sep", bookings: 641, revenue: 448700 }, { label: "Oct", bookings: 690, revenue: 483000 },
    { label: "Nov", bookings: 724, revenue: 506800 }, { label: "Dec", bookings: 786, revenue: 550200 },
  ],
  all: [
    { label: "2022", bookings: 2240, revenue: 1568000 }, { label: "2023", bookings: 3480, revenue: 2436000 },
    { label: "2024", bookings: 4720, revenue: 3304000 }, { label: "2025", bookings: 5980, revenue: 4186000 },
    { label: "2026", bookings: 6410, revenue: 4487000 },
  ],
};

const iconMap = {
  dashboard: LayoutDashboard,
  movie: Film,
  screen: MonitorPlay,
  calendar: CalendarDays,
  seat: Sofa,
  ticket: Ticket,
  blocked: Sofa,
  revenue: CircleDollarSign,
  reports: BarChart3,
  profile: UserRound,
  settings: Settings,
};

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const numberOrFallback = (value, fallback) => value === undefined || value === null ? fallback : numberValue(value);

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const authConfig = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser") || "{}");
  } catch {
    return {};
  }
};

const normalizeStatus = (booking) => String(booking?.bookingStatus || booking?.status || "pending").toLowerCase();

const normalizeTrend = (payload, range) => {
  const rows = Array.isArray(payload) ? payload : payload?.trends || payload?.data || payload?.results || [];
  if (!Array.isArray(rows) || !rows.length) return demoTrends[range];
  return rows.map((item, index) => ({
    label: item.label || item.dateLabel || item.month || item.date || item.period || `Point ${index + 1}`,
    bookings: numberValue(item.bookings ?? item.bookingCount ?? item.count),
    revenue: numberValue(item.revenue ?? item.totalRevenue ?? item.amount),
  }));
};

const getShowPeriod = (time) => {
  const text = String(time || "").trim().toLowerCase();
  let hour = Number.parseInt(text, 10);
  if (text.includes("pm") && hour < 12) hour += 12;
  if (text.includes("am") && hour === 12) hour = 0;
  if (!Number.isFinite(hour)) return "evening";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

const getShowMovieName = (show) => show?.movieTitle || show?.movie?.title || (typeof show?.movie === "string" ? show.movie : "") || show?.title || "Movie";

const collectShows = (payload) => {
  if (Array.isArray(payload?.upcomingShows) && payload.upcomingShows.length) return payload.upcomingShows;
  const movies = payload?.movies || payload?.listings || [];
  return movies.flatMap((movie) => {
    const times = Array.isArray(movie.showTimes) && movie.showTimes.length ? movie.showTimes : [movie.showTime].filter(Boolean);
    return times.map((show, index) => ({
      _id: show?._id || show?.id || movie.showId || "",
      movieId: show?.movieId || show?.movie_id || movie._id || movie.id || "",
      movie: movie.title || "Movie",
      date: show?.date || show?.showDate || movie.showDate || "",
      time: show?.time || show?.showTime || show,
      screen: show?.screenName || movie.screenName || movie.screenNumber || "Screen",
      sourceIndex: index,
    }));
  });
};

const productionModules = [
  ["Movie Listings", "/vendor/my-movies", Film],
  ["Theatre & Screen Management", "/vendor/theatres", MonitorPlay],
  ["Show Schedule", "/vendor/shows", CalendarDays],
  ["Morning Show", "/vendor/shows", CalendarDays],
  ["Afternoon Show", "/vendor/shows", CalendarDays],
  ["Evening Show", "/vendor/shows", CalendarDays],
  ["Seat Management", "/vendor/seat-management", Sofa],
  ["Regular Seat", "/vendor/seat-management", Sofa],
  ["Prime Seat", "/vendor/seat-management", Sofa],
  ["VIP Seat", "/vendor/seat-management", Sofa],
  ["Blocked Seats", "/vendor/blocked-seats", Sofa],
  ["Booked Seats", "/vendor/availability", Ticket],
  ["Available Seats", "/vendor/availability", Ticket],
  ["QR Scan", "/vendor/qr-scanner", QrCode],
  ["Show Analytics", "/vendor/analytics", BarChart3],
  ["Pricing", "/vendor/pricing", CircleDollarSign],
  ["Refunds", "/vendor/refunds", WalletCards],
  ["Payout History", "/vendor/payouts", WalletCards],
  ["Staff", "/vendor/staff", UserRound],
  ["Notification Center", "/vendor/notification-center", Bell],
  ["Customer List", "/vendor/customers", UserRound],
  ["Status Controls", "/vendor/movie-status", Settings],
];

function MovieVendorDashboard() {
  const navigate = useNavigate();
  const storedUser = useMemo(() => getStoredUser(), []);
  const [now, setNow] = useState(new Date());
  const [dashboard, setDashboard] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("week");
  const [trendData, setTrendData] = useState(demoTrends.week);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendMessage, setTrendMessage] = useState("");
  const [showType, setShowType] = useState("morning");
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedShowId, setSelectedShowId] = useState("");
  const [prices, setPrices] = useState({
    morning: { regularPrice: "", primePrice: "", vipPrice: "" },
    afternoon: { regularPrice: "", primePrice: "", vipPrice: "" },
    evening: { regularPrice: "", primePrice: "", vipPrice: "" },
  });
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceMessage, setPriceMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      try {
        response = await axios.get(`${apiBase}/vendor/movie/dashboard`, authConfig());
      } catch {
        response = await axios.get(`${apiBase}/vendor/movies/dashboard/summary`, authConfig());
      }
      const dashboardPayload = response.data?.data || response.data || {};
      try {
        const showsResponse = await axios.get(`${apiBase}/vendor/shows`, authConfig());
        const liveShows = Array.isArray(showsResponse.data) ? showsResponse.data : showsResponse.data?.shows || [];
        setDashboard({ ...dashboardPayload, upcomingShows: liveShows.length ? liveShows : dashboardPayload.upcomingShows });
      } catch {
        setDashboard(dashboardPayload);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load the movie dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const loadTrends = async () => {
      setTrendLoading(true);
      setTrendMessage("");
      try {
        let response;
        try {
          response = await axios.get(`${apiBase}/vendor/movie/booking-trends`, { ...authConfig(), params: { range } });
        } catch {
          response = await axios.get(`${apiBase}/vendor/movie/bookings/trends`, { ...authConfig(), params: { range } });
        }
        if (active) setTrendData(normalizeTrend(response.data, range));
      } catch {
        if (active) {
          setTrendData(demoTrends[range]);
          setTrendMessage("Live trends unavailable — showing demo data.");
        }
      } finally {
        if (active) setTrendLoading(false);
      }
    };
    loadTrends();
    return () => { active = false; };
  }, [range]);

  const movies = useMemo(() => dashboard.movies || dashboard.listings || [], [dashboard]);
  const bookings = useMemo(() => dashboard.bookings || dashboard.recentBookings || [], [dashboard]);
  const rawStats = useMemo(() => dashboard.stats || dashboard, [dashboard]);
  const statusSource = useMemo(() => dashboard.bookingStatus || rawStats.bookingStatus || {}, [dashboard, rawStats]);
  const shows = useMemo(() => collectShows(dashboard), [dashboard]);

  useEffect(() => {
    if (!selectedMovieId && movies.length) setSelectedMovieId(String(movies[0]._id || movies[0].id || ""));
  }, [movies, selectedMovieId]);

  const movieShows = useMemo(() => shows.filter((show) => {
    const showMovieId = show.movieId?._id || show.movieId || show.movie_id || show.movie?._id;
    return !selectedMovieId || String(showMovieId || "") === selectedMovieId;
  }), [selectedMovieId, shows]);

  useEffect(() => {
    if (!movieShows.some((show) => String(show._id || show.id || "") === selectedShowId)) {
      setSelectedShowId(String(movieShows[0]?._id || movieShows[0]?.id || ""));
    }
  }, [movieShows, selectedShowId]);

  const stats = useMemo(() => {
    const bookedSeats = numberValue(rawStats.bookedSeats) || movies.reduce((sum, movie) => sum + numberValue(movie.bookedSeats?.length ?? movie.bookedSeats), 0);
    const blockedSeats = numberValue(rawStats.blockedSeats) || movies.reduce((sum, movie) => sum + numberValue(movie.blockedSeats), 0);
    const availableSeats = numberValue(rawStats.availableSeats) || movies.reduce((sum, movie) => sum + numberValue(movie.availableSeats), 0);
    return {
      totalMovies: numberValue(rawStats.totalMovies) || movies.length,
      totalBookings: numberValue(rawStats.totalBookings) || bookings.length,
      revenue: numberValue(rawStats.revenue ?? rawStats.totalRevenue),
      availableSeats,
      bookedSeats,
      blockedSeats,
    };
  }, [bookings.length, movies, rawStats]);

  const bookingStatus = useMemo(() => {
    const counted = bookings.reduce((result, booking) => {
      const status = normalizeStatus(booking);
      if (status.includes("confirm")) result.confirmed += 1;
      else if (status.includes("complete")) result.completed += 1;
      else if (status.includes("cancel")) result.cancelled += 1;
      else result.pending += 1;
      return result;
    }, { confirmed: 0, pending: 0, cancelled: 0, completed: 0 });
    return {
      confirmed: numberOrFallback(statusSource.confirmed ?? rawStats.confirmedBookings, counted.confirmed),
      pending: numberOrFallback(statusSource.pending ?? rawStats.pendingBookings, counted.pending),
      cancelled: numberOrFallback(statusSource.cancelled ?? rawStats.cancelledBookings, counted.cancelled),
      completed: numberOrFallback(statusSource.completed ?? rawStats.completedBookings, counted.completed),
    };
  }, [bookings, rawStats, statusSource]);

  const showCounts = shows.reduce((result, show) => {
    result[getShowPeriod(show.time || show.showTime)] += 1;
    return result;
  }, { morning: 0, afternoon: 0, evening: 0 });

  const vendor = dashboard.vendor || dashboard.profile || storedUser;
  const vendorName = vendor.name || vendor.businessName || vendor.companyName || "Vendor";
  const initials = vendorName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const metricCards = [
    ["Total Movies", stats.totalMovies, Film, "green"],
    ["Total Bookings", stats.totalBookings, Ticket, "blue"],
    ["Revenue", `Rs ${stats.revenue.toLocaleString("en-IN")}`, CircleDollarSign, "violet"],
    ["Available Seats", stats.availableSeats, Sofa, "green"],
    ["Booked Seats", stats.bookedSeats, Sofa, "blue"],
    ["Blocked Seats", stats.blockedSeats, Sofa, "red"],
  ];
  const statusCards = [
    ["Confirmed", bookingStatus.confirmed, "confirmed"], ["Pending", bookingStatus.pending, "pending"],
    ["Cancelled", bookingStatus.cancelled, "cancelled"], ["Completed", bookingStatus.completed, "completed"],
  ];
  const quickActions = [
    ["Add Movie", "/vendor/add-movie", Plus], ["My Movies", "/vendor/my-movies", Film],
    ["Manage Shows", "/vendor/shows", CalendarDays], ["Seat Management", "/vendor/seat-management", Sofa],
    ["Bookings", "/vendor/bookings", Ticket], ["Revenue", "/vendor/revenue", WalletCards],
  ];

  const updatePrice = (field, value) => {
    setPrices((current) => ({ ...current, [showType]: { ...current[showType], [field]: value } }));
  };

  const submitPrices = async (event) => {
    event.preventDefault();
    setPriceSaving(true);
    setPriceMessage("");
    const selected = prices[showType];
    try {
      const pricePayload = {
        movieId: selectedMovieId,
        showId: selectedShowId,
        showType,
        prices: {
          regular: numberValue(selected.regularPrice),
          prime: numberValue(selected.primePrice),
          vip: numberValue(selected.vipPrice),
        },
      };
      try {
        await axios.put(`${apiBase}/vendor/movie/show-seat-prices`, pricePayload, authConfig());
      } catch {
        await axios.put(`${apiBase}/vendor/movie/seat-prices`, {
          showType,
          regularPrice: pricePayload.prices.regular,
          primePrice: pricePayload.prices.prime,
          vipPrice: pricePayload.prices.vip,
        }, authConfig());
      }
      setPriceMessage(`${showType[0].toUpperCase() + showType.slice(1)} prices updated successfully.`);
      await loadDashboard();
    } catch (requestError) {
      setPriceMessage(requestError.response?.data?.message || "Unable to update seat prices.");
    } finally {
      setPriceSaving(false);
    }
  };

  return (
    <div className="mvd-shell">
      <aside className="mvd-sidebar">
        <div className="mvd-brand"><span><Clapperboard size={20} /></span><strong>TixHub</strong></div>
        <div className="mvd-service-switch"><button className="active" type="button">Movie Panel</button><button type="button" onClick={() => navigate("/vendor-dashboard")}>All Services</button></div>
        <nav className="mvd-nav">
          {vendorSidebarConfig.movie.map((group, index) => (
            <section key={group.title || index}>
              {group.title && <p>{group.title}</p>}
              {group.items.map((item) => {
                const Icon = iconMap[item.icon] || ChevronRight;
                const path = item.path === "/vendor/movies" ? "/vendor/my-movies" : item.path;
                return <button className={item.path === "/vendor/dashboard" ? "active" : ""} type="button" onClick={() => navigate(path)} key={item.path}><Icon size={17} />{item.label}</button>;
              })}
            </section>
          ))}
        </nav>
        <button className="mvd-profile-card" type="button" onClick={() => navigate("/vendor/profile")}><span className="mvd-avatar">{initials || "V"}</span><span><strong>{vendorName}</strong><small>Movie Vendor</small></span><ChevronRight size={15} /></button>
      </aside>

      <main className="mvd-main">
        <header className="mvd-topbar">
          <label className="mvd-search"><Search size={17} /><input type="search" placeholder="Search movies, shows or bookings" /></label>
          <div className="mvd-top-actions"><button className="mvd-icon-button notify" type="button" aria-label="Notifications"><Bell size={19} /><i /></button><button className="mvd-profile-pill" type="button"><span className="mvd-avatar small">{initials || "V"}</span><span><strong>{vendorName}</strong><small>Movie Vendor</small></span></button></div>
        </header>

        <div className="mvd-content">
          <section className="mvd-welcome">
            <div><small>Movie Vendor Panel</small><h1>Welcome, {vendorName}</h1><p>Manage movie production, shows, seats and bookings.</p></div>
            <div className="mvd-welcome-actions"><div className="mvd-live-time"><CalendarDays size={19} /><span><strong>{now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}</strong><small>{now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small></span></div><button className="mvd-top-add" type="button" onClick={() => navigate("/vendor/add-movie")}><Plus size={17} />Add Movie</button></div>
          </section>

          {loading && <div className="mvd-alert">Loading live movie data...</div>}
          {error && <div className="mvd-alert warning">{error}<button type="button" onClick={loadDashboard}>Retry</button></div>}

          <section className="mvd-two-column">
            <div className="mvd-left-column">
              <section className="mvd-metric-grid">
                {metricCards.map(([label, value, Icon, color]) => <article className="mvd-metric-card" key={label}><span className={`mvd-metric-icon ${color}`}><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}
              </section>

              <section className="mvd-status-grid">
                {statusCards.map(([label, value, status]) => <article className={`mvd-status-card-small ${status}`} key={label}><i /><span><small>{label}</small><strong>{value}</strong></span></article>)}
              </section>

              <section className="mvd-card mvd-production-card">
                <div className="mvd-card-title"><div><h2>Movie Production Module</h2><p>Manage movie production, shows, seats and operations.</p></div><span>Movie</span></div>
                <div className="mvd-production-grid">
                  {productionModules.map(([label, path, Icon]) => <button type="button" onClick={() => navigate(path)} key={label}><Icon size={16} /><span>{label}</span></button>)}
                </div>
              </section>

              <TrendChart data={trendData} range={range} setRange={setRange} loading={trendLoading} message={trendMessage} />

              <form className="mvd-card mvd-price-card" onSubmit={submitPrices}>
                <div className="mvd-card-title"><div><h2>Show-wise Seat Prices</h2><p>Choose a show period and update each seat category.</p></div></div>
                <div className="mvd-price-selectors">
                  <label><span>Movie</span><select value={selectedMovieId} onChange={(event) => { setSelectedMovieId(event.target.value); setSelectedShowId(""); }} required><option value="">Select movie</option>{movies.map((movie) => <option value={movie._id || movie.id} key={movie._id || movie.id || movie.title}>{movie.title || "Movie"}</option>)}</select></label>
                  <label><span>Show</span><select value={selectedShowId} onChange={(event) => setSelectedShowId(event.target.value)} required><option value="">Select show</option>{movieShows.map((show, index) => <option value={show._id || show.id || ""} key={show._id || show.id || index}>{show.showDate || show.date || "Show"} {show.showTime || show.time || ""}</option>)}</select></label>
                </div>
                <div className="mvd-show-type-tabs">{showTypes.map((type) => <button className={showType === type ? "active" : ""} type="button" onClick={() => { setShowType(type); setPriceMessage(""); }} key={type}>{type[0].toUpperCase() + type.slice(1)} price</button>)}</div>
                <div className="mvd-price-fields">
                  {["regularPrice", "primePrice", "vipPrice"].map((field) => <label key={field}><span>{field.replace("Price", " seat price").replace(/^./, (letter) => letter.toUpperCase())}</span><div><b>Rs</b><input min="0" step="1" type="number" value={prices[showType][field]} onChange={(event) => updatePrice(field, event.target.value)} placeholder="0" required /></div></label>)}
                  <button className="mvd-primary-button" type="submit" disabled={priceSaving}>{priceSaving ? "Updating..." : `Update ${showType[0].toUpperCase() + showType.slice(1)} Price`}</button>
                </div>
                {priceMessage && <p className="mvd-form-message">{priceMessage}</p>}
              </form>
            </div>

            <aside className="mvd-right-column">
              <section className="mvd-card mvd-calendar-card">
                <div className="mvd-card-title"><h2>Show Calendar</h2><span>Today</span></div>
                <div className="mvd-today"><span>{now.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}</span><strong>{now.getDate()}</strong><small>{now.toLocaleDateString("en-IN", { weekday: "long" })}</small></div>
                <div className="mvd-show-counts">{showTypes.map((type) => <div key={type}><small>{type}</small><strong>{showCounts[type]}</strong></div>)}</div>
                <div className="mvd-upcoming"><div className="mvd-subtitle"><h3>Upcoming movie shows</h3><span>{shows.length}</span></div>{shows.slice(0, 4).map((show, index) => <article key={`${getShowMovieName(show)}-${show.time || show.showTime}-${index}`}><span className={`mvd-period-dot ${getShowPeriod(show.time || show.showTime)}`} /><div><strong>{getShowMovieName(show)}</strong><small>{show.date || show.showDate || "Upcoming"} · {show.time || show.showTime || "Time TBA"}</small></div><b>{show.screen || show.screenName || "Screen"}</b></article>)}{!shows.length && <p className="mvd-empty">No upcoming shows available.</p>}</div>
                <button className="mvd-primary-button full" type="button" onClick={() => navigate("/vendor/shows")}><Plus size={17} />Add Show</button>
              </section>

              <section className="mvd-card mvd-quick-card">
                <div className="mvd-card-title"><h2>Quick Actions</h2><span>Tools</span></div>
                <div className="mvd-quick-grid">{quickActions.map(([label, path, Icon]) => <button type="button" onClick={() => navigate(path)} key={label}><Icon size={18} /><span>{label}</span><ChevronRight size={14} /></button>)}</div>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

function TrendChart({ data, range, setRange, loading, message }) {
  return (
    <section className="mvd-card mvd-trend-card">
      <div className="mvd-trend-header"><div><h2>Booking Trend</h2><p>Booking count and revenue</p></div><div className="mvd-trend-filters">{ranges.map((item) => <button className={range === item ? "active" : ""} type="button" onClick={() => setRange(item)} key={item}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div></div>
      {loading && <p className="mvd-chart-message">Loading trends...</p>}
      {message && !loading && <p className="mvd-chart-message warning">{message}</p>}
      <div className="mvd-chart">
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><CartesianGrid stroke="#e8f0eb" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#718078", fontSize: 11, fontWeight: 700 }} /><YAxis yAxisId="bookings" width={36} axisLine={false} tickLine={false} tick={{ fill: "#718078", fontSize: 10 }} /><YAxis yAxisId="revenue" width={50} orientation="right" axisLine={false} tickLine={false} tickFormatter={(value) => value >= 100000 ? `${Math.round(value / 100000)}L` : value >= 1000 ? `${Math.round(value / 1000)}K` : value} tick={{ fill: "#718078", fontSize: 10 }} /><Tooltip formatter={(value, name) => [name === "Revenue" ? `Rs ${numberValue(value).toLocaleString("en-IN")}` : numberValue(value).toLocaleString("en-IN"), name]} contentStyle={{ border: "1px solid #dcebe2", borderRadius: 12, boxShadow: "0 12px 28px rgba(18,54,32,.1)" }} /><Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 800 }} /><Bar yAxisId="bookings" dataKey="bookings" name="Bookings" fill="#a8e0bc" radius={[6, 6, 0, 0]} maxBarSize={28} /><Line yAxisId="revenue" dataKey="revenue" name="Revenue" type="monotone" stroke="#159957" strokeWidth={3} dot={{ r: 3, fill: "#fff", strokeWidth: 2 }} /></ComposedChart></ResponsiveContainer>
      </div>
    </section>
  );
}

export default MovieVendorDashboard;
