import { useEffect, useState } from "react";
import { FaArrowLeft, FaPlane } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate, useParams } from "react-router-dom";
import "./FlightBoardingPass.css";

const apiBase = "http://localhost:5000/api";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` });

function FlightBoardingPass() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [pass, setPass] = useState(null);
  const [message, setMessage] = useState("Loading boarding pass...");

  useEffect(() => {
    fetch(`${apiBase}/flight-bookings/${bookingId}`, { headers: headers() })
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => {
        if (!ok) return setMessage(body.message || "Boarding pass unavailable");
        if (body.checkInStatus !== "CHECKED_IN" || !body.boardingPassGenerated || !body.qrData) {
          setMessage("Complete check-in before viewing your boarding pass.");
          return;
        }
        setPass(body);
      })
      .catch(() => setMessage("Unable to load boarding pass"));
  }, [bookingId]);

  if (!pass) return <section className="boarding-pass-page"><button onClick={() => navigate("/dashboard/my-bookings")}><FaArrowLeft /> My Bookings</button><p>{message}</p></section>;
  const flight = pass.flight || {};
  const passenger = pass.details?.passenger || {};

  return (
    <section className="boarding-pass-page">
      <button className="boarding-pass-back" onClick={() => navigate("/dashboard/my-bookings")}><FaArrowLeft /> My Bookings</button>
      <article className="boarding-pass-card">
        <header><div><FaPlane /><strong>BOARDING PASS</strong></div><span>CHECKED-IN</span></header>
        <div className="boarding-pass-content">
          <div className="boarding-pass-fields">
            <p><span>Passenger</span><strong>{passenger.name || pass.customerName}</strong></p>
            <p><span>Flight</span><strong>{flight.airline} {flight.flightNumber}</strong></p>
            <p><span>Source</span><strong>{flight.fromCode || flight.from}</strong></p>
            <p><span>Destination</span><strong>{flight.toCode || flight.to}</strong></p>
            <p><span>Departure</span><strong>{flight.departureDate} {flight.departureTime}</strong></p>
            <p><span>Boarding Time</span><strong>To Be Announced</strong></p>
            <p><span>Gate</span><strong>To Be Announced</strong></p>
            <p><span>Seat</span><strong>{pass.seatNumber}</strong></p>
            <p><span>PNR</span><strong>{pass.pnr}</strong></p>
            <p><span>Status</span><strong>Checked-in</strong></p>
          </div>
          <div className="boarding-pass-qr"><QRCodeCanvas value={pass.qrData} size={185} level="H" includeMargin /><small>Scan to verify boarding pass</small></div>
        </div>
      </article>
      <button className="boarding-pass-print" onClick={() => window.print()}>Print Boarding Pass</button>
    </section>
  );
}

export default FlightBoardingPass;
