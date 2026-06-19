import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBus,
  FaCalendarAlt,
  FaFilm,
  FaHotel,
  FaPlane,
  FaRegHeart,
  FaSearch,
  FaStar,
  FaSuitcaseRolling,
  FaTicketAlt,
  FaTrain,
} from "react-icons/fa";
import "./Dashboard.css";

const apiBase = "http://localhost:5000/api";

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const categories = [
  { name: "Movies", path: "/dashboard/movies", icon: <FaFilm />, style: "movies" },
  { name: "Flights", path: "/dashboard/flights", icon: <FaPlane />, style: "flights" },
  { name: "Events", path: "/dashboard/event", icon: <FaCalendarAlt />, style: "events" },
  { name: "Hotels", path: "/dashboard/hotel", icon: <FaHotel />, style: "hotels" },
  { name: "Buses", path: "/dashboard/bus", icon: <FaBus />, style: "buses" },
  { name: "Trains", path: "/dashboard/train", icon: <FaTrain />, style: "trains" },
  { name: "Holidays", path: "/dashboard/holiday", icon: <FaSuitcaseRolling />, style: "travel" },
];

const topRecommendations = [
  {
    id: 1,
    module: "movie",
    title: "Avatar: The Way of Water",
    location: "INOX Pune",
    date: "Jun 12, 2026",
    price: 250,
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    module: "flight",
    title: "Pune to Delhi Flight",
    location: "IndiGo Airlines",
    date: "Jun 15, 2026",
    price: 4999,
    rating: "4.6",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80",
  },
];

function Dashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [wishlist, setWishlist] = useState(() =>
    JSON.parse(localStorage.getItem("tixhubWishlist") || "[]")
  );

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    }),
    []
  );

  useEffect(() => {
    fetch(`${apiBase}/bookings`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]));
  }, [authHeaders]);

  const handleSearch = () => {
    const value = searchText.toLowerCase().trim();

    if (value.includes("movie")) {
      navigate("/dashboard/movies");
    } else if (value.includes("flight")) {
      navigate("/dashboard/flights");
    } else if (value) {
      navigate(`/dashboard/browse?search=${encodeURIComponent(searchText)}`);
    } else {
      navigate("/dashboard/browse");
    }
  };

  const saveWishlist = (item) => {
    const exists = wishlist.some(
      (saved) => saved.id === item.id && saved.title === item.title
    );

    const next = exists
      ? wishlist.filter(
          (saved) => !(saved.id === item.id && saved.title === item.title)
        )
      : [...wishlist, item];

    setWishlist(next);
    localStorage.setItem("tixhubWishlist", JSON.stringify(next));
  };

  const isWishlisted = (item) =>
    wishlist.some(
      (saved) => saved.id === item.id && saved.title === item.title
    );

  const openCard = (item) => {
    if (item.module === "movie") {
      navigate("/dashboard/movies");
    } else if (item.module === "flight") {
      navigate("/dashboard/flights");
    }
  };

  return (
    <>
      <section className="hero-banner">
        <div className="hero-text">
          <h1>
            Discover Amazing <br /> Bookings Everywhere
          </h1>
        </div>

        <div className="search-bar-container">
          <FaSearch className="search-input-icon" />

          <input
            type="text"
            placeholder="Search movies or flights..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <button className="search-submit-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h3>Categories</h3>
          <span
            className="view-all"
            onClick={() => navigate("/dashboard/browse")}
          >
            View All
          </span>
        </div>

        <div className="categories-grid">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={`category-card ${cat.style}`}
              onClick={() => navigate(cat.path)}
            >
              <div className={`category-icon-wrapper ${cat.style}`}>
                {cat.icon}
              </div>
              <p>{cat.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h3>Trending Bookings</h3>
          <span
            className="view-all"
            onClick={() => navigate("/dashboard/browse")}
          >
            View All
          </span>
        </div>

        <div className="cards-grid">
          {topRecommendations.map((item) => (
            <div
              key={item.id}
              className="trending-card"
              onClick={() => openCard(item)}
            >
              <div className="card-image-wrapper">
                <img src={item.image} alt={item.title} />

                <button
                  className="like-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    saveWishlist(item);
                  }}
                >
                  <FaRegHeart
                    color={isWishlisted(item) ? "#ef4444" : "#0f172a"}
                  />
                </button>
              </div>

              <div className="card-body">
                <h4>{item.title}</h4>
                <p className="card-sub">{item.location}</p>
                <p className="card-date">{item.date}</p>

                <div className="card-footer">
                  <span className="price-tag">Rs {item.price}</span>
                  <span className="rating-tag">
                    <FaStar /> {item.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h3>My Upcoming Bookings</h3>
          <span
            className="view-all"
            onClick={() => navigate("/dashboard/my-bookings")}
          >
            View All
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="summary-booking-card">
            <div className="summary-card-left">
              <div className="summary-icon-box movies">
                <FaTicketAlt />
              </div>
              <div className="summary-info">
                <h4>No bookings yet</h4>
                <p className="subtitle">Book your first movie or flight</p>
              </div>
            </div>
          </div>
        ) : (
          bookings.slice(0, 2).map((booking) => (
            <div
              className="summary-booking-card"
              key={booking.id || booking._id}
            >
              <div className="summary-card-left">
                <div className="summary-icon-box movies">
                  <FaTicketAlt />
                </div>

                <div className="summary-info">
                  <h4>{booking.title || booking.movie_name || "Booking"}</h4>
                  <p className="subtitle">{booking.module || "Movie"}</p>
                  <p className="time-details">
                    {booking.bookingCode || booking.booking_id}
                  </p>
                </div>
              </div>

              <div className="summary-card-right">
                <span className="status-badge green">
                  {booking.status || booking.booking_status || "Confirmed"}
                </span>
                <h3 className="summary-price">
                  Rs {booking.amount || booking.total_amount || 0}
                </h3>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}

export default Dashboard;