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
    category: "Prime",
  },
  {
    title: "₹240 CLASSIC ROWS",
    rows: ["J", "K"],
    price: 240,
    category: "Regular",
  },
];

const seatCategoryLabels = {
  vip: "VIP",
  prime: "Prime",
  regular: "Regular",
  recliner: "VIP",
  prime_plus: "Prime",
  classic: "Regular",
  "classic plus": "Prime",
};

const normalizeSeatCategory = (value) => seatCategoryLabels[String(value || "").toLowerCase()] || String(value || "Regular");

const groupLiveSeats = (seats) => {
  const byCategory = new Map();
  seats.forEach((seat) => {
    const categoryName = normalizeSeatCategory(seat.seatType || seat.category);
    const seatNo = seat.seatNo || seat.seatNumber;
    const rowName = seat.rowName || String(seatNo || "").replace(/\d/g, "") || "A";
    if (!byCategory.has(categoryName)) byCategory.set(categoryName, new Map());
    const rows = byCategory.get(categoryName);
    if (!rows.has(rowName)) rows.set(rowName, []);
    rows.get(rowName).push({ ...seat, seatNo, rowName });
  });

  return ["VIP", "Prime", "Regular"].map((categoryName) => {
    const rows = byCategory.get(categoryName) || new Map();
    return {
      category: categoryName,
      price: rows.values().next().value?.[0]?.price || 0,
      rows: [...rows.entries()].map(([row, rowSeats]) => ({
        row,
        seats: rowSeats.sort((a, b) => Number(String(a.seatNumber || a.seatNo).replace(/\D/g, "")) - Number(String(b.seatNumber || b.seatNo).replace(/\D/g, ""))),
      })),
    };
  }).filter((section) => section.rows.length);
};

function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    movie,
    theatre,
    showtime,
    selectedSeats = 2,
    category = { name: "Regular", price: 240 },
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

    fetch(`http://localhost:5000/api/seats/${encodeURIComponent(showId)}?movieId=${encodeURIComponent(movie._id)}&theatre=${encodeURIComponent(theatreName)}&screenId=${encodeURIComponent(movie.screenNumber || movie.screenName || "Screen 1")}&showDate=${encodeURIComponent(showDate)}&showTime=${encodeURIComponent(showTime)}&totalSeats=${encodeURIComponent(movie.totalSeats || 187)}&regularSeats=${encodeURIComponent(movie.regularSeats || 0)}&primeSeats=${encodeURIComponent(movie.primeSeats || 0)}&vipSeats=${encodeURIComponent(movie.vipSeats || 0)}&blockedSeats=${encodeURIComponent(movie.blockedSeats || 0)}&price=${encodeURIComponent(movie.ticketPrice || category.price || 240)}&regularSeatPrice=${encodeURIComponent(movie.regularSeatPrice || movie.ticketPrice || category.price || 240)}&premiumSeatPrice=${encodeURIComponent(movie.premiumSeatPrice || movie.primeSeatPrice || movie.ticketPrice || category.price || 240)}&vipSeatPrice=${encodeURIComponent(movie.vipSeatPrice || movie.ticketPrice || category.price || 240)}`, {
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

  const activeCategory = category.name || "Regular";
  const liveSections = useMemo(() => groupLiveSeats(liveSeats), [liveSeats]);
  const useLiveLayout = liveSections.length > 0;
  const activeLiveCategory = normalizeSeatCategory(activeCategory);

  const toggleSeat = (seatNo, sectionCategory) => {
    const normalizedSection = normalizeSeatCategory(sectionCategory);
    const normalizedActive = normalizeSeatCategory(activeCategory);
    if (normalizedSection !== normalizedActive && !useLiveLayout) return;
    if (useLiveLayout && normalizedSection !== normalizedActive) return;
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
          {(useLiveLayout ? liveSections.flatMap((section) => [...section.rows.map((row) => row.row), ""]) : ["A", "B", "C", "D", "E", "F", "G", "", "H", "I", "", "J", "K"]).map(
            (r, i) => (
              <span key={i}>{r}</span>
            )
          )}
        </div>

        <div className="seat-layout">
          {useLiveLayout ? liveSections.map((section) => (
            <div className="seat-section" key={section.category}>
              <h3>Rs {section.price || category.price || 0} {section.category.toUpperCase()} ROWS</h3>

              {section.rows.map(({ row, seats }) => (
                <div className="seat-row" key={row}>
                  <div className="seat-gap"></div>

                  {seats.map((seat) => {
                    const seatNo = seat.seatNo || seat.seatNumber;
                    const displayNo = String(seat.seatNumber || seatNo).replace(row, "");
                    const isSold = unavailableSeats.includes(seatNo) || unavailableSeats.includes(seat.seatNumber);
                    const isSelected = selected.includes(seatNo);
                    const isDisabled = normalizeSeatCategory(section.category) !== activeLiveCategory;

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
                        {displayNo}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )) : seatSections.map((section) => (
            <div className="seat-section" key={section.title}>
              <h3>Rs {section.price} {section.category.toUpperCase()} ROWS</h3>

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
