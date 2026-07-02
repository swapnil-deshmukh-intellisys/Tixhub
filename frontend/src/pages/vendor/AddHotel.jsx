import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { filesToImages, hotelRequest } from "../../services/hotelApi";
import FullAddHotel from "./FullAddHotel";
import "./HotelVendor.css";

const hotelAmenities = [
  "WiFi",
  "Pool",
  "Parking",
  "Restaurant",
  "Air Conditioning",
  "Gym",
  "Spa",
  "Room Service",
  "Pet Friendly",
  "Airport Shuttle",
];

const createEmptyHotel = () => ({
  name: "",
  description: "",
  hotelType: "Hotel",
  starRating: 3,
  address: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  phone: "",
  email: "",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  status: "active",
  amenities: [],
  images: [],
  policies: [
    {
      type: "cancellation",
      title: "Cancellation policy",
      description: "",
    },
    { type: "house_rules", title: "House rules", description: "" },
  ],
});

const normalizeHotel = (hotel) => ({
  ...createEmptyHotel(),
  ...hotel,
  hotelType: hotel.hotel_type || hotel.hotelType || "Hotel",
  starRating: hotel.star_rating ?? hotel.starRating ?? 3,
  checkInTime: String(hotel.check_in_time || hotel.checkInTime || "14:00").slice(
    0,
    5,
  ),
  checkOutTime: String(
    hotel.check_out_time || hotel.checkOutTime || "11:00",
  ).slice(0, 5),
  amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
  images: Array.isArray(hotel.images) ? hotel.images : [],
  policies: Array.isArray(hotel.policies) ? hotel.policies : [],
});

