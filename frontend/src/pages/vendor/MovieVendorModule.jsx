import React, { useMemo } from "react";
import {
  BarChart3,
  CalendarDays,
  Clapperboard,
  CreditCard,
  Eye,
  Film,
  LayoutGrid,
  Pencil,
  Plus,
  QrCode,
  Sofa,
  Ticket,
  Wallet,
} from "lucide-react";
import "./VendorDashboard.css";
import "./MovieVendorModule.css";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const countBookedSeats = (movie) => {
  if (Array.isArray(movie.bookedSeats)) return movie.bookedSeats.length;
  return toNumber(movie.bookedSeats);
};

const countShows = (movie) => {
  if (Array.isArray(movie.showTimes)) return movie.showTimes.length;
  return movie.showTime || movie.showDate ? 1 : 0;
};

const movieStatus = (movie) => String(movie.status || "active").toLowerCase();

function MovieVendorModule({
  stats = {},
  listings = [],
  bookings = [],
  navigate = () => {},
}) {
  const movieBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        String(booking.module || booking.service || booking.details?.module || "")
          .toLowerCase()
          .includes("movie")
      ),
    [bookings]
  );

  const bookingChart = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (label) => ({ label, value: 0 })
    );

    movieBookings.forEach((booking) => {
      const date = new Date(
        booking.createdAt || booking.bookingDate || booking.updatedAt || Date.now()
      );
      const index = Number.isNaN(date.getTime()) ? 0 : (date.getDay() + 6) % 7;
      days[index].value += 1;
    });

    if (!movieBookings.length) {
      return days.map((day, index) => ({
        ...day,
        value: [10, 12, 22, 16, 25, 19, 35][index],
      }));
    }

    return days;
  }, [movieBookings]);

  const summary = useMemo(() => {
    const totalMovies = listings.length;

    const activeShows =
      listings.reduce((sum, movie) => sum + countShows(movie), 0) ||
      toNumber(stats.activeShows || stats.upcomingSchedules);

    const bookedSeats =
      toNumber(stats.bookedSeats) ||
      listings.reduce((sum, movie) => sum + countBookedSeats(movie), 0);

    const blockedSeats =
      toNumber(stats.blockedSeats) ||
      listings.reduce((sum, movie) => sum + toNumber(movie.blockedSeats), 0);

    const totalSeats = listings.reduce(
      (sum, movie) => sum + toNumber(movie.totalSeats),
      0
    );

    const availableSeats =
      toNumber(stats.availableSeats) ||
      Math.max(totalSeats - bookedSeats - blockedSeats, 0);

    const movieRevenue =
      movieBookings.reduce(
        (sum, booking) => sum + toNumber(booking.amount || booking.totalAmount),
        0
      ) ||
      listings.reduce((sum, movie) => sum + toNumber(movie.revenue), 0) ||
      toNumber(stats.movieRevenue || stats.revenue);

    const capacity = totalSeats || availableSeats + bookedSeats + blockedSeats;

    const occupancy = capacity
      ? Math.round((bookedSeats / Math.max(capacity, 1)) * 100)
      : 0;

    return {
      totalMovies,
      activeShows,
      availableSeats,
      blockedSeats,
      bookedSeats,
      movieBookings: movieBookings.length || toNumber(stats.movieBookings || stats.totalBookings),
      movieRevenue,
      occupancy,
    };
  }, [listings, movieBookings, stats]);

  const cards = [
    ["Total Movies", summary.totalMovies, Film],
    ["Active Shows", summary.activeShows, CalendarDays],
    ["Available Seats", summary.availableSeats, Sofa],
    ["Blocked Seats", summary.blockedSeats, Ticket],
    ["Booked Seats", summary.bookedSeats, Ticket],
    ["Movie Bookings", summary.movieBookings, CalendarDays],
    ["Movie Revenue", `Rs ${summary.movieRevenue}`, Wallet],
    ["Occupancy", `${summary.occupancy}%`, BarChart3],
  ];

  const actions = [
    ["Add Movie", "/vendor/add-movie", Clapperboard],
    ["My Movies", "/vendor/my-movies", Film],
    ["Theatres & Screens", "/vendor/theatres", LayoutGrid],
    ["Show Management", "/vendor/theatres", CalendarDays],
    ["Seat Management", "/vendor/seat-management", Sofa],
    ["QR Scanner", "/vendor/qr-scanner", QrCode],
    ["Bookings", "/vendor/bookings", Ticket],
    ["Revenue", "/vendor/revenue", BarChart3],
    ["Settlements", "/vendor/settlements", CreditCard],
    ["Reports", "/vendor/reports", Wallet],
  ];

  const topMovies = listings.slice(0, 4);
  const recentBookings = movieBookings.slice(0, 5);
  const upcomingShows = listings.slice(0, 4);

  return (
    <>
      <section className="movie-vendor-hero">
        <div className="movie-vendor-hero-left">
          <span className="movie-vendor-icon">
            <Clapperboard size={34} />
          </span>
          <div>
            <h1>Movie Vendor </h1>
            <p>Manage movies, shows, seats, QR scans, bookings, and revenue.</p>
          </div>
        </div>

        <button
          className="movie-vendor-add-button"
          type="button"
          onClick={() => navigate("/vendor/add-movie")}
        >
          <Plus size={18} />
          Add Movie
        </button>
      </section>

      <section className="vendor-card-grid movie-kpi-grid">
        {cards.map(([label, value, Icon]) => (
          <article className="vendor-kpi-card movie-kpi-card" key={label}>
            <div className="movie-kpi-icon">
              <Icon size={20} />
            </div>
            <div>
              <p>{label}</p>
              <h2>{value}</h2>
              <span>Movie module</span>
            </div>
          </article>
        ))}
      </section>

      <section className="movie-dashboard-main-grid">
        <article className="vendor-panel movie-quick-panel">
          <div className="panel-title">
            <h2>Quick Actions</h2>
            <button type="button">Movie</button>
          </div>

          <div className="movie-action-grid">
            {actions.map(([label, path, Icon]) => (
              <button key={label} type="button" onClick={() => navigate(path)}>
                <Icon size={24} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="vendor-panel movie-chart-panel">
          <div className="panel-title">
            <h2>Booking Overview</h2>
            <button type="button">This Week</button>
          </div>

          <MovieBookingChart data={bookingChart} />
        </article>

        <article className="vendor-panel movie-status-panel">
          <div className="panel-title">
            <h2>Booking Status</h2>
            <button type="button">Live</button>
          </div>

          <BookingStatus summary={summary} />
        </article>
      </section>

      <section className="movie-bottom-grid">
        <article className="vendor-panel">
          <div className="panel-title">
            <h2>Top Movies</h2>
            <button type="button" onClick={() => navigate("/vendor/my-movies")}>
              View All
            </button>
          </div>

          <div className="movie-mini-list">
            {topMovies.length ? (
              topMovies.map((movie, index) => (
                <div className="movie-mini-row" key={movie._id || movie.title || index}>
                  <span className="movie-rank">{index + 1}</span>

                  {movie.image || movie.posterUrl || movie.bannerUrl ? (
                    <img
                      src={movie.image || movie.posterUrl || movie.bannerUrl}
                      alt={movie.title || "Movie"}
                    />
                  ) : (
                    <span className="movie-mini-thumb">
                      <Film size={18} />
                    </span>
                  )}

                  <div>
                    <strong>{movie.title || "Untitled Movie"}</strong>
                    <small>{movie.language || "-"} · {movie.genre || "-"}</small>
                  </div>

                  <b>Rs {toNumber(movie.revenue)}</b>
                </div>
              ))
            ) : (
              <p className="movie-empty-text">No movies available.</p>
            )}
          </div>
        </article>

        <article className="vendor-panel">
          <div className="panel-title">
            <h2>Recent Bookings</h2>
            <button type="button" onClick={() => navigate("/vendor/bookings")}>
              View All
            </button>
          </div>

          <div className="vendor-table-shell">
            <table className="vendor-table movie-small-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Movie</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length ? (
                  recentBookings.map((booking, index) => (
                    <tr key={booking._id || index}>
                      <td>{booking.bookingCode || booking.bookingId || booking._id}</td>
                      <td>{booking.movieTitle || booking.title || "-"}</td>
                      <td>
                        {Array.isArray(booking.seats)
                          ? booking.seats.join(", ")
                          : booking.seats || "-"}
                      </td>
                      <td>Rs {toNumber(booking.amount || booking.totalAmount)}</td>
                      <td>
                        <span className="vendor-status">
                          {booking.status || booking.bookingStatus || "confirmed"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No recent bookings.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="vendor-panel">
          <div className="panel-title">
            <h2>Upcoming Shows</h2>
            <button type="button">View All</button>
          </div>

          <div className="vendor-table-shell">
            <table className="vendor-table movie-small-table">
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Date & Time</th>
                  <th>Screen</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {upcomingShows.length ? (
                  upcomingShows.map((movie, index) => {
                    const bookedSeats = countBookedSeats(movie);
                    const blockedSeats = toNumber(movie.blockedSeats);
                    const totalSeats = toNumber(movie.totalSeats);
                    const availableSeats = Math.max(totalSeats - bookedSeats - blockedSeats, 0);

                    return (
                      <tr key={movie._id || index}>
                        <td>{movie.title || "Movie"}</td>
                        <td>
                          {movie.showDate || "-"} {movie.showTime || ""}
                        </td>
                        <td>{movie.screenName || movie.screenNumber || "Screen 1"}</td>
                        <td>{availableSeats}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4">No upcoming shows.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="vendor-panel vendor-page-panel movie-list-panel">
        <div className="panel-title">
          <h2>Recent Movie Listings</h2>
          <button type="button" onClick={() => navigate("/vendor/my-movies")}>
            View All Movies
          </button>
        </div>

        <div className="vendor-table-shell">
          <table className="vendor-table">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Movie Name</th>
                <th>Genre</th>
                <th>Language</th>
                <th>Theatre</th>
                <th>Shows</th>
                <th>Booked Seats</th>
                <th>Available Seats</th>
                <th>Occupancy</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {listings.length ? (
                listings.map((movie) => {
                  const bookedSeats = countBookedSeats(movie);
                  const blockedSeats = toNumber(movie.blockedSeats);
                  const totalSeats = toNumber(movie.totalSeats);
                  const availableSeats = Math.max(totalSeats - bookedSeats - blockedSeats, 0);
                  const occupancyValue = totalSeats
                    ? Math.round((bookedSeats / totalSeats) * 100)
                    : 0;

                  return (
                    <tr key={movie._id || movie.id || movie.title}>
                      <td>
                        {movie.image || movie.posterUrl || movie.bannerUrl ? (
                          <img
                            className="table-poster"
                            src={movie.image || movie.posterUrl || movie.bannerUrl}
                            alt={movie.title || "Movie"}
                          />
                        ) : (
                          <span className="movie-thumb">
                            <Film size={18} />
                          </span>
                        )}
                      </td>

                      <td>{movie.title || "Untitled Movie"}</td>
                      <td>{movie.genre || "-"}</td>
                      <td>{movie.language || "-"}</td>
                      <td>{movie.theatre || movie.theatreName || "-"}</td>
                      <td>{countShows(movie)}</td>
                      <td>{bookedSeats}</td>
                      <td>{availableSeats}</td>
                      <td>
                        <div className="movie-occupancy-cell">
                          <span>{occupancyValue}%</span>
                          <i>
                            <b style={{ width: `${occupancyValue}%` }} />
                          </i>
                        </div>
                      </td>
                      <td>
                        <span className="vendor-status">{movieStatus(movie)}</span>
                      </td>
                      <td>
                        <div className="movie-icon-actions">
                          <button type="button">
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/vendor/add-movie", {
                                state: { movie },
                              })
                            }
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/vendor/seat-management", {
                                state: { movieId: movie._id },
                              })
                            }
                          >
                            <Ticket size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11">No movie listings available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function MovieBookingChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="movie-line-chart">
      <div className="movie-line-chart-body">
        {data.map((item) => (
          <div className="movie-line-point" key={item.label}>
            <strong>{item.value}</strong>
            <span style={{ height: `${Math.max((item.value / maxValue) * 100, 10)}%` }} />
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingStatus({ summary }) {
  const confirmed = summary.movieBookings || 0;
  const pending = Math.round(confirmed * 0.25);
  const cancelled = Math.round(confirmed * 0.1);
  const completed = Math.max(confirmed - pending - cancelled, 0);
  const total = Math.max(confirmed + pending + cancelled + completed, 1);

  const rows = [
    ["Confirmed", confirmed, "#20b96b"],
    ["Pending", pending, "#f5ae37"],
    ["Cancelled", cancelled, "#ef5350"],
    ["Completed", completed, "#3b82f6"],
  ];

  return (
    <div className="movie-status-wrap">
      <div className="movie-donut">
        <span>
          <strong>{summary.movieBookings}</strong>
          <small>Total</small>
        </span>
      </div>

      <div className="movie-status-list">
        {rows.map(([label, value, color]) => (
          <p key={label}>
            <i style={{ background: color }} />
            <span>{label}</span>
            <strong>
              {value} ({Math.round((value / total) * 100)}%)
            </strong>
          </p>
        ))}
      </div>
    </div>
  );
}

export default MovieVendorModule;