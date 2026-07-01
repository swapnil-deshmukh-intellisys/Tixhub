import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  ClipboardList,
  Clock3,
  DoorClosed,
  DoorOpen,
  Hotel,
  IndianRupee,
  LayoutDashboard,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Search,
  Star,
  XCircle,
} from "lucide-react";
import {
  filesToImages,
  hotelImage,
  hotelRequest,
  money,
  shortDate,
} from "../../services/hotelApi";
import { HotelForm } from "./AddHotel";
import "./MovieVendorDashboard.css";
import "./HotelVendor.css";

const tabs = [
  ["overview", "Dashboard Overview", LayoutDashboard],
  ["bookings", "Bookings", ClipboardList],
  ["rooms", "Room Management", BedDouble],
  ["pricing", "Pricing", IndianRupee],
  ["inventory", "Inventory Calendar", CalendarDays],
  ["reviews", "Reviews", Star],
  ["reports", "Reports", BarChart3],
  ["edit", "Edit Hotel", Pencil],
];

const dashboardCards = [
  ["Total Hotels", "total_hotels", Hotel, "green"],
  ["Active Hotels", "active_hotels", CheckCircle2, "green"],
  ["Total Rooms", "total_rooms", BedDouble, "violet"],
  ["Available Rooms", "available_rooms", DoorOpen, "green"],
  ["Booked Rooms", "booked_rooms", DoorClosed, "blue"],
  ["Blocked Rooms", "blocked_rooms", XCircle, "red"],
  ["Today Check-ins", "today_check_ins", LogIn, "green"],
  ["Today Check-outs", "today_check_outs", LogOut, "violet"],
  ["Total Bookings", "total_bookings", ClipboardList, "blue"],
  ["Revenue", "revenue", CircleDollarSign, "violet", "money"],
  ["Pending Refunds", "pending_refunds", Clock3, "red"],
  ["Occupancy Rate", "occupancy_rate", BarChart3, "green", "percent"],
];

const managementModules = [
  ["overview", "Hotel Listings", Building2],
  ["rooms", "Room Management", BedDouble],
  ["pricing", "Pricing Management", IndianRupee],
  ["inventory", "Inventory Calendar", CalendarDays],
  ["bookings", "Bookings", ClipboardList],
  ["reviews", "Reviews", Star],
  ["reports", "Reports", BarChart3],
  ["edit", "Edit Hotel", Pencil],
];

const trendRanges = ["day", "week", "month", "year", "all"];
const demoHotelTrends = {
  day: [
    { label: "8 AM", bookings: 3, revenue: 9600 },
    { label: "11 AM", bookings: 7, revenue: 22400 },
    { label: "2 PM", bookings: 12, revenue: 40800 },
    { label: "5 PM", bookings: 9, revenue: 31500 },
    { label: "8 PM", bookings: 14, revenue: 50400 },
  ],
  week: [
    { label: "Mon", bookings: 28, revenue: 98000 },
    { label: "Tue", bookings: 36, revenue: 126000 },
    { label: "Wed", bookings: 31, revenue: 111000 },
    { label: "Thu", bookings: 47, revenue: 168000 },
    { label: "Fri", bookings: 55, revenue: 209000 },
    { label: "Sat", bookings: 72, revenue: 288000 },
    { label: "Sun", bookings: 63, revenue: 245000 },
  ],
  month: [
    { label: "Week 1", bookings: 142, revenue: 512000 },
    { label: "Week 2", bookings: 178, revenue: 641000 },
    { label: "Week 3", bookings: 164, revenue: 590000 },
    { label: "Week 4", bookings: 211, revenue: 785000 },
  ],
  year: [
    { label: "Jan", bookings: 410, revenue: 1460000 },
    { label: "Feb", bookings: 452, revenue: 1610000 },
    { label: "Mar", bookings: 515, revenue: 1840000 },
    { label: "Apr", bookings: 488, revenue: 1740000 },
    { label: "May", bookings: 576, revenue: 2090000 },
    { label: "Jun", bookings: 624, revenue: 2280000 },
  ],
  all: [
    { label: "2022", bookings: 2780, revenue: 9400000 },
    { label: "2023", bookings: 3860, revenue: 13500000 },
    { label: "2024", bookings: 5210, revenue: 18800000 },
    { label: "2025", bookings: 6720, revenue: 24600000 },
    { label: "2026", bookings: 7310, revenue: 27100000 },
  ],
};

const normalizeTrendRows = (payload, range) => {
  const rows = Array.isArray(payload)
    ? payload
    : payload?.trends || payload?.data || [];
  if (!rows.length) return demoHotelTrends[range];
  return rows.map((row, index) => ({
    label: row.label || row.period || row.date || `Point ${index + 1}`,
    bookings: Number(row.bookings || row.count || 0),
    revenue: Number(row.revenue || row.amount || 0),
  }));
};

const defaultRatePlan = (room) => {
  const base = Number(room?.basePrice ?? room?.base_price ?? 0);
  return {
    weekday: base,
    weekend: Math.round(base * 1.15),
    seasonal: Math.round(base * 1.3),
    seasonalStart: "",
    seasonalEnd: "",
  };
};

const getRatePlan = (room) => {
  if (!room?.id) return defaultRatePlan(room);
  try {
    const saved = JSON.parse(
      localStorage.getItem(`tixhubHotelRate:${room.id}`) || "null",
    );
    return saved ? { ...defaultRatePlan(room), ...saved } : defaultRatePlan(room);
  } catch {
    return defaultRatePlan(room);
  }
};

const saveRatePlan = (roomId, plan) => {
  localStorage.setItem(`tixhubHotelRate:${roomId}`, JSON.stringify(plan));
};

const getStoredVendor = () => {
  try {
    return JSON.parse(
      localStorage.getItem("ticketproUser") ||
        sessionStorage.getItem("ticketproUser") ||
        "{}",
    );
  } catch {
    return {};
  }
};

const roomAmenities = [
  "WiFi",
  "Air Conditioning",
  "TV",
  "Mini Bar",
  "Balcony",
  "Bathtub",
  "Work Desk",
  "Breakfast",
];

const createEmptyRoom = () => ({
  name: "",
  roomType: "Deluxe",
  description: "",
  maxAdults: 2,
  maxChildren: 1,
  bedType: "King",
  roomSize: "",
  totalRooms: 1,
  basePrice: "",
  taxPercent: 12,
  amenities: [],
  refundable: true,
  mealPlan: "Room only",
  status: "active",
  images: [],
});

const createEmptyCoupon = () => ({
  hotelId: "",
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  minBookingAmount: 0,
  maxDiscount: "",
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: "",
  usageLimit: "",
  status: "active",
});