export function HotelForm({
  hotelId = null,
  embedded = false,
  onSaved,
  onCancel,
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState(createEmptyHotel);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(hotelId));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    if (!hotelId) {
      setForm(createEmptyHotel());
      setLoading(false);
      setError("");
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError("");
    hotelRequest(`/vendor/hotels/${hotelId}`)
      .then((hotel) => {
        if (active) setForm(normalizeHotel(hotel));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hotelId]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleAmenity = (amenity) => {
    update(
      "amenities",
      form.amenities.includes(amenity)
        ? form.amenities.filter((item) => item !== amenity)
        : [...form.amenities, amenity],
    );
  };

  const uploadImages = async (event) => {
    const images = await filesToImages(event.target.files);
    update("images", [...form.images, ...images]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await hotelRequest(
        hotelId ? `/vendor/hotels/${hotelId}` : "/vendor/hotels",
        {
          method: hotelId ? "PUT" : "POST",
          body: JSON.stringify(form),
        },
      );

      if (onSaved) onSaved();
      else navigate("/vendor/hotels");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (onCancel) onCancel();
    else navigate("/vendor/hotels");
  };

  if (loading) return <div className="hv-loading">Loading hotel...</div>;

  return (
    <div className={embedded ? "" : "hv-page"}>
      <div className="hv-toolbar">
        <div>
          <h1>{hotelId ? "Edit hotel" : "Add hotel"}</h1>
          <p>Property details, media, amenities, and guest policies.</p>
        </div>
        {!embedded && (
          <button className="hv-btn ghost" type="button" onClick={cancel}>
            Back
          </button>
        )}
      </div>

      {error && <div className="hv-error">{error}</div>}

      <form className="hv-form" onSubmit={submit}>
        <section className="hv-panel">
          <h2>Property information</h2>
          <div className="hv-grid three">
            <HotelField
              label="Hotel name"
              value={form.name}
              onChange={(value) => update("name", value)}
              required
            />
            <HotelSelect
              label="Type"
              value={form.hotelType}
              onChange={(value) => update("hotelType", value)}
              options={["Hotel", "Resort", "Villa", "Hostel", "Apartment"]}
            />
            <HotelField
              label="Star rating"
              type="number"
              min="0"
              max="5"
              step="0.5"
              value={form.starRating}
              onChange={(value) => update("starRating", value)}
            />
            <HotelField
              label="Description"
              className="hv-wide"
              textarea
              value={form.description}
              onChange={(value) => update("description", value)}
            />
          </div>
        </section>

        <section className="hv-panel">
          <h2>Location and contact</h2>
          <div className="hv-grid three">
            <HotelField
              label="Address"
              className="hv-wide"
              value={form.address}
              onChange={(value) => update("address", value)}
              required
            />
            <HotelField
              label="City"
              value={form.city}
              onChange={(value) => update("city", value)}
              required
            />
            <HotelField
              label="State"
              value={form.state}
              onChange={(value) => update("state", value)}
            />
            <HotelField
              label="Postal code"
              value={form.postalCode}
              onChange={(value) => update("postalCode", value)}
            />
            <HotelField
              label="Country"
              value={form.country}
              onChange={(value) => update("country", value)}
            />
            <HotelField
              label="Phone"
              value={form.phone}
              onChange={(value) => update("phone", value)}
            />
            <HotelField
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => update("email", value)}
            />
            <HotelField
              label="Check-in time"
              type="time"
              value={form.checkInTime}
              onChange={(value) => update("checkInTime", value)}
            />
            <HotelField
              label="Check-out time"
              type="time"
              value={form.checkOutTime}
              onChange={(value) => update("checkOutTime", value)}
            />
            <HotelSelect
              label="Status"
              value={form.status}
              onChange={(value) => update("status", value)}
              options={["active", "inactive", "hidden"]}
            />
          </div>
        </section>

        <section className="hv-panel">
          <h2>Amenities and images</h2>
          <div className="hv-chips">
            {hotelAmenities.map((amenity) => (
              <label className="hv-chip" key={amenity}>
                <input
                  type="checkbox"
                  checked={form.amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />{" "}
                {amenity}
              </label>
            ))}
          </div>

          <br />
          <label className="hv-field">
            <span>Hotel images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={uploadImages}
            />
          </label>

          {form.images.length > 0 && (
            <div className="hv-image-preview">
              {form.images.map((image, index) => (
                <div key={`${image.url}-${index}`}>
                  <img src={image.url} alt="Hotel preview" />
                  <button
                    type="button"
                    className="hv-btn danger"
                    onClick={() =>
                      update(
                        "images",
                        form.images.filter(
                          (_, imageIndex) => imageIndex !== index,
                        ),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="hv-panel">
          <h2>Policies</h2>
          {form.policies.map((policy, index) => (
            <div className="hv-grid" key={`${policy.type}-${index}`}>
              <HotelField
                label="Policy title"
                value={policy.title}
                onChange={(value) =>
                  update(
                    "policies",
                    form.policies.map((item, policyIndex) =>
                      policyIndex === index
                        ? { ...item, title: value }
                        : item,
                    ),
                  )
                }
              />
              <HotelSelect
                label="Policy type"
                value={policy.type}
                onChange={(value) =>
                  update(
                    "policies",
                    form.policies.map((item, policyIndex) =>
                      policyIndex === index ? { ...item, type: value } : item,
                    ),
                  )
                }
                options={[
                  "cancellation",
                  "house_rules",
                  "children",
                  "pets",
                  "payment",
                ]}
              />
              <HotelField
                className="hv-wide"
                textarea
                label="Policy details"
                value={policy.description}
                onChange={(value) =>
                  update(
                    "policies",
                    form.policies.map((item, policyIndex) =>
                      policyIndex === index
                        ? { ...item, description: value }
                        : item,
                    ),
                  )
                }
              />
            </div>
          ))}

          <button
            type="button"
            className="hv-btn secondary"
            onClick={() =>
              update("policies", [
                ...form.policies,
                { type: "general", title: "", description: "" },
              ])
            }
          >
            Add policy
          </button>
        </section>

        <div className="hv-actions">
          <button className="hv-btn" disabled={saving}>
            {saving
              ? "Saving..."
              : hotelId
                ? "Update hotel"
                : "Create hotel"}
          </button>
          <button className="hv-btn ghost" type="button" onClick={cancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddHotel() {
  return <FullAddHotel />;
}

function HotelField({
  label,
  onChange,
  textarea,
  className = "",
  ...props
}) {
  return (
    <label className={`hv-field ${className}`}>
      <span>{label}</span>
      {textarea ? (
        <textarea {...props} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input {...props} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function HotelSelect({ label, value, onChange, options }) {
  return (
    <label className="hv-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
