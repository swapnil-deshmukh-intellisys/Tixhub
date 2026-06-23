import React, { useEffect, useMemo, useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./SeatCountModal.css";

const toNumber = (value) => Number(value || 0);

function SeatCountModal({ movie, onClose, onSelectSeats }) {
  const [seatCount, setSeatCount] = useState(2);
  const priceCategories = useMemo(() => {
    const categories = [
      {
        name: "VIP",
        key: "vip",
        seats: toNumber(movie?.vipSeats),
        price: toNumber(movie?.vipSeatPrice),
      },
      {
        name: "Prime",
        key: "prime",
        seats: toNumber(movie?.primeSeats),
        price: toNumber(movie?.primeSeatPrice || movie?.premiumSeatPrice),
      },
      {
        name: "Regular",
        key: "regular",
        seats: toNumber(movie?.regularSeats),
        price: toNumber(movie?.regularSeatPrice || movie?.ticketPrice),
      },
    ];

    return categories.filter((item) => item.seats > 0 || item.price > 0);
  }, [movie]);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    setCategory(priceCategories[0] || null);
  }, [priceCategories]);

  return (
    <div className="seat-count-backdrop">
      <div className="seat-count-modal">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>

        <div className="seat-count-header">
          <h2>{movie?.title || "Movie Name"}</h2>
          <span>How many seats?</span>
        </div>

        <div className="seat-count-options">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
            <button
              key={count}
              className={seatCount === count ? "active" : ""}
              onClick={() => setSeatCount(count)}
            >
              {count}
            </button>
          ))}
        </div>

        <div className="price-category-list">
          {priceCategories.map((item) => (
            <button
              key={item.name}
              className={category?.name === item.name ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              <span>{item.name}</span>
              <strong>Rs {item.price}</strong>
            </button>
          ))}
        </div>

        <button
          className="select-seats-btn"
          disabled={!category}
          onClick={() =>
            onSelectSeats({
              seatCount,
              category,
            })
          }
        >
          Select Seats
        </button>
      </div>
    </div>
  );
}

export default SeatCountModal;
