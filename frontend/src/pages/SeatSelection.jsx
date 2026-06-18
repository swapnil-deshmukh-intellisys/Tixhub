import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaRupeeSign } from "react-icons/fa";
import "./SeatSelection.css";

const seatSections = [
  {
    title: "₹360 PRIME ROWS",
    rows: ["A", "B", "C", "D", "E", "F", "G"],
    price: 360,
    category: "Prime",
  },
  {
    title: "₹340 CLASSIC PLUS ROWS",
    rows: ["H", "I"],
    price: 340,
    category: "Classic Plus",
  },
  {
    title: "₹240 CLASSIC ROWS",
    rows: ["J", "K"],
    price: 240,
    category: "Classic",
  },
];

function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    movie,
    theatre,
    showtime,
    selectedSeats = 2,
    category = { name: "Classic", price: 240 },
  } = location.state || {};

  const [selected, setSelected] = useState([]);
  const [liveSeats, setLiveSeats] = useState([]);
  const showId = movie?._id || "";
  const unavailableSeats = useMemo(() => {
    const liveUnavailable = liveSeats.filter((seat) => seat.status === "booked" || seat.status === "blocked").map((seat) => seat.seatNo || seat.seatNumber);
    return liveUnavailable.length ? liveUnavailable : movie?.bookedSeats || [];
  }, [liveSeats, movie?.bookedSeats]);

  useEffect(() => {
    if (!movie?._id) return;
    const theatreName = theatre?.name || theatre || "";
    const showDate = showtime?.date?.value || showtime?.date?.label || "";
    const showTime = showtime?.time || "";

    fetch(`http://localhost:5000/api/seats/${encodeURIComponent(showId)}?movieId=${encodeURIComponent(movie._id)}&theatre=${encodeURIComponent(theatreName)}&screenId=${encodeURIComponent(movie.screenNumber || "Screen 1")}&showDate=${encodeURIComponent(showDate)}&showTime=${encodeURIComponent(showTime)}&totalSeats=${encodeURIComponent(movie.totalSeats || 187)}&price=${encodeURIComponent(movie.ticketPrice || category.price || 240)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setLiveSeats(Array.isArray(data.seats) ? data.seats : []))
      .catch(() => setLiveSeats([]));
  }, [movie?._id, showId, theatre, showtime, category.price]);

  if (!movie || !theatre || !showtime) {
    return (
      <div className="seat-empty">
        <h2>Booking details missing</h2>
        <button onClick={() => navigate("/dashboard/movies")}>Back</button>
      </div>
    );
  }

  const activeCategory = category.name || "Classic";

  const toggleSeat = (seatNo, sectionCategory) => {
    if (sectionCategory !== activeCategory) return;
    if (unavailableSeats.includes(seatNo)) return;

    setSelected((prev) => {
      if (prev.includes(seatNo)) {
        return prev.filter((s) => s !== seatNo);
      }

      if (prev.length >= selectedSeats) {
        return prev;
      }

      return [...prev, seatNo];
    });
  };

  const totalAmount = selected.length * (category.price || 240);

  return (
    <div className="seat-page">
      <header className="seat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>

        <div>
          <h2>{movie.title} - ({movie.language})</h2>
          <p>
            {theatre.name} | {showtime.date?.label}, {showtime.date?.day}{" "}
            {showtime.date?.month}, 2026 | {showtime.time}
          </p>
        </div>

        <button className="ticket-count">{selectedSeats} Tickets</button>
      </header>

      <div className="time-bar">
        <button className="active-time">{showtime.time}</button>
      </div>

      <main className="seat-area">
        <div className="row-side">
          {["A", "B", "C", "D", "E", "F", "G", "", "H", "I", "", "J", "K"].map(
            (r, i) => (
              <span key={i}>{r}</span>
            )
          )}
        </div>

        <div className="seat-layout">
          {seatSections.map((section) => (
            <div className="seat-section" key={section.title}>
              <h3>{section.title}</h3>

              {section.rows.map((row) => (
                <div className="seat-row" key={row}>
                  <div className="seat-gap"></div>

                  {Array.from({ length: 17 }, (_, index) => {
                    const num = String(index + 1).padStart(2, "0");
                    const seatNo = `${row}${num}`;
                    const isSold = unavailableSeats.includes(seatNo);
                    const isSelected = selected.includes(seatNo);
                    const isDisabled = section.category !== activeCategory;

                    return (
                      <button
                        key={seatNo}
                        className={`seat 
                          ${isSold ? "sold" : ""} 
                          ${isSelected ? "selected" : ""} 
                          ${isDisabled ? "disabled-seat" : ""}
                        `}
                        disabled={isSold || isDisabled}
                        onClick={() => toggleSeat(seatNo, section.category)}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          <div className="screen-box">
            <div className="screen-line"></div>
            <p>SCREEN THIS WAY</p>
          </div>
        </div>

        <div className="zoom-icons">
          <button>＋</button>
          <button>－</button>
        </div>
      </main>

      <div className="legend">
        <span><i className="available"></i> Available</span>
        <span><i className="selected-box"></i> Selected</span>
        <span><i className="sold-box"></i> Sold</span>
        <span><i className="disabled-box"></i> Disabled</span>
      </div>

      {selected.length > 0 && (
        <footer className="booking-footer">
          <div>
            <strong>{selected.join(", ")}</strong>
            <p>{selected.length}/{selectedSeats} seats selected</p>
          </div>

          <div>
            <strong>
              <FaRupeeSign /> {totalAmount}
            </strong>
            <p>Total Amount</p>
          </div>

          <button
            disabled={selected.length !== selectedSeats}
            onClick={() => {
              const payload = { movie, theatre, showtime, seats: selected, totalAmount, category };
              sessionStorage.setItem("moviePayment", JSON.stringify(payload));
              navigate(`/dashboard/movies/${movie._id}/payment`, { state: payload });
            }}
          >
            Continue
          </button>
        </footer>
      )}
    </div>
  );
}

export default SeatSelection;
