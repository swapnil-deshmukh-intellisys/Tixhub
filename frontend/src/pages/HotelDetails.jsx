import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, MapPin, Star } from "lucide-react";
import {
  defaultHotelSearch,
  findDemoHotel,
  formatHotelMoney,
} from "../data/hotelDemoData";
import "./HotelBookingFlow.css";

export default function HotelDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const hotel = location.state?.hotel || findDemoHotel(id);
  const search = location.state?.search || defaultHotelSearch();

  const selectRooms = () => {
    navigate(`/dashboard/hotels/${hotel.id}/rooms`, {
      state: { hotel, search },
    });
  };

  return (
    <div className="th-hotel-page">
      <button className="th-hotel-back" type="button" onClick={() => navigate(-1)}>
        ← Back to hotel results
      </button>

      <div className="th-hotel-heading">
        <div>
          <h1>{hotel.name}</h1>
          <p className="th-hotel-card-location">
            <MapPin size={15} /> {hotel.address}
          </p>
        </div>
        <span className="th-hotel-rating">
          <Star size={14} fill="currentColor" /> {hotel.rating} · {hotel.reviewCount} reviews
        </span>
      </div>

      <div className="th-hotel-gallery">
        {[0, 1, 2, 3, 4].map((index) => (
          <img
            key={`${hotel.id}-${index}`}
            src={hotel.images[index % hotel.images.length]}
            alt={`${hotel.name} view ${index + 1}`}
          />
        ))}
      </div>

      <div className="th-hotel-detail-layout">
        <main>
          <section className="th-hotel-card th-hotel-section">
            <h2>About this property</h2>
            <p className="th-hotel-muted">{hotel.description}</p>
            <h2>Popular amenities</h2>
            <div className="th-hotel-chip-list">
              {hotel.amenities.map((amenity) => (
                <span className="th-hotel-chip" key={amenity}>
                  <CheckCircle2 size={13} /> {amenity}
                </span>
              ))}
            </div>
          </section>

          <section className="th-hotel-card th-hotel-section">
            <h2>Available room types</h2>
            {hotel.rooms.map((room) => (
              <div className="th-hotel-room-preview" key={room.id}>
                <div>
                  <strong>{room.name}</strong>
                  <p className="th-hotel-muted">
                    {room.bedType} · Up to {room.capacity} guests
                  </p>
                  <div className="th-hotel-chip-list">
                    {room.amenities.slice(0, 3).map((amenity) => (
                      <span className="th-hotel-chip" key={amenity}>{amenity}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="th-hotel-price">{formatHotelMoney(room.weekdayPrice)}</div>
                  <small className="th-hotel-muted">weekday rate</small>
                </div>
              </div>
            ))}
          </section>

          <section className="th-hotel-card th-hotel-section">
            <h2>Hotel policies</h2>
            <div className="th-hotel-policy-list">
              {hotel.policies.map((policy) => (
                <div key={policy}>✓ {policy}</div>
              ))}
            </div>
          </section>

          <section className="th-hotel-card th-hotel-section">
            <h2>Nearby places</h2>
            <div className="th-hotel-nearby">
              {hotel.nearbyPlaces.map((place) => (
                <div key={place}><MapPin size={13} /> {place}</div>
              ))}
            </div>
          </section>
        </main>

        <aside className="th-hotel-card th-hotel-sticky">
          <h2>Plan your stay</h2>
          <div className="th-hotel-summary-row">
            <span>Check-in</span><strong>{search.checkIn}</strong>
          </div>
          <div className="th-hotel-summary-row">
            <span>Check-out</span><strong>{search.checkOut}</strong>
          </div>
          <div className="th-hotel-summary-row">
            <span>Guests & rooms</span><strong>{search.guests} guests · {search.rooms} rooms</strong>
          </div>
          <p className="th-hotel-muted">Weekday and weekend prices are shown separately before payment.</p>
          <button className="th-hotel-btn" type="button" onClick={selectRooms}>
            Select Room
          </button>
        </aside>
      </div>
    </div>
  );
}
