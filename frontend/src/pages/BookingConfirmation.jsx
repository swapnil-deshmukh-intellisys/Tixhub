import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTicketAlt } from "react-icons/fa";
import "./Dashboard.css";
import "./FlightPayment.css";

function BookingConfirmation({ type = "movie" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const savedKey = type === "flight" ? "flightConfirmation" : "movieConfirmation";
  const saved = JSON.parse(sessionStorage.getItem(savedKey) || "null");
  const payload = location.state || saved || {};
  const booking = payload.booking;
  const flight = payload.flight || booking?.details?.flight || {};
  const passenger = payload.passenger || booking?.details?.passenger || {};
  const pnr = booking?.pnr || booking?.details?.pnr || payload.pnr || "Not available";
  const seatSelectionMode = flight.seatSelectionMode || booking?.details?.seatSelectionMode || "CHECK_IN";
  // Flight seat assignment must come from the confirmed server booking, never stale client state.
  const seatNumber = booking?.seatNumber || booking?.seats?.[0] || (type !== "flight" ? payload.seats?.[0] : null);
  const title = type === "flight"
    ? `${payload.flight?.airline || "Flight"} ${payload.flight?.flightNumber || ""}`
    : payload.movie?.title || "Movie";

  return (
    <section className="section-block">
      <div className="wallet-card profile-panel">
        <FaCheckCircle className="wallet-icon" />
        <div>
          <h2>{type === "flight" ? "Flight Ticket Confirmed" : "Booking Confirmed"}</h2>
          <p>{title}</p>
          <p><FaTicketAlt /> {booking?.bookingCode || "Confirmation saved"}</p>
        </div>
      </div>
      <div className="wallet-transactions">
        <div className="transaction-card"><div><h4>Booking ID</h4><p>{booking?.bookingCode || "Not available"}</p></div><span className="green">Confirmed</span></div>
        {type === "flight" && <div className="transaction-card"><div><h4>PNR Number</h4><p>{pnr}</p></div><span>{flight.fromCode} to {flight.toCode}</span></div>}
        {type === "flight" && <div className="transaction-card"><div><h4>Passenger</h4><p>{passenger.name || "Not available"}</p></div><span>{passenger.email || passenger.mobile || ""}</span></div>}
        {type === "flight" && <div className="transaction-card"><div><h4>Flight Details</h4><p>{flight.airline} {flight.flightNumber}</p></div><span>{flight.departureDate} {flight.departureTime}</span></div>}
        {type === "flight" && <div className="transaction-card"><div><h4>Booking Status</h4><p>{booking?.bookingStatus || "CONFIRMED"}</p></div><span>Payment: {booking?.paymentStatus || "PAID"}</span></div>}
        {type === "movie" && <div className="transaction-card"><div><h4>Theatre</h4><p>{payload.theatre?.name || "Not available"}</p></div><span>{payload.showtime?.time}</span></div>}
        <div className="transaction-card"><div><h4>Seat</h4><p>{seatNumber || "Not Assigned"}</p></div><span>Rs {payload.totalAmount || booking?.amount || 0}</span></div>
        {type === "flight" && <div className="transaction-card"><div><h4>Check-in Status</h4><p>{booking?.checkInStatus || "NOT_CHECKED_IN"}</p></div><span>{seatSelectionMode === "CHECK_IN" ? "Seat selection will open during check-in." : seatSelectionMode === "AFTER_BOOKING" ? "Manage your booking to select a seat." : seatSelectionMode === "AUTO_ASSIGN" ? "Seat will be assigned during check-in." : "Boarding pass not generated"}</span></div>}
        <div className="transaction-card"><div><h4>Download Ticket</h4><p>{type === "flight" ? "This is your booking confirmation ticket, not a boarding pass." : "Your ticket is ready in My Bookings."}</p></div><button className="search-submit-btn" onClick={() => window.print()}>Download</button></div>
      </div>
      <button className="search-submit-btn" onClick={() => navigate("/dashboard/my-bookings")}>
        View My Bookings
      </button>
    </section>
  );
}

export default BookingConfirmation;
