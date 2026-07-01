import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { hotelImage, hotelRequest, money, queryString } from "../services/hotelApi";
import "./HotelModule.css";

const amenityOptions = ["WiFi", "Pool", "Parking", "Restaurant", "Air Conditioning", "Gym"];
export default function HotelListing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [hotels, setHotels] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const values = useMemo(() => Object.fromEntries(params.entries()), [params]);
  const [filters, setFilters] = useState({ minPrice: values.minPrice || 0, maxPrice: values.maxPrice || 50000, rating: values.rating || 0, hotelType: values.hotelType || "", amenities: values.amenities ? values.amenities.split(",") : [], sort: values.sort || "price_asc" });
  useEffect(() => { let active = true; setLoading(true); setError(""); hotelRequest(`/hotels/search?${queryString({ ...values, ...filters, amenities: filters.amenities.join(",") })}`).then((data) => active && setHotels(data)).catch((e) => active && setError(e.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [values, filters]);
  const toggleAmenity = (item) => setFilters((current) => ({ ...current, amenities: current.amenities.includes(item) ? current.amenities.filter((x) => x !== item) : [...current.amenities, item] }));
  const open = (hotel) => navigate(`/dashboard/hotels/${hotel.id}?${queryString(values)}`);
  return <div className="hotel-page">
    <div className="hotel-toolbar"><div><h1>Hotels in {values.city || "your destination"}</h1><p>{values.checkIn} to {values.checkOut} · {values.guests || 1} guests · {values.rooms || 1} rooms</p></div><button className="hotel-btn secondary" onClick={() => navigate("/dashboard/hotels")}>Change search</button></div>
    <div className="hotel-list-layout"><aside className="hotel-filter"><h3>Filter hotels</h3>
      <label className="hotel-field"><span>Min price</span><input type="number" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} /></label>
      <label className="hotel-field"><span>Max price</span><input type="number" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} /></label>
      <label className="hotel-field"><span>Minimum rating</span><select value={filters.rating} onChange={(e) => setFilters({ ...filters, rating: e.target.value })}><option value="0">Any rating</option><option value="3">3+ rating</option><option value="4">4+ rating</option><option value="4.5">4.5+ rating</option></select></label>
      <label className="hotel-field"><span>Hotel type</span><select value={filters.hotelType} onChange={(e) => setFilters({ ...filters, hotelType: e.target.value })}><option value="">All types</option>{["Hotel","Resort","Villa","Hostel","Apartment"].map((x) => <option key={x}>{x}</option>)}</select></label>
      <div><strong>Amenities</strong><div className="hotel-checks">{amenityOptions.map((item) => <label key={item}><input type="checkbox" checked={filters.amenities.includes(item)} onChange={() => toggleAmenity(item)} />{item}</label>)}</div></div>
    </aside><main>
      <div className="hotel-toolbar"><strong>{hotels.length} stays found</strong><select className="hotel-input" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Guest rating</option><option value="popularity">Popularity</option></select></div>
      {loading ? <div className="hotel-loading">Finding available rooms...</div> : error ? <div className="hotel-error">{error}</div> : !hotels.length ? <div className="hotel-empty"><h3>No matching hotels</h3><p>Try changing dates or filters.</p></div> : <div className="hotel-grid">{hotels.map((hotel) => <article className="hotel-card" key={hotel.id}><img src={hotelImage(hotel)} alt={hotel.name} /><div className="hotel-card-body"><span className="hotel-rating"><FaStar /> {hotel.reviewRating || hotel.starRating || "New"}</span><h3>{hotel.name}</h3><p><FaMapMarkerAlt /> {hotel.city} · {hotel.hotel_type}</p><div className="hotel-chips">{hotel.amenities.slice(0,3).map((a) => <span className="hotel-chip" key={a}>{a}</span>)}</div><p><span className="hotel-price">{money(hotel.minPrice)}</span> / night</p><button className="hotel-btn" onClick={() => open(hotel)}>View rooms</button></div></article>)}</div>}
    </main></div>
  </div>;
}
