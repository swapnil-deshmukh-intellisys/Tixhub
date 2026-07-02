import { useEffect, useState } from "react";
import { FaCheckCircle, FaPlane, FaTimesCircle } from "react-icons/fa";
import { useParams } from "react-router-dom";
import "./FlightBoardingPass.css";

const apiBase = "http://localhost:5000/api";

function VerifyBoardingPass() {
  const { bookingId } = useParams();
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("Verifying boarding pass...");
  const [valid, setValid] = useState(null);

  useEffect(() => {
    fetch(`${apiBase}/boarding-pass/verify/${encodeURIComponent(bookingId)}`)
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => {
        if (!ok) {
          setValid(false);
          return setMessage(body.message || "Invalid boarding pass");
        }
        setResult(body.boardingPass);
        setValid(true);
        setMessage("");
      })
      .catch(() => { setValid(false); setMessage("Unable to verify boarding pass"); });
  }, [bookingId]);

  return (
    <main className="boarding-pass-verify-page">
      <section className="boarding-pass-verify-card">
        <h1><FaPlane /> Boarding Pass Verification</h1>
        {valid === null && message && <p>{message}</p>}
        {valid === false && <div className="boarding-pass-invalid"><FaTimesCircle /><h2>Invalid Boarding Pass</h2><p>{message}</p></div>}
        {result && <div className="boarding-pass-valid"><FaCheckCircle /><h2>Valid Boarding Pass</h2><p><strong>Passenger:</strong> {result.passengerName}</p><p><strong>PNR:</strong> {result.pnr}</p><p><strong>Flight:</strong> {result.airline} {result.flightNumber}</p><p><strong>Route:</strong> {result.source} to {result.destination}</p><p><strong>Departure:</strong> {result.departureDate} {result.departureTime}</p><p><strong>Seat:</strong> {result.seatNumber}</p><p><strong>Check-in status:</strong> {result.checkInStatus}</p><p><strong>Boarding pass generated:</strong> {result.boardingPassGenerated ? "Yes" : "No"}</p></div>}
      </section>
    </main>
  );
}

export default VerifyBoardingPass;
