import { useEffect, useState } from "react";
import { FaArrowLeft, FaCheckCircle, FaPlane, FaUser } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import "./FlightManageSeat.css";

const apiBase = "http://localhost:5000/api";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

function FlightManageSeat() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/flight-bookings/${bookingId}/seats`, { headers: authHeaders() })
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => {
        if (!ok) return setMessage(body.message || "Unable to load seats");
        if (body.booking?.seatSelectionMode !== "AFTER_BOOKING") {
          return setMessage("Manual seat selection is not available for this flight.");
        }
        setData(body);
      })
      .catch(() => setMessage("Unable to load seats"));
  }, [bookingId]);

  const saveSeat = async () => {
    setSaving(true);
    setMessage("");
    const response = await fetch(`${apiBase}/flight-bookings/${bookingId}/seat`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ seatNumber: selectedSeat }),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(body.message || "Unable to assign seat");
    navigate("/dashboard/my-bookings", { replace: true });
  };

  return (
    <section className="flight-manage-seat-page">
      <button className="flight-manage-back" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
      <header><FaPlane /><div><h1>Manage Flight Seat</h1><p>{data?.booking?.title || "Flight booking"} · PNR {data?.booking?.pnr || "-"}</p></div></header>
      {message && <p className="flight-seat-message">{message}</p>}
      {data && (
        <>
          <div className="flight-manage-seat-grid">
            {data.seats.map((seat) => {
              const booked = seat.status !== "available";
              return <button key={seat.seatNumber} disabled={booked} className={`${booked ? "booked" : "available"} ${selectedSeat === seat.seatNumber ? "selected" : ""}`} onClick={() => setSelectedSeat(seat.seatNumber)}><FaUser /><span>{seat.seatNumber}</span></button>;
            })}
          </div>
          <div className="flight-manage-legend"><span className="available">Available</span><span className="selected">Selected</span><span className="booked">Booked</span></div>
          <button className="flight-manage-save" disabled={!selectedSeat || saving} onClick={saveSeat}><FaCheckCircle /> {saving ? "Saving..." : `Save Seat ${selectedSeat}`}</button>
        </>
      )}
    </section>
  );
}

export default FlightManageSeat;
