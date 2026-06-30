import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaPlane, FaUser } from "react-icons/fa";
import "./FlightSeatSelection.css";

const layouts = {
  A320: { columns: ["A", "B", "C", "D", "E", "F"], groups: [3, 3], rows: 28, exitRows: [12, 13] },
  B737: { columns: ["A", "B", "C", "D", "E", "F"], groups: [3, 3], rows: 30, exitRows: [14, 15] },
  ATR72: { columns: ["A", "B", "C", "D"], groups: [2, 2], rows: 18, exitRows: [7] },
  B777: { columns: ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"], groups: [3, 4, 3], rows: 35, exitRows: [16, 17] },
};

const getLayout = (aircraft = "") => {
  const key = Object.keys(layouts).find((item) =>
    aircraft.toUpperCase().includes(item)
  );
  return layouts[key] || layouts.A320;
};

const getSeatType = (columns, column) => {
  const index = columns.indexOf(column);

  if (index === 0 || index === columns.length - 1) return "Window";

  if (columns.length === 10 && ["C", "D", "G", "H"].includes(column)) {
    return "Aisle";
  }

  if (["C", "D"].includes(column)) return "Aisle";

  return "Middle";
};

function FlightSeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const saved = JSON.parse(sessionStorage.getItem("selectedFlight") || "null");
  const payload = location.state || saved || {};
  const { flight, search = {} } = payload;

  const cabinClass =
    search.cabinClass ||
    flight?.cabinClass ||
    flight?.cabinClasses?.[0] ||
    "Economy";

  const totalTravellers = Number(search.passengers || 1);
  const [selectedSeats, setSelectedSeats] = useState([]);

  if (!flight) {
    return (
      <div className="flight-empty">
        <h1>No flight selected</h1>
        <button onClick={() => navigate("/dashboard/flights")}>
          Back to Flights
        </button>
      </div>
    );
  }

  const layout = getLayout(flight?.aircraftType || flight?.aircraft || "");
  const reservedSeats = new Set(flight.reservedSeats || []);

  const seatFee =
    cabinClass === "Business Class"
      ? 950
      : cabinClass === "Premium Economy"
      ? 550
      : 250;

  const toggleSeat = (seatId) => {
    if (reservedSeats.has(seatId)) return;

    setSelectedSeats((current) => {
      if (current.includes(seatId)) {
        return current.filter((seat) => seat !== seatId);
      }

      if (current.length >= totalTravellers) return current;

      return [...current, seatId];
    });
  };

  const continueFlow = () => {
    const nextPayload = {
      flight,
      search,
      cabinClass,
      totalTravellers,
      seats: selectedSeats,
      seatFee,
    };

    sessionStorage.setItem("flightSeatSelection", JSON.stringify(nextPayload));

    navigate(`/dashboard/flights/${flight.id || flight._id}/passengers`, {
      state: nextPayload,
    });
  };

  const renderSeatGroups = (row) => {
    let startIndex = 0;

    return layout.groups.map((groupCount, groupIndex) => {
      const groupColumns = layout.columns.slice(
        startIndex,
        startIndex + groupCount
      );

      startIndex += groupCount;

      return (
        <div className="seat-group" key={`${row}-${groupIndex}`}>
          {groupColumns.map((column) => {
            const seatId = `${row}${column}`;
            const reserved = reservedSeats.has(seatId);
            const selected = selectedSeats.includes(seatId);
            const seatKind = getSeatType(layout.columns, column);

            return (
              <button
                key={seatId}
                className={`flight-seat ${seatKind.toLowerCase()} ${
                  reserved ? "reserved" : ""
                } ${selected ? "selected" : ""}`}
                disabled={reserved}
                onClick={() => toggleSeat(seatId)}
                title={`${seatId} | ${seatKind}`}
              >
                <FaUser />
                <small>{column}</small>
              </button>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="flight-seat-page">
      <header className="flight-step-header">
        <button onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>

        <div>
          <h1>Select Your Flight Seat</h1>
          <p>
            {flight.airline || "Airline"} •{" "}
            {flight.aircraftType || flight.aircraft || "A320"} • {cabinClass}
          </p>
        </div>
      </header>

      <main className="flight-seat-layout">
        <section className="aircraft-card">
          <div className="aircraft-front">
            <FaPlane />
            <span>Front</span>
          </div>

          <div className="cabin-info">
            <span>{cabinClass}</span>
            <span>Select {totalTravellers} seat(s)</span>
          </div>

          <div className="aircraft-body">
            <div className="column-header">
              {layout.groups.map((group, index) => {
                const previous = layout.groups
                  .slice(0, index)
                  .reduce((a, b) => a + b, 0);

                return (
                  <div className="seat-group" key={index}>
                    {layout.columns
                      .slice(previous, previous + group)
                      .map((col) => (
                        <span key={col}>{col}</span>
                      ))}
                  </div>
                );
              })}
            </div>

            {Array.from({ length: layout.rows }, (_, index) => {
              const row = index + 1;
              const isExit = layout.exitRows.includes(row);

              return (
                <React.Fragment key={row}>
                  {isExit && (
                    <div className="exit-row-label">
                      Emergency Exit Row
                    </div>
                  )}

                  <div className={`aircraft-row ${isExit ? "exit-row" : ""}`}>
                    <span className="row-number">{row}</span>
                    <div className="row-seats">{renderSeatGroups(row)}</div>
                    <span className="row-number">{row}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </section>

        <aside className="seat-summary-card">
          <h2>Seat Summary</h2>

          <div className="summary-box">
            <span>Passenger</span>
            <strong>{totalTravellers}</strong>
          </div>

          <div className="summary-box">
            <span>Seat Fee</span>
            <strong>₹{seatFee} / seat</strong>
          </div>

          <div className="summary-box">
            <span>Selected</span>
            <strong>{selectedSeats.join(", ") || "Not selected"}</strong>
          </div>

          <div className="seat-legend">
            <p><i className="available"></i> Available</p>
            <p><i className="selected"></i> Selected</p>
            <p><i className="reserved"></i> Reserved</p>
            <p><i className="window"></i> Window</p>
            <p><i className="aisle"></i> Aisle</p>
            <p><i className="middle"></i> Middle</p>
          </div>

          <button
            disabled={selectedSeats.length !== totalTravellers}
            onClick={continueFlow}
          >
            <FaCheckCircle />
            Continue
          </button>
        </aside>
      </main>
    </div>
  );
}

export default FlightSeatSelection;