import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlay } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import SeatCountModal from "./SeatCountModal";
import "./MoviesContent.css";

const fallbackImage =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=90";

const fallbackBanner =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=90";

const fallbackMovies = [
  {
    _id: "movie-1",
    title: "Deool Band 2",
    language: "Marathi",
    genre: "Comedy/Drama",
    rating: "9.4/10",
    votes: "49.2K+ Votes",
    image: fallbackImage,
    bannerUrl: fallbackBanner,
    theatre: "PVR",
    city: "Pune",
    screenName: "Screen 1",
    totalSeats: 400,
    regularSeats: 200,
    primeSeats: 100,
    vipSeats: 100,
    bookedSeats: [],
    blockedSeats: 0,
    regularSeatPrice: 150,
    primeSeatPrice: 250,
    premiumSeatPrice: 250,
    vipSeatPrice: 400,
  },
];

function isValidImageUrl(url) {
  if (!url) return false;
  return String(url).startsWith("http://") || String(url).startsWith("https://");
}

function getCount(value) {
  if (Array.isArray(value)) return value.length;
  return Number(value || 0);
}

function normalizeMovie(movie) {
  const selectedScreen =
    movie.screens?.[movie.selectedScreenIndex || 0] || movie.screens?.[0] || {};

  const totalSeats = Number(movie.totalSeats || selectedScreen.totalSeats || 0);
  const bookedCount = getCount(movie.bookedSeats);
  const blockedCount = getCount(movie.blockedSeats);
  const availableSeats = Math.max(totalSeats - bookedCount - blockedCount, 0);

  return {
    ...movie,
    theatre: movie.theatre || movie.theatreName || "-",
    city: movie.city || movie.theatreCity || "-",
    address: movie.address || movie.location || movie.theatreAddress || "-",
    screenName:
      movie.screenName ||
      movie.screenNumber ||
      selectedScreen.screenName ||
      "-",
    totalSeats,
    regularSeats: Number(movie.regularSeats || selectedScreen.regularSeats || 0),
    primeSeats: Number(movie.primeSeats || selectedScreen.primeSeats || 0),
    vipSeats: Number(movie.vipSeats || selectedScreen.vipSeats || 0),
    bookedCount,
    blockedCount,
    availableSeats,
    regularSeatPrice: Number(movie.regularSeatPrice || movie.ticketPrice || 0),
    primeSeatPrice: Number(movie.primeSeatPrice || movie.premiumSeatPrice || 0),
    premiumSeatPrice: Number(movie.premiumSeatPrice || movie.primeSeatPrice || 0),
    vipSeatPrice: Number(movie.vipSeatPrice || 0),
    image: isValidImageUrl(movie.posterUrl)
      ? movie.posterUrl
      : isValidImageUrl(movie.image)
      ? movie.image
      : fallbackImage,
    bannerUrl: isValidImageUrl(movie.bannerUrl)
      ? movie.bannerUrl
      : isValidImageUrl(movie.image)
      ? movie.image
      : fallbackBanner,
  };
}

function MoviesContent() {
  const navigate = useNavigate();

  const [moviesData, setMoviesData] = useState([]);
  const [activeLanguage, setActiveLanguage] = useState("All");
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/movies");
      const movies = Array.isArray(res.data) ? res.data : res.data?.movies || [];
      setMoviesData(movies.length ? movies.map(normalizeMovie) : fallbackMovies);
    } catch (error) {
      setMoviesData(fallbackMovies);
    }
  };

  const filteredMovies =
    activeLanguage === "All"
      ? moviesData
      : moviesData.filter((movie) => movie.language === activeLanguage);

  const openSeatCount = (movie) => {
    sessionStorage.setItem("selectedMovie", JSON.stringify(movie));
    setSelectedMovie(movie);
  };

  const openSeatSelection = ({ seatCount, category }) => {
    if (!selectedMovie) return;

    const theatre = {
      name: selectedMovie.theatre || selectedMovie.theatreName || "Theatre",
      city: selectedMovie.city || selectedMovie.theatreCity || "",
    };
    const showtime = {
      time: selectedMovie.showTime || selectedMovie.showTimes?.[0] || "Show Time",
      date: {
        label: selectedMovie.showDate || selectedMovie.releaseDate || "Today",
        day: "",
        month: "",
      },
    };

    navigate(`/dashboard/movies/${selectedMovie._id}/seats`, {
      state: {
        movie: selectedMovie,
        theatre,
        showtime,
        selectedSeats: seatCount,
        category,
      },
    });
  };

  const heroMovie = moviesData[0] || fallbackMovies[0];

  return (
    <div className="movies-page">
      <section className="movies-hero">
        <img src={heroMovie.bannerUrl || heroMovie.image} alt={heroMovie.title} />

        <div className="movies-hero-overlay">
          <div className="movies-hero-content">
            <span className="movies-tag">#1 Movie Booking Platform</span>

            <h1>Book Latest Movies</h1>

            <p>Select theatre and book your favorite seats instantly.</p>

            <div className="movies-hero-buttons">
              <button className="watch-btn">
                <FaPlay />
                Watch Trailer
              </button>

              <button className="explore-btn">Explore Movies</button>
            </div>
          </div>
        </div>
      </section>

      <div className="movie-categories">
        {[
          "All",
          "Hindi",
          "English",
          "Marathi",
          "Tamil",
          "Telugu",
          "Malayalam",
        ].map((language) => (
          <button
            key={language}
            className={activeLanguage === language ? "active" : ""}
            onClick={() => setActiveLanguage(language)}
          >
            {language}
          </button>
        ))}
      </div>

      <div className="coming-header">
        <h2>Recommended Movies</h2>
      </div>

      <div className="movies-grid">
        {filteredMovies.map((movie) => (
          <div className="movie-card" key={movie._id} onClick={() => openSeatCount(movie)}>
            <div className="poster-wrapper">
              <img src={movie.image} alt={movie.title} />
            </div>

            <div className="movie-info">
              <h3>{movie.title || "Movie Name"}</h3>
            </div>
          </div>
        ))}
      </div>

      {selectedMovie && (
        <SeatCountModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onSelectSeats={openSeatSelection}
        />
      )}
    </div>
  );
}

export default MoviesContent;
