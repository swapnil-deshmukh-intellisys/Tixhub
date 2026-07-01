import { useLocation, useNavigate, useParams } from "react-router-dom";
import { BedDouble, CheckCircle2, Users } from "lucide-react";
import {
  calculateRoomPrice,
  defaultHotelSearch,
  findDemoHotel,
  formatHotelDate,
  formatHotelMoney,
} from "../data/hotelDemoData";
import "./HotelBookingFlow.css";

export default function HotelRoomSelection() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hotel = location.state?.hotel || findDemoHotel(id);
  const search = location.state?.search || defaultHotelSearch();
  const previewRoom = location.state?.room || hotel.rooms[0];
  const previewPricing = calculateRoomPrice(previewRoom, search);

  const selectRoom = (room) => {
    const pricing = calculateRoomPrice(room, search);
    navigate(`/dashboard/hotels/${hotel.id}/guests`, {
      state: { hotel, room, search, pricing },
    });
  };

  return (
    <div className="th-hotel-page">
      <div className="th-hotel-stepper">
        <span className="active" /><span /><span /><span />
      </div>
      <div className="th-hotel-heading">
        <div>
          <button className="th-hotel-back" type="button" onClick={() => navigate(-1)}>
            ← Hotel details
          </button>
          <h1>Select a room</h1>
          <p className="th-hotel-muted">
            {hotel.name} · {formatHotelDate(search.checkIn)} to {formatHotelDate(search.checkOut)}
          </p>
        </div>
      </div>

      <div className="th-hotel-flow-layout">
        <main className="th-hotel-room-list">
          {hotel.rooms.map((room, index) => {
            const pricing = calculateRoomPrice(room, search);
            return (
              <article className="th-hotel-card th-hotel-room-card" key={room.id}>
                <img
                  src={hotel.images[(index + 1) % hotel.images.length]}
                  alt={room.name}
                />
                <div>
                  <h2>{room.name}</h2>
                  <p className="th-hotel-muted">
                    <BedDouble size={14} /> {room.bedType} · <Users size={14} /> Up to {room.capacity} guests
                  </p>
                  <div className="th-hotel-chip-list">
                    {room.amenities.map((amenity) => (
                      <span className="th-hotel-chip" key={amenity}>{amenity}</span>
                    ))}
                  </div>
                  <p className="th-hotel-benefit">
                    <CheckCircle2 size={14} /> {room.freeCancellation ? "Free cancellation available" : "Non-refundable rate"}
                  </p>
                  <small className="th-hotel-muted">
                    {room.breakfastIncluded ? "Breakfast included" : "Room only"}
                  </small>
                </div>
                <div className="th-hotel-room-rate">
                  <small className="th-hotel-muted">Weekday</small>
                  <div className="th-hotel-price">{formatHotelMoney(room.weekdayPrice)}</div>
                  <p>Weekend: {formatHotelMoney(room.weekendPrice)}</p>
                  <p>Taxes: {formatHotelMoney(pricing.taxes)}</p>
                  {room.offerPercent > 0 && (
                    <p className="th-hotel-discount">{room.offerPercent}% seasonal offer</p>
                  )}
                  <button className="th-hotel-btn" type="button" onClick={() => selectRoom(room)}>
                    Select Room
                  </button>
                </div>
              </article>
            );
          })}
        </main>

        <BookingSummary
          hotel={hotel}
          room={previewRoom}
          search={search}
          pricing={previewPricing}
        />
      </div>
    </div>
  );
}

export function BookingSummary({ hotel, room, search, pricing, action }) {
  return (
    <aside className="th-hotel-card th-hotel-summary">
      <h2>Booking summary</h2>
      <strong>{hotel.name}</strong>
      <p className="th-hotel-muted">{room.name}</p>
      <div className="th-hotel-summary-row">
        <span>Check-in</span><strong>{formatHotelDate(search.checkIn)}</strong>
      </div>
      <div className="th-hotel-summary-row">
        <span>Check-out</span><strong>{formatHotelDate(search.checkOut)}</strong>
      </div>
      <div className="th-hotel-summary-row">
        <span>Stay</span><strong>{pricing.nights} nights · {search.guests} guests</strong>
      </div>
      <div className="th-hotel-summary-row">
        <span>Room price</span><strong>{formatHotelMoney(pricing.roomSubtotal)}</strong>
      </div>
      {pricing.offerDiscount > 0 && (
        <div className="th-hotel-summary-row th-hotel-discount">
          <span>Seasonal offer</span><strong>− {formatHotelMoney(pricing.offerDiscount)}</strong>
        </div>
      )}
      <div className="th-hotel-summary-row">
        <span>Taxes</span><strong>{formatHotelMoney(pricing.taxes)}</strong>
      </div>
      <div className="th-hotel-summary-row total">
        <span>Total amount</span><strong>{formatHotelMoney(pricing.total)}</strong>
      </div>
      {action}
    </aside>
  );
}
