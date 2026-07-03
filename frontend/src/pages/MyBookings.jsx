import { useEffect, useMemo, useState } from "react";
import { FaTicketAlt } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

const flightCheckInWindow = (booking, now) => {
  const flight = booking.details?.flight || {};
  const hours = 24;
  const departure = new Date(`${flight.departureDate || ""}T${flight.departureTime || "00:00"}:00`).getTime();
  if (Number.isNaN(departure)) return { hours, open: false };
  return { hours, open: now >= departure - hours * 60 * 60 * 1000 && now < departure };
};

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }), []);

  const loadBookings = () => {
    fetch(`${apiBase}/bookings`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]));
  };

  useEffect(loadBookings, [authHeaders]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const cancelBooking = async (id) => {
    const response = await fetch(`${apiBase}/bookings/${id}/cancel`, {
      method: "PATCH",
      headers: authHeaders,
    });
    if (response.ok) loadBookings();
  };

  const getBookingId = (booking) => booking.bookingId || booking.booking_id || booking.bookingCode || booking.booking_code || booking._id || booking.id;
  const getQrValue = (booking) => booking.qrToken || booking.qr_token || booking.details?.qrToken || booking.details?.qr_token || getBookingId(booking);
  const getPnr = (booking) => booking.pnr || booking.details?.pnr || "Not available";
  const getAssignedSeat = (booking) => booking.seatNumber || booking.seats?.[0] || booking.details?.seats?.[0] || null;
  const getSeatSelectionMode = (booking) => booking.details?.seatSelectionMode || booking.details?.flight?.seatSelectionMode || "CHECK_IN";
  const isCheckedIn = (booking) => booking.checkInStatus === "CHECKED_IN" || booking.checkedIn;
  const isConfirmed = (booking) => String(booking.bookingStatus || booking.booking_status || booking.status || "").toLowerCase() === "confirmed";
  const getSeats = (booking) => {
    const seats = booking.seatNumbers || booking.seat_numbers || booking.seats || booking.details?.seats || [];
    if (Array.isArray(seats)) return seats.join(", ");
    return String(seats || "Not available");
  };

  return (
    <section className="section-block">
      <div className="section-header"><h3>My Bookings</h3><button className="search-submit-btn" onClick={() => navigate("/dashboard/my-hotel-bookings")}>Hotel Bookings</button></div>
      {bookings.map((booking) => (
        <div className="summary-booking-card" key={booking._id}>
          <div className="summary-card-left">
            <div className="summary-icon-box movies"><FaTicketAlt /></div>
            <div className="summary-info">
              <h4>{booking.title}</h4>
              <p className="subtitle">{booking.module} - {getBookingId(booking)}</p>
              <p className="time-details">{booking.module === "flight" ? `Confirmed flight ticket - PNR ${getPnr(booking)}` : "QR Ticket and invoice ready"}</p>
              {booking.module === "flight" && <p className="time-details">Seat: {getAssignedSeat(booking) || "Not Assigned"}</p>}
              {booking.module === "flight" && !getAssignedSeat(booking) && getSeatSelectionMode(booking) === "CHECK_IN" && <p className="time-details">Seat selection will open 24 hours before departure.</p>}
              {booking.module === "flight" && !isCheckedIn(booking) && !flightCheckInWindow(booking, now).open && <p className="time-details">Check-in opens {flightCheckInWindow(booking, now).hours} hours before departure.</p>}
            </div>
          </div>
          <div className="summary-card-right">
            <span className="status-badge green">{booking.status}</span>
            <h3 className="summary-price">Rs {booking.amount}</h3>
            {booking.module !== "flight" && isConfirmed(booking) && (
              <div className="booking-qr-mini">
                <QRCodeCanvas value={getQrValue(booking)} size={82} level="M" includeMargin />
              </div>
            )}
            {booking.module === "flight" && getSeatSelectionMode(booking) === "AFTER_BOOKING" && !getAssignedSeat(booking) && <button className="search-submit-btn" onClick={() => navigate(`/dashboard/flight-bookings/${booking._id}/manage-seat`)}>Select Seat</button>}
            {booking.module === "flight" && !isCheckedIn(booking) && <button className="search-submit-btn" disabled={!flightCheckInWindow(booking, now).open} onClick={() => navigate(`/dashboard/flight-bookings/${booking._id}/check-in`)}>Check-in</button>}
            {booking.module === "flight" && isCheckedIn(booking) && <button className="search-submit-btn" onClick={() => navigate(`/dashboard/flight-bookings/${booking._id}/boarding-pass`)}>View Boarding Pass</button>}
            {isConfirmed(booking) && <button className="search-submit-btn" onClick={() => setSelectedTicket(booking)}>View Ticket</button>}
            {booking.status === "confirmed" && <button className="text-action" onClick={() => cancelBooking(booking._id)}>Cancel</button>}
          </div>
        </div>
      ))}

      {selectedTicket && (
        <div className="ticket-modal-backdrop" role="presentation" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="ticket-modal-close" onClick={() => setSelectedTicket(null)}>Close</button>
            <div className="ticket-modal-head">
              <FaTicketAlt />
              <div>
                <h3>{selectedTicket.title}</h3>
                <p>{getBookingId(selectedTicket)}</p>
              </div>
            </div>
            <div className="ticket-modal-grid">
              <p><strong>{selectedTicket.module === "flight" ? "Flight" : "Movie Name"}</strong><span>{selectedTicket.title}</span></p>
              <p><strong>Booking ID</strong><span>{getBookingId(selectedTicket)}</span></p>
              <p><strong>Status</strong><span>{selectedTicket.bookingStatus || selectedTicket.booking_status || selectedTicket.status}</span></p>
              {selectedTicket.module === "flight" ? (
                <>
                  <p><strong>PNR</strong><span>{getPnr(selectedTicket)}</span></p>
                  <p><strong>Passenger</strong><span>{selectedTicket.details?.passenger?.name || selectedTicket.customerName || "Not available"}</span></p>
                  <p><strong>Route</strong><span>{selectedTicket.details?.flight?.fromCode || "-"} to {selectedTicket.details?.flight?.toCode || "-"}</span></p>
                  <p><strong>Departure</strong><span>{selectedTicket.details?.flight?.departureDate || ""} {selectedTicket.details?.flight?.departureTime || ""}</span></p>
                  <p><strong>Payment Status</strong><span>{selectedTicket.paymentStatus || "PAID"}</span></p>
                  <p><strong>Seat</strong><span>{selectedTicket.seatNumber || getSeats(selectedTicket) || "Not Assigned"}</span></p>
                  <p><strong>Check-in</strong><span>{selectedTicket.checkInStatus || "NOT_CHECKED_IN"}</span></p>
                </>
              ) : (
                <>
                  <p><strong>Theatre</strong><span>{selectedTicket.theatre || selectedTicket.details?.theatre?.name || selectedTicket.details?.theatre || "Not available"}</span></p>
                  <p><strong>Show Time</strong><span>{selectedTicket.showTime || selectedTicket.show_time || selectedTicket.details?.showTime || "Not available"}</span></p>
                  <p><strong>Seat Numbers</strong><span>{getSeats(selectedTicket)}</span></p>
                </>
              )}
              <p><strong>Price</strong><span>Rs {selectedTicket.totalAmount || selectedTicket.total_amount || selectedTicket.amount || 0}</span></p>
            </div>
            {selectedTicket.module !== "flight" && <div className="ticket-modal-qr">
              <QRCodeCanvas value={getQrValue(selectedTicket)} size={190} level="H" includeMargin />
              <span>{selectedTicket.qrToken || selectedTicket.qr_token ? "Scan this QR at entry" : "Temporary QR uses booking ID"}</span>
            </div>}
          </div>
        </div>
      )}
    </section>
  );
}

export default MyBookings;
