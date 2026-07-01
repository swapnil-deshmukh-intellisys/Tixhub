import React, { useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./AddBus.css";

const apiBases = ["http://127.0.0.1:5000/api", "http://localhost:5000/api"];

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const steps = [
  "Route Details",
  "Schedule",
  "Bus & Seats",
  "Fare & Points",
  "Review",
];

const initialForm = {
  operatorName: "",
  fromCity: "",
  toCity: "",
  departureDate: "",
  departureTime: "",
  arrivalTime: "",
  busType: "",
  seatCount: "",
  price: "",
  pickupPoint: "",
  dropPoint: "",
  amenities: "",
};

function AddBus() {
  const navigate = useNavigate();
  const location = useLocation();
  const editListing = location.state?.listing;

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    ...initialForm,
    ...(editListing?.details || {}),
  }));

  const isLastStep = currentStep === steps.length - 1;

  const stepFields = useMemo(
    () => [
      ["operatorName", "fromCity", "toCity"],
      ["departureDate", "departureTime", "arrivalTime"],
      ["busType", "seatCount", "amenities"],
      ["price", "pickupPoint", "dropPoint"],
      [],
    ],
    []
  );

  const labels = {
    operatorName: "Bus operator name",
    fromCity: "From city",
    toCity: "To city",
    departureDate: "Departure date",
    departureTime: "Departure time",
    arrivalTime: "Arrival time",
    busType: "Bus type",
    seatCount: "Seat count",
    price: "Ticket price",
    pickupPoint: "Pickup point",
    dropPoint: "Drop point",
    amenities: "Amenities",
  };

  const validateStep = () => {
    const requiredFields = stepFields[currentStep];

    for (let field of requiredFields) {
      if (!String(form[field] || "").trim()) {
        alert(`Please enter ${labels[field]}`);
        return false;
      }
    }

    return true;
  };

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const sendRequest = async ({ method, path, data, config }) => {
    let lastError;

    for (const baseUrl of apiBases) {
      try {
        return await axios({
          method,
          url: `${baseUrl}${path}`,
          data,
          ...config,
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!getToken()) {
      alert("Login expired. Please login again.");
      navigate("/");
      return;
    }

    setSaving(true);

    const config = {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    };

    try {
      if (editListing) {
        await sendRequest({
          method: "put",
          path: `/vendor-listings/${editListing._id}`,
          data: {
            module: "bus",
            details: form,
            status: editListing.status || "active",
          },
          config,
        });

        alert("Bus listing updated");
      } else {
        await sendRequest({
          method: "post",
          path: "/vendor-listings",
          data: {
            module: "bus",
            details: form,
          },
          config,
        });

        alert("Bus listing added");
      }

      navigate("/vendor-dashboard", { state: { activePanel: "listings" } });
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Unable to save bus");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-bus-page">
      <div className="add-bus-container">
        <div className="add-bus-header">
          <h1>{editListing ? "Edit Bus" : "Add Bus"}</h1>
          <p>Create bus routes, seating inventory, amenities, and fare details.</p>
        </div>

        <div className="bus-stepper">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`bus-step ${index <= currentStep ? "active" : ""}`}
            >
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>

        <form className="add-bus-card" onSubmit={handleSubmit}>
          {currentStep === 0 && (
            <div className="bus-form-grid">
              <Input label="Bus operator name" name="operatorName" value={form.operatorName} onChange={updateField} />
              <Input label="From city" name="fromCity" value={form.fromCity} onChange={updateField} />
              <Input label="To city" name="toCity" value={form.toCity} onChange={updateField} />
            </div>
          )}

          {currentStep === 1 && (
            <div className="bus-form-grid">
              <Input label="Departure date" name="departureDate" type="date" value={form.departureDate} onChange={updateField} />
              <Input label="Departure time" name="departureTime" type="time" value={form.departureTime} onChange={updateField} />
              <Input label="Arrival time" name="arrivalTime" type="time" value={form.arrivalTime} onChange={updateField} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="bus-form-grid">
              <Input label="Bus type" name="busType" placeholder="AC Sleeper" value={form.busType} onChange={updateField} />
              <Input label="Seat count" name="seatCount" type="number" min="1" value={form.seatCount} onChange={updateField} />
              <Input label="Amenities" name="amenities" placeholder="Charging, Water bottle, Blanket" value={form.amenities} onChange={updateField} full />
            </div>
          )}

          {currentStep === 3 && (
            <div className="bus-form-grid">
              <Input label="Ticket price" name="price" type="number" min="1" value={form.price} onChange={updateField} />
              <Input label="Pickup point" name="pickupPoint" value={form.pickupPoint} onChange={updateField} />
              <Input label="Drop point" name="dropPoint" value={form.dropPoint} onChange={updateField} />
            </div>
          )}

          {currentStep === 4 && (
            <div className="bus-review">
              {Object.entries(labels).map(([key, label]) => (
                <div className="bus-review-item" key={key}>
                  <span>{label}</span>
                  <strong>{form[key] || "-"}</strong>
                </div>
              ))}
            </div>
          )}

          <div className="bus-form-actions">
            {currentStep > 0 && (
              <button type="button" className="bus-back-btn" onClick={prevStep}>
                Back
              </button>
            )}

            {!isLastStep ? (
              <button type="button" className="bus-next-btn" onClick={nextStep}>
                Next
              </button>
            ) : (
              <button type="submit" className="bus-submit-btn" disabled={saving}>
                {saving ? "Saving..." : editListing ? "Update Bus" : "Add Bus"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", placeholder = "", min, full }) {
  return (
    <div className={`bus-form-group ${full ? "full" : ""}`}>
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        min={min}
        placeholder={placeholder}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  );
}

export default AddBus;