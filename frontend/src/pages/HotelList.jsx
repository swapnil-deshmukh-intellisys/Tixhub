import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Coffee, MapPin, Search, Star } from "lucide-react";
import {
  defaultHotelSearch,
  formatHotelMoney,
  hotelDemoHotels,
  localDateValue,
} from "../data/hotelDemoData";
import "./HotelBookingFlow.css";

const amenityFilters = ["Free WiFi", "Swimming Pool", "Parking", "Restaurant", "Gym"];
const propertyTypes = ["Hotel", "Resort", "Villa", "Apartment", "Hostel"];

export default function HotelList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState(defaultHotelSearch);
  const [filters, setFilters] = useState({
    maxPrice: 15000,
    stars: 0,
    propertyType: "",
    amenities: [],
    freeCancellation: false,
    breakfastIncluded: false,
  });
  const [sort, setSort] = useState("popular");
  const [submittedSearch, setSubmittedSearch] = useState(search);

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return localDateValue(date);
  }, []);

  const results = useMemo(() => {
    const query = submittedSearch.destination.trim().toLowerCase();
    const filtered = hotelDemoHotels.filter((hotel) => {
      const lowestPrice = Math.min(...hotel.rooms.map((room) => room.weekdayPrice));
      const matchesSearch =
        !query ||
        [hotel.name, hotel.city, hotel.location].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesAmenities = filters.amenities.every((amenity) =>
        hotel.amenities.includes(amenity),
      );
      return (
        matchesSearch &&
        lowestPrice <= Number(filters.maxPrice) &&
        (!filters.stars || hotel.stars >= Number(filters.stars)) &&
        (!filters.propertyType || hotel.propertyType === filters.propertyType) &&
        matchesAmenities &&
        (!filters.freeCancellation || hotel.freeCancellation) &&
        (!filters.breakfastIncluded || hotel.breakfastIncluded)
      );
    });

    return [...filtered].sort((first, second) => {
      const firstPrice = Math.min(...first.rooms.map((room) => room.weekdayPrice));
      const secondPrice = Math.min(...second.rooms.map((room) => room.weekdayPrice));
      if (sort === "price-low") return firstPrice - secondPrice;
      if (sort === "price-high") return secondPrice - firstPrice;
      if (sort === "rating") return second.rating - first.rating;
      return second.popularity - first.popularity;
    });
  }, [filters, sort, submittedSearch]);

  const updateSearch = (key, value) => {
    setSearch((current) => ({ ...current, [key]: value }));
  };

  const toggleAmenity = (amenity) => {
    setFilters((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (search.checkOut <= search.checkIn) {
      alert("Check-out must be after check-in.");
      return;
    }
    setSubmittedSearch({
      ...search,
      guests: Math.max(1, Number(search.guests)),
      rooms: Math.max(1, Number(search.rooms)),
    });
  };

  const openHotel = (hotel) => {
    navigate(`/dashboard/hotels/${hotel.id}`, {
      state: { hotel, search: submittedSearch },
    });
  };

  return (
    <div className="th-hotel-page">
      <section className="th-hotel-search-hero">
        <h1>Find your perfect TixHub stay</h1>
        <p>Compare room types, flexible policies and weekday or weekend rates.</p>
        <form className="th-hotel-search" onSubmit={submitSearch}>
          <label className="th-hotel-field">
            <span>City or hotel</span>
            <input
              value={search.destination}
              onChange={(event) => updateSearch("destination", event.target.value)}
              placeholder="Goa, Mumbai, Jaipur..."
            />
          </label>
          <label className="th-hotel-field">
            <span>Check-in</span>
            <input
              type="date"
              min={tomorrow}
              value={search.checkIn}
              onChange={(event) => updateSearch("checkIn", event.target.value)}
              required
            />
          </label>
          <label className="th-hotel-field">
            <span>Check-out</span>
            <input
              type="date"
              min={search.checkIn}
              value={search.checkOut}
              onChange={(event) => updateSearch("checkOut", event.target.value)}
              required
            />
          </label>
          <label className="th-hotel-field">
            <span>Guests</span>
            <input
              type="number"
              min="1"
              max="12"
              value={search.guests}
              onChange={(event) => updateSearch("guests", event.target.value)}
            />
          </label>
          <label className="th-hotel-field">
            <span>Rooms</span>
            <input
              type="number"
              min="1"
              max="6"
              value={search.rooms}
              onChange={(event) => updateSearch("rooms", event.target.value)}
            />
          </label>
          <button className="th-hotel-btn" type="submit">
            <Search size={17} /> Search
          </button>
        </form>
      </section>

      <div className="th-hotel-results-layout">
        <aside className="th-hotel-card th-hotel-filters">
          <h2>Filter hotels</h2>
          <div className="th-hotel-filter-group">
            <strong>Price up to {formatHotelMoney(filters.maxPrice)}</strong>
            <input
              className="th-hotel-range"
              type="range"
              min="1000"
              max="15000"
              step="500"
              value={filters.maxPrice}
              onChange={(event) =>
                setFilters({ ...filters, maxPrice: event.target.value })
              }
            />
          </div>
          <label className="th-hotel-field">
            <span>Star rating</span>
            <select
              value={filters.stars}
              onChange={(event) =>
                setFilters({ ...filters, stars: event.target.value })
              }
            >
              <option value="0">Any rating</option>
              <option value="3">3 stars and above</option>
              <option value="4">4 stars and above</option>
              <option value="5">5 stars</option>
            </select>
          </label>
          <label className="th-hotel-field">
            <span>Property type</span>
            <select
              value={filters.propertyType}
              onChange={(event) =>
                setFilters({ ...filters, propertyType: event.target.value })
              }
            >
              <option value="">All properties</option>
              {propertyTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <div className="th-hotel-filter-group">
            <strong>Amenities</strong>
            {amenityFilters.map((amenity) => (
              <label className="th-hotel-check" key={amenity}>
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />
                {amenity}
              </label>
            ))}
          </div>
          <label className="th-hotel-check">
            <input
              type="checkbox"
              checked={filters.freeCancellation}
              onChange={(event) =>
                setFilters({ ...filters, freeCancellation: event.target.checked })
              }
            />
            Free cancellation
          </label>
          <label className="th-hotel-check">
            <input
              type="checkbox"
              checked={filters.breakfastIncluded}
              onChange={(event) =>
                setFilters({ ...filters, breakfastIncluded: event.target.checked })
              }
            />
            Breakfast included
          </label>
        </aside>

        <main>
          <div className="th-hotel-results-head">
            <div>
              <strong>{results.length} properties found</strong>
              <div className="th-hotel-muted">
                {submittedSearch.destination || "All destinations"} · {submittedSearch.guests} guests · {submittedSearch.rooms} rooms
              </div>
            </div>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="popular">Popular</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Guest rating</option>
            </select>
          </div>

          {!results.length ? (
            <div className="th-hotel-empty">
              <h2>No matching hotels</h2>
              <p>Try a different destination or relax one of your filters.</p>
            </div>
          ) : (
            <div className="th-hotel-list">
              {results.map((hotel) => {
                const lowestPrice = Math.min(
                  ...hotel.rooms.map((room) => room.weekdayPrice),
                );
                return (
                  <article className="th-hotel-card th-hotel-list-card" key={hotel.id}>
                    <img src={hotel.images[0]} alt={hotel.name} />
                    <div>
                      <span className="th-hotel-rating">
                        <Star size={13} fill="currentColor" /> {hotel.rating}
                      </span>
                      <h2>{hotel.name}</h2>
                      <p className="th-hotel-card-location">
                        <MapPin size={14} /> {hotel.location}
                      </p>
                      <div className="th-hotel-chip-list">
                        {hotel.amenities.slice(0, 4).map((amenity) => (
                          <span className="th-hotel-chip" key={amenity}>
                            {amenity}
                          </span>
                        ))}
                      </div>
                      <p className="th-hotel-benefit">
                        {hotel.freeCancellation && <><CheckCircle2 size={14} /> Free cancellation </>}
                        {hotel.breakfastIncluded && <><Coffee size={14} /> Breakfast included</>}
                      </p>
                    </div>
                    <div className="th-hotel-card-meta">
                      <small>Starting from</small>
                      <div className="th-hotel-price">{formatHotelMoney(lowestPrice)}</div>
                      <small>per night + taxes</small>
                      <small>{hotel.reviewCount.toLocaleString("en-IN")} verified reviews</small>
                      <button className="th-hotel-btn" type="button" onClick={() => openHotel(hotel)}>
                        View Rooms
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
