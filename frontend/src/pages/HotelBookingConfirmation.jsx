import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Download, ListChecks } from "lucide-react";
import {
  fallbackHotelFlow,
  formatHotelDate,
  formatHotelMoney,
} from "../data/hotelDemoData";
import "./HotelBookingFlow.css";

export default function HotelBookingConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fallback = fallbackHotelFlow();
  const savedBookings = JSON.parse(
    localStorage.getItem("tixhubDemoHotelBookings") || "[]",
  );
  const booking =
    location.state?.booking ||
    savedBookings.find((item) => item.bookingId === id) || {
      bookingId: id || "THH-DEMO-BOOKING",
      ...fallback,
      guest: {
        fullName: "Demo Guest",
        mobile: "9999999999",
        email: "guest@example.com",
        age: "28",
        gender: "Other",
      },
      paymentMethod: "card",
      paymentStatus: "success",
      bookingStatus: "confirmed",
    };

  const downloadInvoice = () => {
    const invoice = `
      <html><body style="font-family:Arial;padding:32px;color:#17352c">
        <h1 style="color:#07875b">TixHub Hotel Invoice</h1>
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <h2>${booking.hotel.name}</h2>
        <p>${booking.room.name}</p>
        <p>${formatHotelDate(booking.search.checkIn)} to ${formatHotelDate(booking.search.checkOut)}</p>
        <p><strong>Guest:</strong> ${booking.guest.fullName}</p>
        <p><strong>Room subtotal:</strong> ${formatHotelMoney(booking.pricing.roomSubtotal)}</p>
        <p><strong>Offer discount:</strong> ${formatHotelMoney(booking.pricing.offerDiscount)}</p>
        <p><strong>Taxes:</strong> ${formatHotelMoney(booking.pricing.taxes)}</p>
        <h2>Total paid: ${formatHotelMoney(booking.pricing.total)}</h2>
        <p>Payment status: Success (mock payment)</p>
      </body></html>`;
    const blob = new Blob([invoice], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TixHub-${booking.bookingId}-invoice.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="th-hotel-page">
      <div className="th-hotel-stepper">
        <span className="active" /><span className="active" />
        <span className="active" /><span className="active" />
      </div>
      <section className="th-hotel-card th-hotel-confirmation">
        <div className="th-hotel-success-icon">
          <CheckCircle2 size={38} />
        </div>
        <h1>Hotel booking confirmed!</h1>
        <p className="th-hotel-muted">
          A mock confirmation has been prepared for {booking.guest.email}.
        </p>
        <span className="th-hotel-booking-id">Booking ID: {booking.bookingId}</span>

        <div className="th-hotel-confirm-grid">
          <ConfirmItem label="Hotel" value={booking.hotel.name} />
          <ConfirmItem label="Room type" value={booking.room.name} />
          <ConfirmItem
            label="Check-in"
            value={formatHotelDate(booking.search.checkIn)}
          />
          <ConfirmItem
            label="Check-out"
            value={formatHotelDate(booking.search.checkOut)}
          />
          <ConfirmItem label="Primary guest" value={booking.guest.fullName} />
          <ConfirmItem
            label="Guest details"
            value={`${booking.guest.mobile} · ${booking.guest.gender}, ${booking.guest.age}`}
          />
          <ConfirmItem
            label="Guests and rooms"
            value={`${booking.search.guests} guests · ${booking.search.rooms} rooms`}
          />
          <ConfirmItem
            label="Total paid"
            value={formatHotelMoney(booking.pricing.total)}
          />
        </div>

        <div className="th-hotel-confirm-actions">
          <button className="th-hotel-btn secondary" type="button" onClick={downloadInvoice}>
            <Download size={17} /> Download Invoice
          </button>
          <button
            className="th-hotel-btn"
            type="button"
            onClick={() => navigate("/dashboard/my-hotel-bookings")}
          >
            <ListChecks size={17} /> Go to My Bookings
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfirmItem({ label, value }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
