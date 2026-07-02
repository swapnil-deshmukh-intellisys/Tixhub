import VendorModuleForm from "./VendorModuleForm";
import "./AddFlight.css";

const fields = [
  { name: "flightName", label: "Flight name" },
  { name: "airlineName", label: "Airline name" },
  { name: "flightNumber", label: "Flight number" },
  { name: "fromCity", label: "From" },
  { name: "fromAirport", label: "From airport" },
  { name: "toCity", label: "To" },
  { name: "toAirport", label: "To airport" },
  { name: "departureDate", label: "Departure date", type: "date" },
  { name: "departureTime", label: "Departure time", type: "time" },
  { name: "arrivalTime", label: "Arrival time", type: "time" },
  { name: "arrivalDate", label: "Arrival date", type: "date" },
  { name: "duration", label: "Duration", placeholder: "2h 15m" },
  { name: "cabinClass", label: "Cabin class", placeholder: "Economy, Business" },
  { name: "price", label: "Price", type: "number", min: "0" },
  { name: "availableSeats", label: "Available seats", type: "number", min: "0" },
  { name: "totalSeats", label: "Total seats", type: "number", min: "1" },
  { name: "seatSelectionMode", label: "Seat selection mode", type: "select", options: ["DURING_BOOKING", "AFTER_BOOKING", "CHECK_IN", "AUTO_ASSIGN"], defaultValue: "CHECK_IN" },
  { name: "checkInOpenHoursBefore", label: "Check-in opens (hours before departure)", type: "number", min: "0", defaultValue: 24 },
  { name: "status", label: "Status", type: "select", options: ["active", "inactive"], defaultValue: "active" },
  { name: "baggageInfo", label: "Baggage info" },
  { name: "cancellationPolicy", label: "Cancellation policy", type: "textarea", full: true },
];

function AddFlight() {
  return (
    <VendorModuleForm
      module="flight"
      title="Flight"
      description="Configure flight inventory and fare details for customers."
      fields={fields}
    />
  );
}

export default AddFlight;
