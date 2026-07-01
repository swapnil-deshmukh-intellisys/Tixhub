import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { fallbackHotelFlow, formatHotelMoney } from "../data/hotelDemoData";
import { BookingSummary } from "./HotelRoomSelection";
import "./HotelBookingFlow.css";

const paymentMethods = [
  ["card", "Card", CreditCard],
  ["upi", "UPI", Smartphone],
  ["netbanking", "Net banking", Landmark],
  ["wallet", "Wallet", Wallet],
];

export default function HotelPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const fallback = fallbackHotelFlow();
  const hotel = location.state?.hotel || fallback.hotel;
  const room = location.state?.room || fallback.room;
  const search = location.state?.search || fallback.search;
  const pricing = location.state?.pricing || fallback.pricing;
  const guest = location.state?.guest || {
    fullName: "Demo Guest",
    mobile: "9999999999",
    email: "guest@example.com",
    age: "28",
    gender: "Other",
    specialRequest: "",
  };
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);

  const payNow = () => {
    setProcessing(true);
    window.setTimeout(() => {
      const booking = {
        bookingId: `THH${Date.now().toString(36).toUpperCase()}`,
        hotel,
        room,
        search,
        pricing,
        guest,
        paymentMethod: method,
        paymentStatus: "success",
        bookingStatus: "confirmed",
        paidAt: new Date().toISOString(),
      };
      const saved = JSON.parse(localStorage.getItem("tixhubDemoHotelBookings") || "[]");
      localStorage.setItem(
        "tixhubDemoHotelBookings",
        JSON.stringify([booking, ...saved]),
      );
      navigate(`/dashboard/hotels/confirmation/${booking.bookingId}`, {
        state: { booking },
      });
    }, 900);
  };

  return (
    <div className="th-hotel-page">
      <div className="th-hotel-stepper">
        <span className="active" /><span className="active" />
        <span className="active" /><span />
      </div>
      <div className="th-hotel-heading">
        <div>
          <button className="th-hotel-back" type="button" onClick={() => navigate(-1)}>
            ← Guest details
          </button>
          <h1>Secure payment</h1>
          <p className="th-hotel-muted">Choose a payment method to confirm your stay.</p>
        </div>
      </div>

      <div className="th-hotel-flow-layout">
        <section className="th-hotel-card th-hotel-form-card">
          <h2>Payment method</h2>
          <div className="th-hotel-payment-methods">
            {paymentMethods.map(([value, label, Icon]) => (
              <label
                className={`th-hotel-payment-option ${method === value ? "active" : ""}`}
                key={value}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={method === value}
                  onChange={() => setMethod(value)}
                />
                <Icon size={21} /> {label}
              </label>
            ))}
          </div>

          {method === "card" && (
            <div className="th-hotel-form-grid">
              <label className="th-hotel-field wide">
                <span>Card number</span>
                <input inputMode="numeric" placeholder="4111 1111 1111 1111" />
              </label>
              <label className="th-hotel-field">
                <span>Expiry</span><input placeholder="MM/YY" />
              </label>
              <label className="th-hotel-field">
                <span>CVV</span><input type="password" placeholder="123" />
              </label>
            </div>
          )}
          {method === "upi" && (
            <label className="th-hotel-field">
              <span>UPI ID</span><input placeholder="name@bank" />
            </label>
          )}
          {method === "netbanking" && (
            <label className="th-hotel-field">
              <span>Select bank</span>
              <select defaultValue="">
                <option value="" disabled>Choose your bank</option>
                <option>State Bank of India</option>
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
              </select>
            </label>
          )}
          {method === "wallet" && (
            <div className="th-hotel-pay-note">Your TixWallet will be selected for this mock payment.</div>
          )}

          <p className="th-hotel-pay-note">
            Demo checkout: clicking Pay Now will simulate a successful payment. No real charge is made.
          </p>
          <div className="th-hotel-form-actions">
            <button className="th-hotel-btn" type="button" disabled={processing} onClick={payNow}>
              {processing ? "Processing payment..." : `Pay Now ${formatHotelMoney(pricing.total)}`}
            </button>
          </div>
        </section>

        <BookingSummary hotel={hotel} room={room} search={search} pricing={pricing} />
      </div>
    </div>
  );
}