export default function HotelVendorDashboard() {
  const navigate = useNavigate();
  const vendor = useMemo(() => getStoredVendor(), []);
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [hotels, setHotels] = useState([]);
  const [overviewBookings, setOverviewBookings] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [headerMenu, setHeaderMenu] = useState("");
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHotels = useCallback(async ({ includeStats = true } = {}) => {
    setLoading(true);
    setError("");
    try {
      const [hotelsResponse, statsResponse, bookingsResponse] = await Promise.all([
        hotelRequest("/vendor/hotels"),
        includeStats
          ? hotelRequest("/vendor/hotel/dashboard")
          : Promise.resolve(null),
        hotelRequest("/vendor/hotel/bookings"),
      ]);
      if (statsResponse) setStats(statsResponse);
      setHotels(hotelsResponse);
      setOverviewBookings(bookingsResponse);
      setSelectedHotelId((current) =>
        hotelsResponse.some((hotel) => hotel.id === current)
          ? current
          : hotelsResponse[0]?.id || "",
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const vendorName =
    vendor.name || vendor.businessName || vendor.companyName || "Vendor";
  const vendorInitials =
    vendorName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "HV";

  const visibleHotels = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return hotels;
    return hotels.filter((hotel) =>
      [hotel.name, hotel.city, hotel.address, hotel.hotel_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [hotels, searchText]);

  const openHotelSection = (tab, hotelId) => {
    if (hotelId) setSelectedHotelId(hotelId);
    setActiveTab(tab);
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const renderSection = () => {
    if (activeTab === "bookings") {
      return <BookingsSection globalSearch={searchText} />;
    }
    if (activeTab === "rooms") {
      return (
        <RoomManagementSection
          hotels={hotels}
          hotelId={selectedHotelId}
          setHotelId={setSelectedHotelId}
          refreshHotels={() => loadHotels({ includeStats: false })}
        />
      );
    }
    if (activeTab === "pricing") {
      return (
        <PricingSection
          hotels={hotels}
          hotelId={selectedHotelId}
          setHotelId={setSelectedHotelId}
          openInventory={() => setActiveTab("inventory")}
        />
      );
    }
    if (activeTab === "inventory") {
      return (
        <InventorySection
          hotels={hotels}
          hotelId={selectedHotelId}
          setHotelId={setSelectedHotelId}
        />
      );
    }
    if (activeTab === "reviews") return <ReviewsSection />;
    if (activeTab === "reports") return <ReportsSection />;
    if (activeTab === "edit") {
      return (
        <EditHotelSection
          hotels={hotels}
          hotelId={selectedHotelId}
          setHotelId={setSelectedHotelId}
          onSaved={() => loadHotels()}
        />
      );
    }
    return (
      <OverviewSection
        stats={stats}
        hotels={visibleHotels}
        loading={loading}
        error={error}
        bookings={overviewBookings}
        reload={() => loadHotels()}
        openSection={openHotelSection}
      />
    );
  };

  return (
    <div className="mvd-shell">
      <aside className="mvd-sidebar">
        <div className="mvd-brand">
          <span>
            <Clapperboard size={20} />
          </span>
          <strong>TixHub</strong>
        </div>
        <div className="mvd-service-switch">
          <button className="active" type="button">
            Hotel Panel
          </button>
          <button
            type="button"
            onClick={() => navigate("/vendor-dashboard")}
          >
            All Services
          </button>
        </div>
        <nav className="mvd-nav">
          <section>
            <p>Hotel Management</p>
            {tabs.map(([key, label, Icon]) => (
              <button
                className={activeTab === key ? "active" : ""}
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
              >
                <Icon size={17} /> {label}
              </button>
            ))}
          </section>
        </nav>
        <button
          className="mvd-profile-card"
          type="button"
          onClick={() => navigate("/vendor/profile")}
        >
          <span className="mvd-avatar">{vendorInitials}</span>
          <span>
            <strong>{vendorName}</strong>
            <small>Hotel Vendor</small>
          </span>
          <ChevronRight size={15} />
        </button>
      </aside>

      <main className="mvd-main">
        <header className="mvd-topbar">
          <label className="mvd-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search hotels, rooms or bookings"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>
          <div className="mvd-top-actions">
            <button
              className="mvd-icon-button notify"
              type="button"
              aria-label="Notifications"
              onClick={() =>
                setHeaderMenu((current) =>
                  current === "notifications" ? "" : "notifications",
                )
              }
            >
              <Bell size={19} />
              <i />
            </button>
            <button
              className="mvd-profile-pill"
              type="button"
              onClick={() =>
                setHeaderMenu((current) =>
                  current === "profile" ? "" : "profile",
                )
              }
            >
              <span className="mvd-avatar small">{vendorInitials}</span>
              <span>
                <strong>{vendorName}</strong>
                <small>Hotel Vendor</small>
              </span>
              <ChevronRight size={15} />
            </button>

            {headerMenu === "notifications" && (
              <div className="hvd-header-popover notifications">
                <strong>Hotel notifications</strong>
                <p>Your latest booking activity is available in Bookings.</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("bookings");
                    setHeaderMenu("");
                  }}
                >
                  View bookings
                </button>
              </div>
            )}
            {headerMenu === "profile" && (
              <div className="hvd-header-popover profile">
                <strong>{vendorName}</strong>
                <small>Hotel Vendor</small>
                <button type="button" onClick={() => navigate("/vendor/profile")}>
                  Vendor profile
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/vendor-dashboard")}
                >
                  All services
                </button>
                <button type="button" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="hv-page mvd-content hvd-content">
          <section className="mvd-welcome">
            <div>
              <small>Hotel Vendor Panel</small>
              <h1>Welcome, {vendorName}</h1>
              <p>Manage hotels, rooms, pricing, inventory and bookings.</p>
            </div>
            <div className="mvd-welcome-actions">
              <div className="mvd-live-time">
                <CalendarDays size={19} />
                <span>
                  <strong>
                    {now.toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </strong>
                  <small>
                    {now.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </small>
                </span>
              </div>
              <button
                className="mvd-top-add"
                type="button"
                onClick={() => navigate("/vendor/hotel/add")}
              >
                <Plus size={17} /> Add Hotel
              </button>
            </div>
          </section>

          <div
            className="hv-tabs hvd-tabs"
            role="tablist"
            aria-label="Hotel management"
          >
            {tabs.map(([key, label, Icon]) => (
              <button
                className={`hv-btn ${activeTab === key ? "" : "secondary"}`}
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {activeTab !== "overview" && error && (
            <div className="hv-error">{error}</div>
          )}
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

function OverviewSection({
  stats,
  hotels,
  bookings,
  loading,
  error,
  reload,
  openSection,
}) {
  const navigate = useNavigate();
  const today = new Date();
  const [trendRange, setTrendRange] = useState("week");
  const [trendData, setTrendData] = useState(demoHotelTrends.week);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendMessage, setTrendMessage] = useState("");
  const [rooms, setRooms] = useState([]);
  const [rateMode, setRateMode] = useState("weekend");

  useEffect(() => {
    let active = true;
    setTrendLoading(true);
    setTrendMessage("");

    const loadTrends = async () => {
      try {
        if (trendRange === "all") {
          if (active) setTrendData(demoHotelTrends.all);
          return;
        }
        const response = await hotelRequest(
          `/vendor/hotel/booking-trends?range=${trendRange}`,
        );
        if (active) setTrendData(normalizeTrendRows(response, trendRange));
      } catch {
        if (active) {
          setTrendData(demoHotelTrends[trendRange]);
          setTrendMessage("Live trends unavailable — showing demo data.");
        }
      } finally {
        if (active) setTrendLoading(false);
      }
    };

    loadTrends();
    return () => {
      active = false;
    };
  }, [trendRange]);

  useEffect(() => {
    let active = true;
    if (!hotels[0]?.id) {
      setRooms([]);
      return () => {
        active = false;
      };
    }
    hotelRequest(`/vendor/hotels/${hotels[0].id}/rooms`)
      .then((response) => {
        if (active) setRooms(response);
      })
      .catch(() => {
        if (active) setRooms([]);
      });
    return () => {
      active = false;
    };
  }, [hotels]);

  const bookingStatus = bookings.reduce(
    (result, booking) => {
      const status = String(
        booking.bookingStatus || booking.booking_status || "pending",
      ).toLowerCase();
      if (status === "confirmed" || status === "checked_in") {
        result.confirmed += 1;
      } else if (status === "checked_out" || status === "completed") {
        result.completed += 1;
      } else if (status === "cancelled" || status === "refunded") {
        result.cancelled += 1;
      } else {
        result.pending += 1;
      }
      return result;
    },
    { confirmed: 0, pending: 0, cancelled: 0, completed: 0 },
  );

  const statusCards = [
    ["Confirmed", bookingStatus.confirmed, "confirmed"],
    ["Pending", bookingStatus.pending, "pending"],
    ["Cancelled", bookingStatus.cancelled, "cancelled"],
    ["Completed", bookingStatus.completed, "completed"],
  ];

  const upcomingBookings = [...bookings]
    .filter((booking) => {
      const date = String(booking.check_in_date || "").slice(0, 10);
      const status = String(
        booking.bookingStatus || booking.booking_status || "",
      ).toLowerCase();
      return date >= today.toISOString().slice(0, 10) &&
        !["cancelled", "refunded"].includes(status);
    })
    .sort(
      (first, second) =>
        new Date(first.check_in_date) - new Date(second.check_in_date),
    );

  const calendarPlan = getRatePlan(rooms[0]);
  const calendarRates = [
    ["Friday", rateMode === "weekend" ? calendarPlan.weekend : calendarPlan.weekday],
    ["Saturday", rateMode === "weekend" ? calendarPlan.weekend : calendarPlan.weekday],
    ["Sunday", rateMode === "weekend" ? calendarPlan.weekend : calendarPlan.weekday],
  ];

  const quickActions = [
    ["Add Hotel", "add", Plus],
    ["My Hotels", "overview", Building2],
    ["Manage Bookings", "bookings", ClipboardList],
    ["Room Management", "rooms", BedDouble],
    ["Pricing Management", "pricing", IndianRupee],
    ["Inventory Calendar", "inventory", CalendarDays],
    ["Reviews", "reviews", Star],
    ["Reports", "reports", BarChart3],
  ];

  const runQuickAction = (tab) => {
    if (tab === "add") navigate("/vendor/hotel/add");
    else openSection(tab);
  };

  const changeStatus = async (hotel, nextStatus) => {
    try {
      await hotelRequest(`/vendor/hotels/${hotel.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      reload();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  const remove = async (hotel) => {
    if (!confirm(`Hide ${hotel.name}? Existing bookings will be preserved.`)) {
      return;
    }
    try {
      await hotelRequest(`/vendor/hotels/${hotel.id}`, { method: "DELETE" });
      reload();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="mvd-alert">Loading live hotel data...</div>
      ) : error ? (
        <div className="mvd-alert warning">
          {error}
          <button type="button" onClick={reload}>
            Retry
          </button>
        </div>
      ) : (
        <section className="mvd-two-column hvd-overview-layout">
          <div className="mvd-left-column">
            <section className="mvd-metric-grid hvd-metric-grid">
              {dashboardCards.map(
                ([label, key, Icon, color, format]) => (
                  <article className="mvd-metric-card" key={key}>
                    <span className={`mvd-metric-icon ${color}`}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <small>{label}</small>
                      <strong>
                        {format === "money"
                          ? money(stats[key])
                          : format === "percent"
                            ? `${stats[key] || 0}%`
                            : stats[key] || 0}
                      </strong>
                    </div>
                  </article>
                ),
              )}
            </section>

            <section className="mvd-status-grid">
              {statusCards.map(([label, value, status]) => (
                <article
                  className={`mvd-status-card-small ${status}`}
                  key={label}
                >
                  <i />
                  <span>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </span>
                </article>
              ))}
            </section>

            <section className="mvd-card mvd-production-card">
              <div className="mvd-card-title">
                <div>
                  <h2>Hotel Production & Management Module</h2>
                  <p>Manage properties, rooms, rates, guests and operations.</p>
                </div>
                <span>Hotel</span>
              </div>
              <div className="mvd-production-grid hvd-module-grid">
                {managementModules.map(([tab, label, Icon]) => (
                  <button
                    type="button"
                    onClick={() => openSection(tab)}
                    key={label}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="hvd-insight-grid">
              <BookingTrendCard
                data={trendData}
                range={trendRange}
                setRange={setTrendRange}
                loading={trendLoading}
                message={trendMessage}
              />

              <section className="mvd-card mvd-quick-card">
                <div className="mvd-card-title">
                  <h2>Quick Actions</h2>
                  <span>Tools</span>
                </div>
                <div className="mvd-quick-grid">
                  {quickActions.map(([label, tab, Icon]) => (
                    <button
                      type="button"
                      onClick={() => runQuickAction(tab)}
                      key={label}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <section className="mvd-card hvd-room-pricing-card">
              <div className="mvd-card-title">
                <div>
                  <h2>Room-wise Pricing</h2>
                  <p>Compare weekday and weekend prices for every room type.</p>
                </div>
                <span>Live Rates</span>
              </div>
              {!rooms.length ? (
                <p className="mvd-empty">
                  Add room types to configure weekday and weekend pricing.
                </p>
              ) : (
                <div className="hv-table-wrap">
                  <table className="hv-table hvd-pricing-table">
                    <thead>
                      <tr>
                        <th>Room Type</th>
                        <th>Price Weekdays</th>
                        <th>Price Weekends</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => {
                        const plan = getRatePlan(room);
                        return (
                          <tr key={room.id}>
                            <td>
                              <strong>{room.name || room.room_type}</strong>
                            </td>
                            <td>{money(plan.weekday)}</td>
                            <td>{money(plan.weekend)}</td>
                            <td>
                              <button
                                className="hvd-table-edit"
                                type="button"
                                onClick={() =>
                                  openSection("pricing", room.hotel_id)
                                }
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mvd-card hvd-listings-card">
              <div className="mvd-card-title">
                <div>
                  <h2>Hotel Listings</h2>
                  <p>Manage live properties and their selling status.</p>
                </div>
                <span>{hotels.length} Hotels</span>
              </div>
              {!hotels.length ? (
                <p className="mvd-empty">
                  No hotels yet. Add your first property to start selling rooms.
                </p>
              ) : (
                <div className="hv-table-wrap">
                  <table className="hv-table">
                    <thead>
                      <tr>
                        <th>Hotel</th>
                        <th>Location</th>
                        <th>Rooms</th>
                        <th>From</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotels.map((hotel) => (
                        <tr key={hotel.id}>
                          <td>
                            <div className="hvd-hotel-name">
                              <img
                                className="hv-thumb"
                                src={hotelImage(hotel)}
                                alt=""
                              />
                              <strong>{hotel.name}</strong>
                            </div>
                          </td>
                          <td>{hotel.city}</td>
                          <td>{hotel.totalRooms}</td>
                          <td>{money(hotel.minPrice)}</td>
                          <td>
                            <span className={`hv-status ${hotel.status}`}>
                              {hotel.status}
                            </span>
                          </td>
                          <td>
                            <div className="hv-actions">
                              <button
                                className="hv-btn secondary"
                                type="button"
                                onClick={() => openSection("rooms", hotel.id)}
                              >
                                Rooms
                              </button>
                              <button
                                className="hv-btn ghost"
                                type="button"
                                onClick={() => openSection("edit", hotel.id)}
                              >
                                Edit
                              </button>
                              <button
                                className="hv-btn ghost"
                                type="button"
                                onClick={() =>
                                  changeStatus(
                                    hotel,
                                    hotel.status === "active"
                                      ? "inactive"
                                      : "active",
                                  )
                                }
                              >
                                {hotel.status === "active"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                              <button
                                className="hv-btn danger"
                                type="button"
                                onClick={() => remove(hotel)}
                              >
                                Hide
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="mvd-right-column">
            <section className="mvd-card mvd-calendar-card">
              <div className="mvd-card-title">
                <h2>Hotel Booking Calendar</h2>
                <span>Today</span>
              </div>
              <div className="mvd-today">
                <span>
                  {today
                    .toLocaleDateString("en-IN", { month: "short" })
                    .toUpperCase()}
                </span>
                <strong>{today.getDate()}</strong>
                <small>
                  {today.toLocaleDateString("en-IN", { weekday: "long" })}
                </small>
              </div>

              <div className="hvd-rate-toggle">
                {["weekday", "weekend"].map((mode) => (
                  <button
                    className={rateMode === mode ? "active" : ""}
                    type="button"
                    key={mode}
                    onClick={() => setRateMode(mode)}
                  >
                    {mode === "weekday" ? "Weekdays" : "Weekends"}
                  </button>
                ))}
              </div>

              <div className="hvd-calendar-rates">
                {calendarRates.map(([day, price]) => (
                  <div key={day}>
                    <span>
                      <CalendarDays size={14} /> {day}
                    </span>
                    <strong>Price: {money(price)}</strong>
                  </div>
                ))}
              </div>

              <div className="mvd-upcoming hvd-upcoming-list">
                <div className="mvd-subtitle">
                  <h3>Upcoming hotel bookings</h3>
                  <span>{upcomingBookings.length}</span>
                </div>
                {upcomingBookings.slice(0, 5).map((booking) => {
                  const guestCount =
                    Number(booking.adult_count || 0) +
                      Number(booking.child_count || 0) ||
                    booking.guests?.length ||
                    1;
                  const bookingState = String(
                    booking.bookingStatus || booking.booking_status || "pending",
                  ).toLowerCase();
                  return (
                    <article key={booking.id}>
                      <img
                        src={hotelImage({ hotel_image: booking.hotel_image })}
                        alt=""
                      />
                      <div>
                        <strong>{booking.hotel_name || "Hotel booking"}</strong>
                        <small>
                          {booking.room_name || "Room"} · {guestCount} Guest
                          {guestCount === 1 ? "" : "s"}
                        </small>
                        <small>
                          {booking.guest_name || "Guest"} ·{" "}
                          {shortDate(booking.check_in_date)}
                        </small>
                      </div>
                      <span className={`hvd-booking-status ${bookingState}`}>
                        {bookingState.replaceAll("_", " ")}
                      </span>
                    </article>
                  );
                })}
                {!upcomingBookings.length && (
                  <p className="mvd-empty">No upcoming check-ins available.</p>
                )}
              </div>

              <button
                className="mvd-primary-button full"
                type="button"
                onClick={() => openSection("bookings")}
              >
                <ClipboardList size={17} /> View All Bookings
              </button>
            </section>
          </aside>
        </section>
      )}
    </div>
  );
}

function BookingTrendCard({ data, range, setRange, loading, message }) {
  return (
    <section className="mvd-card mvd-trend-card hvd-trend-card">
      <div className="mvd-trend-header">
        <div>
          <h2>Booking Trend</h2>
          <p>Booking count and revenue</p>
        </div>
        <div className="mvd-trend-filters">
          {trendRanges.map((item) => (
            <button
              className={range === item ? "active" : ""}
              type="button"
              onClick={() => setRange(item)}
              key={item}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {loading && <p className="mvd-chart-message">Loading trends...</p>}
      {message && !loading && (
        <p className="mvd-chart-message warning">{message}</p>
      )}
      <div className="mvd-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke="#e8f0eb"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#718078", fontSize: 10, fontWeight: 700 }}
            />
            <YAxis
              yAxisId="bookings"
              width={32}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#718078", fontSize: 9 }}
            />
            <YAxis
              yAxisId="revenue"
              width={46}
              orientation="right"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                value >= 100000
                  ? `${Math.round(value / 100000)}L`
                  : value >= 1000
                    ? `${Math.round(value / 1000)}K`
                    : value
              }
              tick={{ fill: "#718078", fontSize: 9 }}
            />
            <Tooltip
              formatter={(value, name) => [
                name === "Revenue" ? money(value) : Number(value).toLocaleString("en-IN"),
                name,
              ]}
              contentStyle={{
                border: "1px solid #dcebe2",
                borderRadius: 12,
                boxShadow: "0 12px 28px rgba(18,54,32,.1)",
              }}
            />
            <Legend iconSize={8} iconType="circle" />
            <Bar
              yAxisId="bookings"
              dataKey="bookings"
              name="Bookings"
              fill="#a8e0bc"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Line
              yAxisId="revenue"
              dataKey="revenue"
              name="Revenue"
              type="monotone"
              stroke="#159957"
              strokeWidth={3}
              dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function BookingsSection({ globalSearch = "" }) {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scanner, setScanner] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    hotelRequest(
      `/vendor/hotel/bookings${status ? `?status=${status}` : ""}`,
    )
      .then(setBookings)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const filteredBookings = useMemo(() => {
    const query = (search || globalSearch).trim().toLowerCase();
    if (!query) return bookings;
    return bookings.filter((booking) =>
      [
        booking.bookingCode,
        booking.hotel_name,
        booking.guest_name,
        booking.guest_phone,
        booking.room_name,
        booking.bookingStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [bookings, globalSearch, search]);

  const updateStatus = async (booking, nextStatus) => {
    const reason =
      nextStatus === "cancelled"
        ? prompt("Reason for cancellation:") || "Vendor cancellation"
        : "";
    try {
      await hotelRequest(`/vendor/hotel/bookings/${booking.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      load();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  const refund = async (booking) => {
    const amount = prompt("Refund amount:", booking.totalAmount);
    if (amount === null) return;
    try {
      await hotelRequest(`/vendor/hotel/bookings/${booking.id}/refund`, {
        method: "PUT",
        body: JSON.stringify({
          amount,
          reason: "Vendor approved refund",
        }),
      });
      load();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  const checkIn = async (token) => {
    try {
      const result = await hotelRequest(
        "/vendor/hotel/bookings/scan/check-in",
        {
          method: "PUT",
          body: JSON.stringify({ qrToken: token }),
        },
      );
      alert(result.message);
      setScanner(false);
      load();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Hotel bookings"
        description="Confirm stays, handle cancellations/refunds, and check guests in."
        actions={
          <>
            <label className="hvd-inline-search">
              <Search size={15} />
              <input
                type="search"
                placeholder="Search bookings"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select
              className="hotel-input"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {[
                "pending",
                "confirmed",
                "cancel_requested",
                "cancelled",
                "checked_in",
                "checked_out",
                "refunded",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button
              className="hv-btn"
              type="button"
              onClick={() => setScanner(true)}
            >
              QR check-in
            </button>
          </>
        }
      />

      {loading ? (
        <div className="hv-loading">Loading bookings...</div>
      ) : error ? (
        <div className="hv-error">{error}</div>
      ) : !filteredBookings.length ? (
        <div className="hv-empty">No bookings match this filter.</div>
      ) : (
        <section className="hv-panel hv-table-wrap">
          <table className="hv-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Guest</th>
                <th>Stay</th>
                <th>Room</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <strong>{booking.bookingCode}</strong>
                    <br />
                    <small>{booking.hotel_name}</small>
                  </td>
                  <td>
                    {booking.guest_name}
                    <br />
                    <small>{booking.guest_phone}</small>
                  </td>
                  <td>
                    {shortDate(booking.check_in_date)}
                    <br />to {shortDate(booking.check_out_date)}
                  </td>
                  <td>
                    {booking.room_name} × {booking.room_count}
                  </td>
                  <td>
                    {money(booking.totalAmount)}
                    <br />
                    <span className={`hv-status ${booking.paymentStatus}`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`hv-status ${booking.bookingStatus}`}>
                      {booking.bookingStatus}
                    </span>
                  </td>
                  <td>
                    <div className="hv-actions">
                      {["pending", "cancel_requested"].includes(
                        booking.bookingStatus,
                      ) && (
                        <button
                          className="hv-btn secondary"
                          type="button"
                          onClick={() => updateStatus(booking, "confirmed")}
                        >
                          Confirm
                        </button>
                      )}
                      {booking.bookingStatus === "confirmed" && (
                        <button
                          className="hv-btn"
                          type="button"
                          onClick={() => checkIn(booking.qrToken)}
                        >
                          Check in
                        </button>
                      )}
                      {booking.bookingStatus === "checked_in" && (
                        <button
                          className="hv-btn secondary"
                          type="button"
                          onClick={() => updateStatus(booking, "checked_out")}
                        >
                          Complete
                        </button>
                      )}
                      {!["cancelled", "refunded", "checked_out"].includes(
                        booking.bookingStatus,
                      ) && (
                        <button
                          className="hv-btn danger"
                          type="button"
                          onClick={() => updateStatus(booking, "cancelled")}
                        >
                          Cancel
                        </button>
                      )}
                      {["cancelled", "cancel_requested"].includes(
                        booking.bookingStatus,
                      ) &&
                        booking.paymentStatus === "success" && (
                          <button
                            className="hv-btn ghost"
                            type="button"
                            onClick={() => refund(booking)}
                          >
                            Refund
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {scanner && (
        <ScanModal onClose={() => setScanner(false)} onScan={checkIn} />
      )}
    </div>
  );
}

function RoomManagementSection({
  hotels,
  hotelId,
  setHotelId,
  refreshHotels,
}) {
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(createEmptyRoom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!hotelId) {
      setHotel(null);
      setRooms([]);
      setInventory([]);
      return;
    }
    setLoading(true);
    setError("");
    const today = new Date();
    Promise.all([
      hotelRequest(`/vendor/hotels/${hotelId}`),
      hotelRequest(`/vendor/hotels/${hotelId}/rooms`),
      hotelRequest(
        `/vendor/hotel/calendar?hotelId=${hotelId}&month=${today.getMonth() + 1}&year=${today.getFullYear()}`,
      ),
    ])
      .then(([hotelResponse, roomResponse, inventoryResponse]) => {
        setHotel(hotelResponse);
        setRooms(roomResponse);
        setInventory(inventoryResponse.entries || []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [hotelId]);

  const openRoomForm = (room) => {
    setEditing(room?.id || "new");
    setForm(
      room
        ? {
            ...createEmptyRoom(),
            ...room,
            roomType: room.room_type,
            basePrice: room.base_price,
            taxPercent: room.tax_percent,
            maxAdults: room.max_adults,
            maxChildren: room.max_children,
            totalRooms: room.total_rooms,
            bedType: room.bed_type,
            roomSize: room.room_size,
            mealPlan: room.meal_plan,
          }
        : createEmptyRoom(),
    );
  };

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const uploadRoomImages = async (event) => {
    updateForm("images", [
      ...form.images,
      ...(await filesToImages(event.target.files)),
    ]);
  };

  const saveRoom = async (event) => {
    event.preventDefault();
    try {
      await hotelRequest(
        editing === "new"
          ? `/vendor/hotels/${hotelId}/rooms`
          : `/vendor/rooms/${editing}`,
        {
          method: editing === "new" ? "POST" : "PUT",
          body: JSON.stringify(form),
        },
      );
      setEditing(null);
      load();
      refreshHotels();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  const roomAction = async (room, method, nextStatus) => {
    if (method === "DELETE" && !confirm(`Hide ${room.name}?`)) return;
    try {
      await hotelRequest(
        `/vendor/rooms/${room.id}${method === "PATCH" ? "/status" : ""}`,
        {
          method,
          body:
            method === "PATCH"
              ? JSON.stringify({ status: nextStatus })
              : undefined,
        },
      );
      load();
      refreshHotels();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  const blockRoom = async (room) => {
    const quantity = prompt("How many rooms should be blocked?", "1");
    if (quantity === null) return;
    const date = new Date().toISOString().slice(0, 10);
    try {
      await hotelRequest("/vendor/hotel/rooms/block", {
        method: "PUT",
        body: JSON.stringify({
          roomId: room.id,
          startDate: date,
          endDate: date,
          quantity: Number(quantity) || 1,
        }),
      });
      load();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  const inventoryFor = (room) => {
    const today = new Date().toISOString().slice(0, 10);
    return (
      inventory.find(
        (entry) =>
          entry.room_id === room.id &&
          String(entry.inventory_date).slice(0, 10) === today,
      ) || {
        available_rooms: room.totalRooms,
        booked_rooms: 0,
        blocked_rooms: 0,
      }
    );
  };

  return (
    <div>
      <SectionHeader
        title="Room management"
        description={hotel?.name || "Add, edit, and control hotel room types."}
        actions={
          <button
            className="hv-btn"
            type="button"
            disabled={!hotelId}
            onClick={() => openRoomForm(null)}
          >
            Add room
          </button>
        }
      />

      <HotelPicker
        hotels={hotels}
        value={hotelId}
        onChange={setHotelId}
        label="Manage rooms for"
      />

      {loading ? (
        <div className="hv-loading">Loading rooms...</div>
      ) : error ? (
        <div className="hv-error">{error}</div>
      ) : !hotelId ? (
        <div className="hv-empty">Add a hotel before managing rooms.</div>
      ) : (
        <section className="hv-panel">
          {!rooms.length ? (
            <div className="hv-empty">
              No rooms configured. Add a room type to make this hotel bookable.
            </div>
          ) : (
            <div className="hv-table-wrap">
              <table className="hv-table">
                <thead>
                  <tr>
                    <th>Room Type</th>
                    <th>Total Rooms</th>
                    <th>Available</th>
                    <th>Booked</th>
                    <th>Blocked</th>
                    <th>Base price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td>
                        <strong>{room.name}</strong>
                        <br />
                        <small>
                          {room.room_type} · {room.bed_type}
                        </small>
                      </td>
                      <td>{room.totalRooms}</td>
                      <td>{inventoryFor(room).available_rooms}</td>
                      <td>{inventoryFor(room).booked_rooms}</td>
                      <td>{inventoryFor(room).blocked_rooms}</td>
                      <td>{money(room.basePrice)}</td>
                      <td>
                        <div className="hv-actions">
                          <button
                            className="hv-btn secondary"
                            type="button"
                            onClick={() => openRoomForm(room)}
                          >
                            Edit
                          </button>
                          <button
                            className="hv-btn ghost"
                            type="button"
                            onClick={() =>
                              roomAction(
                                room,
                                "PATCH",
                                room.status === "active"
                                  ? "inactive"
                                  : "active",
                              )
                            }
                          >
                            {room.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="hv-btn ghost"
                            type="button"
                            onClick={() => blockRoom(room)}
                          >
                            Block
                          </button>
                          <button
                            className="hv-btn danger"
                            type="button"
                            onClick={() => roomAction(room, "DELETE")}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {editing && (
        <div className="hv-modal-backdrop">
          <form className="hv-modal hv-form" onSubmit={saveRoom}>
            <div className="hv-toolbar">
              <h2>{editing === "new" ? "Add room" : "Edit room"}</h2>
              <button
                type="button"
                className="hv-btn ghost"
                onClick={() => setEditing(null)}
              >
                Close
              </button>
            </div>
            <div className="hv-grid">
              <SectionField
                label="Room name"
                value={form.name}
                onChange={(value) => updateForm("name", value)}
                required
              />
              <SectionField
                label="Room type"
                value={form.roomType}
                onChange={(value) => updateForm("roomType", value)}
                required
              />
              <SectionField
                label="Base price / night"
                type="number"
                value={form.basePrice}
                onChange={(value) => updateForm("basePrice", value)}
                required
              />
              <SectionField
                label="Total rooms"
                type="number"
                min="1"
                value={form.totalRooms}
                onChange={(value) => updateForm("totalRooms", value)}
                required
              />
              <SectionField
                label="Max adults"
                type="number"
                min="1"
                value={form.maxAdults}
                onChange={(value) => updateForm("maxAdults", value)}
              />
              <SectionField
                label="Max children"
                type="number"
                min="0"
                value={form.maxChildren}
                onChange={(value) => updateForm("maxChildren", value)}
              />
              <SectionField
                label="Bed type"
                value={form.bedType}
                onChange={(value) => updateForm("bedType", value)}
              />
              <SectionField
                label="Room size"
                value={form.roomSize}
                onChange={(value) => updateForm("roomSize", value)}
                placeholder="320 sq ft"
              />
              <SectionField
                label="Tax %"
                type="number"
                value={form.taxPercent}
                onChange={(value) => updateForm("taxPercent", value)}
              />
              <SectionField
                label="Meal plan"
                value={form.mealPlan}
                onChange={(value) => updateForm("mealPlan", value)}
              />
              <SectionField
                className="hv-wide"
                textarea
                label="Description"
                value={form.description}
                onChange={(value) => updateForm("description", value)}
              />
            </div>

            <div className="hv-chips">
              {roomAmenities.map((amenity) => (
                <label className="hv-chip" key={amenity}>
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(amenity)}
                    onChange={() =>
                      updateForm(
                        "amenities",
                        form.amenities.includes(amenity)
                          ? form.amenities.filter((item) => item !== amenity)
                          : [...form.amenities, amenity],
                      )
                    }
                  />
                  {amenity}
                </label>
              ))}
            </div>

            <label className="hv-field">
              <span>Room images</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={uploadRoomImages}
              />
            </label>
            <div className="hv-image-preview">
              {form.images.map((image, index) => (
                <img
                  key={`${image.url}-${index}`}
                  src={image.url}
                  alt="Room"
                />
              ))}
            </div>
            <label>
              <input
                type="checkbox"
                checked={form.refundable}
                onChange={(event) =>
                  updateForm("refundable", event.target.checked)
                }
              />{" "}
              Refundable room
            </label>
            <button className="hv-btn">Save room</button>
          </form>
        </div>
      )}
    </div>
  );
}

function PricingSection({ hotels, hotelId, setHotelId, openInventory }) {
  const [coupons, setCoupons] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [ratePlans, setRatePlans] = useState({});
  const [rateSaving, setRateSaving] = useState("");
  const [rateMessage, setRateMessage] = useState("");
  const [form, setForm] = useState(createEmptyCoupon);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    hotelRequest("/vendor/hotel/coupons")
      .then(setCoupons)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    let active = true;
    if (!hotelId) {
      setRooms([]);
      return () => {
        active = false;
      };
    }
    hotelRequest(`/vendor/hotels/${hotelId}/rooms`)
      .then((response) => {
        if (!active) return;
        setRooms(response);
        setRatePlans(
          Object.fromEntries(response.map((room) => [room.id, getRatePlan(room)])),
        );
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [hotelId]);

  const updateRate = (roomId, key, value) => {
    setRatePlans((current) => ({
      ...current,
      [roomId]: { ...current[roomId], [key]: value },
    }));
  };

  const saveRoomRates = async (room) => {
    const plan = ratePlans[room.id] || getRatePlan(room);
    setRateSaving(room.id);
    setRateMessage("");
    try {
      await hotelRequest(`/vendor/rooms/${room.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: room.name,
          roomType: room.room_type,
          description: room.description,
          maxAdults: room.max_adults,
          maxChildren: room.max_children,
          bedType: room.bed_type,
          roomSize: room.room_size,
          totalRooms: room.total_rooms,
          basePrice: Number(plan.weekday),
          taxPercent: room.tax_percent,
          amenities: room.amenities,
          refundable: Boolean(room.refundable),
          mealPlan: room.meal_plan,
          status: room.status,
          images: room.images,
        }),
      });

      const dates = Array.from({ length: 45 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        date.setHours(12, 0, 0, 0);
        return date;
      });
      const monthKeys = [
        ...new Set(
          dates.map(
            (date) => `${date.getFullYear()}-${date.getMonth() + 1}`,
          ),
        ),
      ];
      const calendars = await Promise.all(
        monthKeys.map((key) => {
          const [year, month] = key.split("-");
          return hotelRequest(
            `/vendor/hotel/calendar?hotelId=${hotelId}&month=${month}&year=${year}`,
          );
        }),
      );
      const entries = calendars.flatMap((calendar) => calendar.entries || []);

      await Promise.all(
        dates.map((date) => {
          const dateValue = date.toISOString().slice(0, 10);
          const existing = entries.find(
            (entry) =>
              entry.room_id === room.id &&
              String(entry.inventory_date).slice(0, 10) === dateValue,
          );
          const seasonal =
            plan.seasonalStart &&
            plan.seasonalEnd &&
            dateValue >= plan.seasonalStart &&
            dateValue <= plan.seasonalEnd;
          const weekend = [0, 6].includes(date.getDay());
          const price = seasonal
            ? Number(plan.seasonal)
            : weekend
              ? Number(plan.weekend)
              : Number(plan.weekday);
          return hotelRequest("/vendor/hotel/calendar/update", {
            method: "PUT",
            body: JSON.stringify({
              roomId: room.id,
              date: dateValue,
              totalRooms: existing?.total_rooms ?? room.total_rooms,
              availableRooms:
                existing?.available_rooms ?? room.total_rooms,
              blockedRooms: existing?.blocked_rooms ?? 0,
              price,
              status: existing?.status || "available",
            }),
          });
        }),
      );

      saveRatePlan(room.id, plan);
      setRateMessage(`${room.name} pricing saved for the next 45 days.`);
    } catch (requestError) {
      setRateMessage(requestError.message);
    } finally {
      setRateSaving("");
    }
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      await hotelRequest("/vendor/hotel/coupons", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(createEmptyCoupon());
      load();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  const remove = async (couponId) => {
    if (!confirm("Delete this offer?")) return;
    try {
      await hotelRequest(`/vendor/hotel/coupons/${couponId}`, {
        method: "DELETE",
      });
      load();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Hotel pricing & offers"
        description="Calendar prices flow straight to user room selection."
        actions={
          <button className="hv-btn" type="button" onClick={openInventory}>
            Open date-wise pricing
          </button>
        }
      />
      {error && <div className="hv-error">{error}</div>}

      <HotelPicker
        hotels={hotels}
        value={hotelId}
        onChange={setHotelId}
        label="Configure pricing for"
      />

      <section className="hv-panel">
        <div className="hv-toolbar">
          <div>
            <h2>Room Rate Management</h2>
            <p>Set weekday, weekend and optional seasonal rates.</p>
          </div>
        </div>
        {!rooms.length ? (
          <div className="hv-empty">Add rooms before configuring pricing.</div>
        ) : (
          <div className="hv-table-wrap">
            <table className="hv-table hvd-rate-editor-table">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th>Weekday Price</th>
                  <th>Weekend Price</th>
                  <th>Seasonal Price</th>
                  <th>Season Start</th>
                  <th>Season End</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const plan = ratePlans[room.id] || getRatePlan(room);
                  return (
                    <tr key={room.id}>
                      <td>
                        <strong>{room.name}</strong>
                        <br />
                        <small>{room.room_type}</small>
                      </td>
                      {[
                        ["weekday", "number"],
                        ["weekend", "number"],
                        ["seasonal", "number"],
                        ["seasonalStart", "date"],
                        ["seasonalEnd", "date"],
                      ].map(([key, type]) => (
                        <td key={key}>
                          <input
                            className="hvd-rate-input"
                            type={type}
                            min={type === "number" ? "0" : undefined}
                            value={plan[key] || ""}
                            onChange={(event) =>
                              updateRate(room.id, key, event.target.value)
                            }
                          />
                        </td>
                      ))}
                      <td>
                        <button
                          className="hv-btn"
                          type="button"
                          disabled={rateSaving === room.id}
                          onClick={() => saveRoomRates(room)}
                        >
                          {rateSaving === room.id ? "Saving..." : "Save Price"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rateMessage && <p className="hvd-rate-message">{rateMessage}</p>}
      </section>

      <section className="hv-panel">
        <h2>Create coupon</h2>
        <form className="hv-form" onSubmit={save}>
          <div className="hv-grid three">
            <label className="hv-field">
              <span>Hotel (optional)</span>
              <select
                value={form.hotelId}
                onChange={(event) =>
                  setForm({ ...form, hotelId: event.target.value })
                }
              >
                <option value="">All my hotels</option>
                {hotels.map((hotel) => (
                  <option value={hotel.id} key={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            </label>
            <SectionField
              label="Coupon code"
              value={form.code}
              onChange={(value) =>
                setForm({ ...form, code: value.toUpperCase() })
              }
              required
            />
            <SectionField
              label="Description"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
            />
            <label className="hv-field">
              <span>Discount type</span>
              <select
                value={form.discountType}
                onChange={(event) =>
                  setForm({ ...form, discountType: event.target.value })
                }
              >
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <SectionField
              label="Discount value"
              type="number"
              value={form.discountValue}
              onChange={(value) => setForm({ ...form, discountValue: value })}
            />
            <SectionField
              label="Minimum booking"
              type="number"
              value={form.minBookingAmount}
              onChange={(value) =>
                setForm({ ...form, minBookingAmount: value })
              }
            />
            <SectionField
              label="Maximum discount"
              type="number"
              value={form.maxDiscount}
              onChange={(value) => setForm({ ...form, maxDiscount: value })}
            />
            <SectionField
              label="Valid from"
              type="date"
              value={form.validFrom}
              onChange={(value) => setForm({ ...form, validFrom: value })}
            />
            <SectionField
              label="Valid until"
              type="date"
              value={form.validUntil}
              onChange={(value) => setForm({ ...form, validUntil: value })}
              required
            />
            <SectionField
              label="Usage limit"
              type="number"
              value={form.usageLimit}
              onChange={(value) => setForm({ ...form, usageLimit: value })}
            />
          </div>
          <button className="hv-btn">Publish offer</button>
        </form>
      </section>

      <section className="hv-panel">
        <h2>Active and past offers</h2>
        {loading ? (
          <div className="hv-loading">Loading offers...</div>
        ) : !coupons.length ? (
          <div className="hv-empty">No coupons created.</div>
        ) : (
          <div className="hv-table-wrap">
            <table className="hv-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Validity</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <strong>{coupon.code}</strong>
                      <br />
                      <small>{coupon.description}</small>
                    </td>
                    <td>
                      {coupon.discount_type === "fixed"
                        ? money(coupon.discount_value)
                        : `${coupon.discount_value}%`}
                    </td>
                    <td>
                      {shortDate(coupon.valid_from)} -{" "}
                      {shortDate(coupon.valid_until)}
                    </td>
                    <td>
                      {coupon.used_count}/{coupon.usage_limit || "∞"}
                    </td>
                    <td>
                      <span className={`hv-status ${coupon.status}`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="hv-btn danger"
                        type="button"
                        onClick={() => remove(coupon.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function InventorySection({ hotels, hotelId, setHotelId }) {
  const now = new Date();
  const [roomId, setRoomId] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState({ rooms: [], entries: [] });
  const [editing, setEditing] = useState(null);
  const [range, setRange] = useState({
    startDate: "",
    endDate: "",
    quantity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!hotelId) {
      setData({ rooms: [], entries: [] });
      return;
    }
    setLoading(true);
    setError("");
    hotelRequest(
      `/vendor/hotel/calendar?hotelId=${hotelId}&month=${month}&year=${year}`,
    )
      .then((result) => {
        setData(result);
        setRoomId((current) =>
          result.rooms.some((room) => room.id === current)
            ? current
            : result.rooms[0]?.id || "",
        );
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [hotelId, month, year]);

  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const count = new Date(year, month, 0).getDate();
    const leadingDays = first.getDay();
    return [
      ...Array(leadingDays).fill(null),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [month, year]);

  const entryFor = (day) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const room = data.rooms.find((item) => item.id === roomId);
    return (
      data.entries.find(
        (entry) =>
          entry.room_id === roomId &&
          String(entry.inventory_date).slice(0, 10) === date,
      ) || {
        inventory_date: date,
        total_rooms: room?.total_rooms || 0,
        available_rooms: room?.total_rooms || 0,
        blocked_rooms: 0,
        booked_rooms: 0,
        price: room?.base_price || 0,
        status: "available",
      }
    );
  };

  const saveDate = async (event) => {
    event.preventDefault();
    try {
      await hotelRequest("/vendor/hotel/calendar/update", {
        method: "PUT",
        body: JSON.stringify({
          roomId,
          date: String(editing.inventory_date).slice(0, 10),
          totalRooms: editing.total_rooms,
          availableRooms: editing.available_rooms,
          blockedRooms: editing.blocked_rooms,
          price: editing.price,
          status: editing.status,
        }),
      });
      setEditing(null);
      load();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  const blockRooms = async (unblock = false) => {
    try {
      await hotelRequest(
        `/vendor/hotel/rooms/${unblock ? "unblock" : "block"}`,
        {
          method: "PUT",
          body: JSON.stringify({ ...range, roomId }),
        },
      );
      load();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  const moveMonth = (direction) => {
    let nextMonth = month + direction;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  };

  return (
    <div>
      <SectionHeader
        title="Inventory calendar"
        description="Update live availability, prices, and blocked stock by date."
        actions={
          <>
            <button
              className="hv-btn ghost"
              type="button"
              onClick={() => moveMonth(-1)}
            >
              Previous
            </button>
            <strong>
              {new Date(year, month - 1).toLocaleString("en", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              className="hv-btn ghost"
              type="button"
              onClick={() => moveMonth(1)}
            >
              Next
            </button>
          </>
        }
      />
      {error && <div className="hv-error">{error}</div>}

      <section className="hv-panel">
        <div className="hv-grid">
          <label className="hv-field">
            <span>Hotel</span>
            <select
              value={hotelId}
              onChange={(event) => setHotelId(event.target.value)}
            >
              {hotels.map((hotel) => (
                <option value={hotel.id} key={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </label>
          <label className="hv-field">
            <span>Room type</span>
            <select
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
            >
              {data.rooms.map((room) => (
                <option value={room.id} key={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="hv-panel">
        <h2>Block / unblock a date range</h2>
        <div className="hv-grid three">
          <SectionField
            label="Start date"
            type="date"
            value={range.startDate}
            onChange={(value) => setRange({ ...range, startDate: value })}
          />
          <SectionField
            label="End date"
            type="date"
            value={range.endDate}
            onChange={(value) => setRange({ ...range, endDate: value })}
          />
          <SectionField
            label="Room quantity"
            type="number"
            min="1"
            value={range.quantity}
            onChange={(value) => setRange({ ...range, quantity: value })}
          />
        </div>
        <div className="hv-actions">
          <button
            className="hv-btn danger"
            type="button"
            disabled={!roomId}
            onClick={() => blockRooms(false)}
          >
            Block rooms
          </button>
          <button
            className="hv-btn secondary"
            type="button"
            disabled={!roomId}
            onClick={() => blockRooms(true)}
          >
            Unblock rooms
          </button>
        </div>
      </section>

      <section className="hv-panel hv-table-wrap">
        {loading ? (
          <div className="hv-loading">Loading calendar...</div>
        ) : !roomId ? (
          <div className="hv-empty">Add a room before managing inventory.</div>
        ) : (
          <>
            <div className="hvd-inventory-legend">
              <span className="available">Available</span>
              <span className="booked">Booked</span>
              <span className="blocked">Blocked</span>
            </div>
            <div className="hv-calendar">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => (
                <div className="hv-day" key={day}>
                  <strong>{day}</strong>
                </div>
              ),
            )}
            {cells.map((day, index) =>
              day ? (
                <button
                  className={`hv-day ${entryFor(day).status}`}
                  key={`${day}-${index}`}
                  type="button"
                  onClick={() => setEditing(entryFor(day))}
                >
                  <strong>{day}</strong>
                  <small>{money(entryFor(day).price)}</small>
                  <br />
                  <small>{entryFor(day).available_rooms} available</small>
                  <br />
                  <small>{entryFor(day).booked_rooms} booked</small>
                  <br />
                  <small>{entryFor(day).blocked_rooms} blocked</small>
                </button>
              ) : (
                <div className="hv-day muted" key={`empty-${index}`} />
              ),
            )}
            </div>
          </>
        )}
      </section>

      {editing && (
        <div className="hv-modal-backdrop">
          <form className="hv-modal hv-form" onSubmit={saveDate}>
            <div className="hv-toolbar">
              <h2>{String(editing.inventory_date).slice(0, 10)}</h2>
              <button
                type="button"
                className="hv-btn ghost"
                onClick={() => setEditing(null)}
              >
                Close
              </button>
            </div>
            <SectionField
              label="Price for this date"
              type="number"
              value={editing.price}
              onChange={(value) => setEditing({ ...editing, price: value })}
            />
            <SectionField
              label="Available rooms"
              type="number"
              value={editing.available_rooms}
              onChange={(value) =>
                setEditing({ ...editing, available_rooms: value })
              }
            />
            <SectionField
              label="Blocked rooms"
              type="number"
              value={editing.blocked_rooms}
              onChange={(value) =>
                setEditing({ ...editing, blocked_rooms: value })
              }
            />
            <label className="hv-field">
              <span>Status</span>
              <select
                value={editing.status}
                onChange={(event) =>
                  setEditing({ ...editing, status: event.target.value })
                }
              >
                <option>available</option>
                <option>blocked</option>
                <option>sold_out</option>
              </select>
            </label>
            <button className="hv-btn">Update Inventory</button>
          </form>
        </div>
      )}
    </div>
  );
}

function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState({});

  const load = () => {
    setLoading(true);
    hotelRequest("/vendor/hotel/reviews")
      .then(setReviews)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const sendReply = async (review) => {
    if (!reply[review.id]?.trim()) return;
    try {
      await hotelRequest(`/vendor/hotel/reviews/${review.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ reply: reply[review.id] }),
      });
      setReply((current) => ({ ...current, [review.id]: "" }));
      load();
    } catch (requestError) {
      alert(requestError.message);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Hotel reviews"
        description="Read verified guest feedback and respond publicly."
      />
      {loading ? (
        <div className="hv-loading">Loading reviews...</div>
      ) : error ? (
        <div className="hv-error">{error}</div>
      ) : !reviews.length ? (
        <div className="hv-empty">No hotel reviews yet.</div>
      ) : (
        reviews.map((review) => (
          <section className="hv-panel" key={review.id}>
            <div className="hv-toolbar">
              <div>
                <strong>
                  {review.user_name || "Verified guest"} ·{" "}
                  {"★".repeat(Math.max(0, Number(review.rating)))}
                </strong>
                <p>
                  {review.hotel_name} · {shortDate(review.created_at)}
                </p>
              </div>
              <span className="hv-status active">{review.status}</span>
            </div>
            <h3>{review.title}</h3>
            <p>{review.review}</p>
            {review.replies?.map((item) => (
              <div className="hotel-reply" key={item.id}>
                <strong>Your response</strong>
                <p>{item.reply}</p>
              </div>
            ))}
            <div className="hv-scan">
              <input
                className="hotel-input"
                value={reply[review.id] || ""}
                onChange={(event) =>
                  setReply((current) => ({
                    ...current,
                    [review.id]: event.target.value,
                  }))
                }
                placeholder="Write a helpful response..."
              />
              <button
                className="hv-btn"
                type="button"
                onClick={() => sendReply(review)}
              >
                Reply
              </button>
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function ReportsSection() {
  const [report, setReport] = useState(null);
  const [trends, setTrends] = useState([]);
  const [range, setRange] = useState("month");
  const [error, setError] = useState("");

  useEffect(() => {
    hotelRequest("/vendor/hotel/reports")
      .then(setReport)
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    hotelRequest(`/vendor/hotel/booking-trends?range=${range}`)
      .then(setTrends)
      .catch((requestError) => setError(requestError.message));
  }, [range]);

  if (error) return <div className="hv-error">{error}</div>;
  if (!report) return <div className="hv-loading">Building hotel reports...</div>;

  return (
    <div>
      <SectionHeader
        title="Hotel reports"
        description="Revenue, booking performance, and occupancy from live records."
        actions={
          <select
            className="hotel-input"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            {["day", "week", "month", "year"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        }
      />
      <div className="hv-cards">
        <ReportStat label="Total revenue" value={money(report.summary.revenue)} />
        <ReportStat
          label="Total bookings"
          value={report.summary.total_bookings || 0}
        />
        <ReportStat
          label="Occupancy"
          value={`${report.summary.occupancy_rate || 0}%`}
        />
        <ReportStat
          label="Pending refunds"
          value={report.summary.pending_refunds || 0}
        />
      </div>
      <div className="hv-grid">
        <section className="hv-panel">
          <h2>Booking & revenue trend</h2>
          <div className="hv-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) =>
                    name === "revenue" ? money(value) : value
                  }
                />
                <Line dataKey="bookings" stroke="#07875b" strokeWidth={3} />
                <Line dataKey="revenue" stroke="#f0a829" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="hv-panel">
          <h2>Revenue by hotel</h2>
          <div className="hv-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.byHotel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Bar
                  dataKey="revenue"
                  fill="#07875b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="hv-panel">
        <h2>Booking status</h2>
        <div className="hv-cards">
          {report.statusBreakdown.map((row) => (
            <ReportStat
              key={row.status}
              label={row.status.replaceAll("_", " ")}
              value={row.count}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function EditHotelSection({ hotels, hotelId, setHotelId, onSaved }) {
  return (
    <div>
      <SectionHeader
        title="Edit hotel"
        description="Select a property and update its information without leaving the dashboard."
      />
      <HotelPicker
        hotels={hotels}
        value={hotelId}
        onChange={setHotelId}
        label="Hotel to edit"
      />
      {!hotelId ? (
        <div className="hv-empty">Add a hotel before editing properties.</div>
      ) : (
        <HotelForm
          key={hotelId}
          hotelId={hotelId}
          embedded
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function ScanModal({ onClose, onScan }) {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const video = useRef(null);
  const stream = useRef(null);

  const stopCamera = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  };

  useEffect(() => stopCamera, []);

  const close = () => {
    stopCamera();
    onClose();
  };

  const startCamera = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      video.current.srcObject = stream.current;
      await video.current.play();

      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const scan = async () => {
          if (!stream.current) return;
          const codes = await detector.detect(video.current).catch(() => []);
          if (codes[0]?.rawValue) {
            stopCamera();
            onScan(codes[0].rawValue);
          } else {
            requestAnimationFrame(scan);
          }
        };
        scan();
      } else {
        setMessage(
          "Live detection is unavailable in this browser. Upload a QR image below.",
        );
      }
    } catch {
      setMessage("Camera could not start. Upload a QR image or paste its value.");
    }
  };

  const scanFile = async (event) => {
    const selected = event.target.files[0];
    if (!selected) return;
    const image = await createImageBitmap(selected);
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(pixels.data, pixels.width, pixels.height);
    if (code?.data) onScan(code.data);
    else setMessage("No QR code was found in that image.");
  };

  return (
    <div className="hv-modal-backdrop">
      <div className="hv-modal">
        <div className="hv-toolbar">
          <h2>Hotel QR check-in</h2>
          <button className="hv-btn ghost" type="button" onClick={close}>
            Close
          </button>
        </div>
        <video className="hv-video" ref={video} muted playsInline />
        <div className="hv-actions">
          <button className="hv-btn" type="button" onClick={startCamera}>
            Start camera
          </button>
          <label className="hv-btn secondary">
            Upload QR image
            <input hidden type="file" accept="image/*" onChange={scanFile} />
          </label>
        </div>
        <p>{message}</p>
        <div className="hv-scan">
          <input
            className="hotel-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste QR token or booking code"
          />
          <button
            className="hv-btn"
            type="button"
            onClick={() => onScan(input)}
          >
            Check in
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description, actions }) {
  return (
    <div className="hv-toolbar">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="hv-actions">{actions}</div>}
    </div>
  );
}

function HotelPicker({ hotels, value, onChange, label }) {
  return (
    <section className="hv-panel">
      <label className="hv-field">
        <span>{label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {!hotels.length && <option value="">No hotels available</option>}
          {hotels.map((hotel) => (
            <option value={hotel.id} key={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function SectionField({
  label,
  onChange,
  textarea,
  className = "",
  ...props
}) {
  return (
    <label className={`hv-field ${className}`}>
      <span>{label}</span>
      {textarea ? (
        <textarea {...props} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input {...props} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function ReportStat({ label, value }) {
  return (
    <div className="hv-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
