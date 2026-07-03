import { useEffect, useState } from "react";
import { FaArrowLeft, FaCheckCircle, FaPlane, FaUser } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import "./FlightManageSeat.css";

const apiBase = "http://localhost:5000/api";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`, "Content-Type": "application/json" });

function FlightCheckIn() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/flight-bookings/${bookingId}/seats`, { headers: headers() })
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => ok ? setData(body) : setMessage(body.message || "Unable to load check-in"))
      .catch(() => setMessage("Unable to load check-in"));
  }, [bookingId]);

  const booking = data?.booking;
  const mode = booking?.seatSelectionMode || "CHECK_IN";
  const existingSeat = booking?.seatNumber;
  const requiresSelection = !existingSeat;

  const completeCheckIn = async () => {
    setSaving(true);
    setMessage("");
    const response = await fetch(`${apiBase}/flight-bookings/${bookingId}/check-in`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ seatNumber: selectedSeat }),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(body.message || "Unable to complete check-in");
    navigate(`/dashboard/flight-bookings/${bookingId}/boarding-pass`, { replace: true });
  };

  return (
    <section className="flight-manage-seat-page">
      <button className="flight-manage-back" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
      <header><FaPlane /><div><h1>Flight Check-in</h1><p>{booking?.title || "Flight booking"} · PNR {booking?.pnr || "-"}</p></div></header>
      {existingSeat && <div className="flight-checkin-notice">Your assigned seat is <strong>{existingSeat}</strong>. Continue to complete check-in.</div>}
      {data && requiresSelection && <div className="flight-manage-seat-grid">{data.seats.map((seat) => {
        const booked = seat.status !== "available";
        return <button key={seat.seatNumber} disabled={booked} className={`${booked ? "booked" : "available"} ${selectedSeat === seat.seatNumber ? "selected" : ""}`} onClick={() => setSelectedSeat(seat.seatNumber)}><FaUser /><span>{seat.seatNumber}</span></button>;
      })}</div>}
      {message && <p className="flight-seat-message">{message}</p>}
      {data && <button className="flight-manage-save" disabled={saving || (requiresSelection && !selectedSeat)} onClick={completeCheckIn}><FaCheckCircle /> {saving ? "Checking in..." : "Complete Check-in"}</button>}
    </section>
  );
}

export default FlightCheckIn;
