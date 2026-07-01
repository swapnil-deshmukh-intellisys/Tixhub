import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fallbackHotelFlow } from "../data/hotelDemoData";
import { BookingSummary } from "./HotelRoomSelection";
import "./HotelBookingFlow.css";

export default function HotelGuestDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fallback = fallbackHotelFlow();
  const hotel = location.state?.hotel || fallback.hotel;
  const room = location.state?.room || fallback.room;
  const search = location.state?.search || fallback.search;
  const pricing = location.state?.pricing || fallback.pricing;
  const [guest, setGuest] = useState({
    fullName: "",
    mobile: "",
    email: "",
    age: "",
    gender: "",
    specialRequest: "",
  });

  const updateGuest = (key, value) => {
    setGuest((current) => ({ ...current, [key]: value }));
  };

  const continueToPayment = (event) => {
    event.preventDefault();
    navigate(`/dashboard/hotels/${id || hotel.id}/payment`, {
      state: { hotel, room, search, pricing, guest },
    });
  };

  return (
    <div className="th-hotel-page">
      <div className="th-hotel-stepper">
        <span className="active" /><span className="active" /><span /><span />
      </div>
      <div className="th-hotel-heading">
        <div>
          <button className="th-hotel-back" type="button" onClick={() => navigate(-1)}>
            ← Room selection
          </button>
          <h1>Guest details</h1>
          <p className="th-hotel-muted">Enter the primary guest information for this booking.</p>
        </div>
      </div>

      <div className="th-hotel-flow-layout">
        <form className="th-hotel-card th-hotel-form-card" onSubmit={continueToPayment}>
          <h2>Primary guest</h2>
          <div className="th-hotel-form-grid">
            <GuestField
              label="Full name"
              value={guest.fullName}
              onChange={(value) => updateGuest("fullName", value)}
              placeholder="Name as on government ID"
              required
            />
            <GuestField
              label="Mobile number"
              type="tel"
              value={guest.mobile}
              onChange={(value) => updateGuest("mobile", value)}
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              required
            />
            <GuestField
              label="Email address"
              type="email"
              value={guest.email}
              onChange={(value) => updateGuest("email", value)}
              placeholder="Confirmation will be sent here"
              required
            />
            <GuestField
              label="Age"
              type="number"
              min="1"
              max="110"
              value={guest.age}
              onChange={(value) => updateGuest("age", value)}
              required
            />
            <label className="th-hotel-field">
              <span>Gender</span>
              <select
                value={guest.gender}
                onChange={(event) => updateGuest("gender", event.target.value)}
                required
              >
                <option value="">Select gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>
            <label className="th-hotel-field wide">
              <span>Special request (optional)</span>
              <textarea
                value={guest.specialRequest}
                onChange={(event) => updateGuest("specialRequest", event.target.value)}
                placeholder="Arrival time, accessibility, bed preference..."
              />
            </label>
          </div>
          <div className="th-hotel-form-actions">
            <button className="th-hotel-btn" type="submit">
              Continue to Payment
            </button>
          </div>
        </form>

        <BookingSummary hotel={hotel} room={room} search={search} pricing={pricing} />
      </div>
    </div>
  );
}

function GuestField({ label, onChange, ...props }) {
  return (
    <label className="th-hotel-field">
      <span>{label}</span>
      <input {...props} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
