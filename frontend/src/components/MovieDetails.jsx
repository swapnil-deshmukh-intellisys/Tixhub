import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaCalendar,
  FaClock,
  FaFilm,
  FaMapMarkerAlt,
  FaPlay,
  FaShareAlt,
  FaStar,
  FaTag,
  FaTicketAlt,
  FaTv,
  FaUserPlus,
} from "react-icons/fa";
import "./MovieDetails.css";

const fallbackAvatar =
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=300&q=80";

function normalizeMovie(movie) {
  const selectedScreen =
    movie.screens?.[movie.selectedScreenIndex || 0] || movie.screens?.[0] || {};

  return {
    ...movie,
    theatre: movie.theatre || movie.theatreName || "-",
    city: movie.city || movie.theatreCity || "-",
    address: movie.address || movie.location || movie.theatreAddress || "-",
    screenName: movie.screenName || movie.screenNumber || selectedScreen.screenName || "-",
    totalSeats: movie.totalSeats || selectedScreen.totalSeats || 0,
    regularSeats: movie.regularSeats || selectedScreen.regularSeats || 0,
    primeSeats: movie.primeSeats || selectedScreen.primeSeats || 0,
    vipSeats: movie.vipSeats || selectedScreen.vipSeats || 0,
    image: movie.posterUrl || movie.image,
    bannerUrl: movie.bannerUrl || movie.image,
  };
}

function MovieDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const storedMovie = sessionStorage.getItem("selectedMovie");
  const rawMovie = location.state?.movie || (storedMovie ? JSON.parse(storedMovie) : null);

  if (!rawMovie) {
    return (
      <div className="no-movie">
        <h1>No Movie Selected</h1>
        <button onClick={() => navigate("/dashboard/movies")}>Go Back to Movies</button>
      </div>
    );
  }

  const movie = normalizeMovie(rawMovie);

  const castMembers = movie.castMembers?.length
    ? movie.castMembers
    : splitLegacyPeople(movie.cast, "Actor");

  const crewMembers = movie.crewMembers?.length
    ? movie.crewMembers
    : splitLegacyPeople(movie.director, "Director");

  const offers = movie.isOfferApplicable ? movie.offers || [] : [];

  return (
    <div className="movie-details-page">
      <section
        className="details-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.96), rgba(15,23,42,0.84), rgba(15,23,42,0.36)), url(${movie.bannerUrl || movie.image})`,
        }}
      >
        <div className="poster-panel">
          <img
            src={movie.image || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=900"}
            alt={movie.title}
            className="details-poster"
          />

          {movie.trailerUrl && (
            <a className="trailer-link" href={movie.trailerUrl} target="_blank" rel="noreferrer">
              <FaPlay /> Trailers
            </a>
          )}
        </div>

        <div className="details-content">
          <h1>{movie.title}</h1>

          <div className="interest-card">
            <div>
              <strong>{movie.interestCount || "Be the first to show interest"}</strong>
              <p>Are you interested in watching this movie?</p>
            </div>
            <button><FaUserPlus /> I'm interested</button>
          </div>

          <div className="movie-meta">
            {movie.duration && <span><FaClock /> {movie.duration}</span>}
            {movie.genre && <span><FaFilm /> {movie.genre}</span>}
            {movie.certificate && <span>{movie.certificate}</span>}
            {movie.format && <span>{movie.format}</span>}
            {movie.language && <span>{movie.language}</span>}
            {movie.rating && <span><FaStar /> {movie.rating}</span>}
            {movie.releaseDate && <span><FaCalendar /> {movie.releaseDate}</span>}
          </div>

          <div className="hero-actions">
            <button
              className="book-ticket-btn"
              onClick={() =>
                navigate(`/dashboard/movies/${movie._id}/seats`, {
                  state: {
                    movie,
                    theatre: { name: movie.theatre, city: movie.city },
                    showtime: {
                      time: movie.showTime || movie.showTimes?.[0] || "Show Time",
                      date: { label: movie.showDate || movie.releaseDate || "Today" },
                    },
                    selectedSeats: 1,
                    category: {
                      name: "Regular",
                      price: movie.regularSeatPrice || movie.ticketPrice || 0,
                    },
                  },
                })
              }
            >
              <FaTicketAlt /> Book tickets
            </button>

            <button className="share-btn"><FaShareAlt /> Share</button>
          </div>
        </div>
      </section>

      <main className="details-body">
        <section className="detail-section">
          <h2>About the movie</h2>
          <p>{movie.aboutMovie || movie.description || "Movie synopsis will be updated soon."}</p>
        </section>

        <section className="detail-section">
          <h2>Theatre & Screen Details</h2>

          <div className="info-grid">
            <Info label="Theatre" value={movie.theatre} />
            <Info label="City" value={movie.city} />
            <Info label="Address" value={movie.address} />
            <Info label="Selected Screen" value={movie.screenName} />
            <Info label="Show Date" value={movie.showDate} />
            <Info label="Show Time" value={movie.showTime} />
            <Info label="End Time" value={movie.endTime} />
          </div>
        </section>

        {movie.screens?.length > 0 && (
          <section className="detail-section">
            <h2>Available Screens</h2>

            <div className="screen-details-grid">
              {movie.screens.map((screen, index) => (
                <div className="screen-detail-card" key={`${screen.screenName}-${index}`}>
                  <h3><FaTv /> {screen.screenName || `Screen ${index + 1}`}</h3>
                  <p>Type: {screen.screenType || "2D"}</p>
                  <p>Total Seats: {screen.totalSeats}</p>
                  <p>Regular: {screen.regularSeats}</p>
                  <p>Prime: {screen.primeSeats}</p>
                  <p>VIP: {screen.vipSeats}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="detail-section">
          <h2>Seat Pricing</h2>

          <div className="info-grid">
            <Info label="Regular Price" value={`₹${movie.regularSeatPrice || movie.ticketPrice || 0}`} />
            <Info label="Prime Price" value={`₹${movie.primeSeatPrice || movie.premiumSeatPrice || 0}`} />
            <Info label="VIP Price" value={`₹${movie.vipSeatPrice || 0}`} />
            <Info label="Total Seats" value={movie.totalSeats} />
            <Info label="Regular Seats" value={movie.regularSeats} />
            <Info label="Prime Seats" value={movie.primeSeats} />
            <Info label="VIP Seats" value={movie.vipSeats} />
          </div>
        </section>

        {offers.length > 0 && (
          <section className="detail-section">
            <h2>Top offers for you</h2>
            <div className="offers-grid">
              {offers.map((offer, index) => (
                <div className="offer-card" key={`${offer.title}-${index}`}>
                  <FaTag />
                  <div>
                    <h3>{offer.title}</h3>
                    <p>{offer.description || "Tap to view details"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {castMembers.length > 0 && (
          <section className="detail-section">
            <h2>Cast</h2>
            <PeopleRail people={castMembers} />
          </section>
        )}

        {crewMembers.length > 0 && (
          <section className="detail-section">
            <h2>Crew</h2>
            <PeopleRail people={crewMembers} />
          </section>
        )}

        <section className="detail-section">
          <h2>Movie information</h2>
          <div className="info-grid">
            <Info label="Director" value={movie.director} />
            <Info label="Lead" value={movie.hero} />
            <Info label="Language" value={movie.language} />
            <Info label="Genre" value={movie.genre} />
            <Info label="Certificate" value={movie.certificate} />
            <Info label="Format" value={movie.format} />
          </div>
        </section>
      </main>
    </div>
  );
}

function PeopleRail({ people }) {
  return (
    <div className="people-rail">
      {people.map((person, index) => (
        <div className="person-card" key={`${person.name}-${index}`}>
          <img src={person.photo || fallbackAvatar} alt={person.name} />
          <h3>{person.name}</h3>
          <p>{person.role}</p>
        </div>
      ))}
    </div>
  );
}

function Info({ label, value }) {
  if (!value && value !== 0) return null;

  return (
    <div className="info-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function splitLegacyPeople(value, role) {
  if (!value) return [];

  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      role,
      photo: "",
    }));
}

export default MovieDetails;
