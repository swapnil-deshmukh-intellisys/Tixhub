const Booking = require("../models/Booking");
const Flight = require("../models/Flight");

const makeBookingCode = () => `TH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const makePnr = () => `PNR${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

const toBool = (value) => value === true || value === "true" || value === "yes" || value === 1 || value === "1";
const number = (value, fallback = 0) => Number(value === undefined || value === null || value === "" ? fallback : value);
const airportCode = (value) => String(value || "AIR").trim().slice(0, 3).toUpperCase();

const columnsByAircraft = {
  A320: [["A", "B", "C"], ["D", "E", "F"]],
  B737: [["A", "B", "C"], ["D", "E", "F"]],
  ATR72: [["A", "B"], ["C", "D"]],
  B777: [["A", "B", "C"], ["D", "E", "F", "G"], ["H", "J", "K"]],
};

const buildSeats = (totalSeats, aircraft, existingSeats = []) => {
  if (Array.isArray(existingSeats) && existingSeats.length) return existingSeats;

  const groups = columnsByAircraft[aircraft] || columnsByAircraft.A320;
  const letters = groups.flat();
  const seats = [];

  for (let index = 0; index < Number(totalSeats || 0); index += 1) {
    const row = Math.floor(index / letters.length) + 1;
    const letter = letters[index % letters.length];
    seats.push({ seatNumber: `${letter}${row}`, status: "available" });
  }

  return seats;
};

const normalizeFlightPayload = (body, user) => {
  const baseFare = number(body.base_fare ?? body.baseFare);
  const taxes = number(body.taxes);
  const totalPrice = number(body.total_price ?? body.totalPrice ?? body.ticketPrice ?? body.price, baseFare + taxes);
  const totalSeats = number(body.total_seats ?? body.totalSeats);
  const bookedSeats = number(body.booked_seats ?? body.bookedSeats);
  const blockedSeats = number(body.blocked_seats ?? body.blockedSeats);
  const aircraft = body.aircraft ?? body.aircraftType ?? "A320";

  return {
    vendorId: body.vendor_id ?? body.vendorId ?? body.vendor ?? user?.id,
    vendor: body.vendor_id ?? body.vendorId ?? body.vendor ?? user?.id,
    airlineName: body.airline_name ?? body.airlineName ?? body.airline ?? "",
    airlineLogo: body.airline_logo ?? body.airlineLogo ?? body.airlineLogoUrl ?? "",
    flightNumber: body.flight_number ?? body.flightNumber ?? "",
    flightType: body.flight_type ?? body.flightType ?? "domestic",
    fromCity: body.from_city ?? body.fromCity ?? body.from ?? "",
    fromAirport: body.from_airport ?? body.fromAirport ?? "",
    fromCode: body.from_code ?? body.fromCode ?? airportCode(body.fromAirport ?? body.from_city ?? body.fromCity),
    toCity: body.to_city ?? body.toCity ?? body.to ?? "",
    toAirport: body.to_airport ?? body.toAirport ?? "",
    toCode: body.to_code ?? body.toCode ?? airportCode(body.toAirport ?? body.to_city ?? body.toCity),
    departureDate: body.departure_date ?? body.departureDate ?? "",
    departureTime: body.departure_time ?? body.departureTime ?? "",
    arrivalDate: body.arrival_date ?? body.arrivalDate ?? "",
    arrivalTime: body.arrival_time ?? body.arrivalTime ?? "",
    duration: body.duration ?? "",
    aircraft,
    aircraftType: aircraft,
    classType: body.class_type ?? body.classType ?? body.cabinClass ?? "Economy",
    cabinClass: body.class_type ?? body.classType ?? body.cabinClass ?? "Economy",
    totalSeats,
    bookedSeats,
    blockedSeats,
    availableSeats: number(body.available_seats ?? body.availableSeats, Math.max(totalSeats - bookedSeats - blockedSeats, 0)),
    baseFare,
    taxes,
    totalPrice,
    ticketPrice: totalPrice,
    cabinBaggage: body.cabin_baggage ?? body.cabinBaggage ?? "7kg cabin",
    checkinBaggage: body.checkin_baggage ?? body.checkinBaggage ?? body.baggageAllowance ?? "15kg check-in",
    refundable: toBool(body.refundable),
    mealIncluded: toBool(body.meal_included ?? body.mealIncluded),
    status: body.status || "active",
    seats: buildSeats(totalSeats, aircraft, body.seats),
  };
};

const mapFlight = (flight) => ({
  id: String(flight._id),
  _id: flight._id,
  vendor: flight.vendor || flight.vendorId,
  airlineLogoUrl: flight.airlineLogo || "",
  airline: flight.airlineName,
  airlineName: flight.airlineName,
  flightNumber: flight.flightNumber,
  flightType: flight.flightType || "domestic",
  from: flight.fromCity,
  fromCity: flight.fromCity,
  fromCode: flight.fromCode,
  fromAirport: flight.fromAirport,
  to: flight.toCity,
  toCity: flight.toCity,
  toCode: flight.toCode,
  toAirport: flight.toAirport,
  departureDate: flight.departureDate,
  departureTime: flight.departureTime,
  arrivalDate: flight.arrivalDate,
  arrivalTime: flight.arrivalTime,
  duration: flight.duration,
  price: Number(flight.ticketPrice || flight.totalPrice || 0),
  baseFare: Number(flight.baseFare || 0),
  taxes: Number(flight.taxes || 0),
  aircraft: flight.aircraft || flight.aircraftType,
  aircraftType: flight.aircraftType || flight.aircraft,
  classType: flight.classType || flight.cabinClass,
  cabinClass: flight.cabinClass || flight.classType,
  cabinClasses: [flight.cabinClass || flight.classType || "Economy"],
  totalSeats: Number(flight.totalSeats || 0),
  availableSeats: Number(flight.availableSeats || 0),
  bookedSeats: Number(flight.bookedSeats || 0),
  blockedSeats: Number(flight.blockedSeats || 0),
  baggage: flight.baggageAllowance || [flight.cabinBaggage, flight.checkinBaggage].filter(Boolean).join(" + "),
  cabinBaggage: flight.cabinBaggage || "",
  checkinBaggage: flight.checkinBaggage || "",
  refundable: flight.refundable,
  mealIncluded: flight.mealIncluded,
  status: flight.status,
  seats: flight.seats || [],
  reservedSeats: (flight.seats || []).filter((seat) => seat.status !== "available").map((seat) => seat.seatNumber),
});

const createFlight = async (req, res) => {
  const payload = normalizeFlightPayload(req.body, req.user);
  if (!payload.airlineName || !payload.flightNumber || !payload.fromCity || !payload.toCity) {
    return res.status(400).json({ message: "Airline, flight number, from city, and to city are required" });
  }

  const flight = await Flight.create(payload);
  res.status(201).json({ message: "Flight created", flight: mapFlight(flight) });
};

const getFlights = async (req, res) => {
  const flights = await Flight.find(req.query.status ? { status: req.query.status } : {}).sort({ createdAt: -1 });
  res.json(flights.map(mapFlight));
};

const getFlight = async (req, res) => {
  const flight = await Flight.findById(req.params.id);
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  res.json(mapFlight(flight));
};

const updateFlight = async (req, res) => {
  const existing = await Flight.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Flight not found" });

  const payload = normalizeFlightPayload({ ...existing.toObject(), ...req.body }, req.user);
  const flight = await Flight.findByIdAndUpdate(req.params.id, payload, { new: true });
  res.json({ message: "Flight updated", flight: mapFlight(flight) });
};

const deleteFlight = async (req, res) => {
  const flight = await Flight.findByIdAndDelete(req.params.id);
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  res.json({ message: "Flight deleted" });
};

const createFlightBooking = async (req, res) => {
  const flightId = req.body.flight_id || req.body.flightId || req.body.details?.flightId || req.body.details?.flight?._id || req.body.details?.flight?.id;
  const flight = flightId ? await Flight.findById(flightId) : null;
  const flightDetails = req.body.details?.flight || {};
  if (!flight && !flightDetails.id && !flightDetails._id) return res.status(404).json({ message: "Flight not found" });

  const seats = Array.isArray(req.body.seats)
    ? req.body.seats
    : String(req.body.seat_number || req.body.seatNumber || "")
      .split(",")
      .map((seat) => seat.trim())
      .filter(Boolean);
  if (!seats.length) return res.status(400).json({ message: "Seat number is required" });

  const passenger = {
    name: req.body.passenger_name || req.body.passengerName || req.body.details?.passenger?.name || req.user.name || "",
    mobile: req.body.passenger_mobile || req.body.passengerMobile || req.body.details?.passenger?.mobile || req.user.mobile || "",
    email: req.body.passenger_email || req.body.passengerEmail || req.body.details?.passenger?.email || req.user.email || "",
  };
  if (!passenger.name || !passenger.mobile || !passenger.email) {
    return res.status(400).json({ message: "Passenger name, mobile, and email are required" });
  }

  const pnr = makePnr();
  if (flight) {
    const seatMap = new Map((flight.seats || []).map((seat) => [seat.seatNumber, seat]));
    const unavailable = seats.filter((seatNumber) => {
      const seat = seatMap.get(seatNumber);
      return seat && seat.status !== "available";
    });
    if (unavailable.length) return res.status(409).json({ message: `Seats unavailable: ${unavailable.join(", ")}` });

    seats.forEach((seatNumber) => {
      const seat = seatMap.get(seatNumber);
      if (!seat) return;
      seat.status = "booked";
      seat.passengerName = passenger.name;
      seat.mobile = passenger.mobile;
      seat.email = passenger.email;
      seat.pnr = pnr;
      seat.amount = number(req.body.total_amount ?? req.body.totalAmount ?? req.body.amount);
      seat.paymentStatus = req.body.payment_status || req.body.paymentStatus || "paid";
      seat.bookingStatus = req.body.booking_status || req.body.bookingStatus || "confirmed";
      seat.bookingDate = new Date();
    });
    flight.bookedSeats = flight.seats.filter((seat) => seat.status === "booked").length;
    flight.blockedSeats = flight.seats.filter((seat) => seat.status === "blocked").length;
    flight.availableSeats = Math.max(Number(flight.totalSeats || flight.seats.length) - flight.bookedSeats - flight.blockedSeats, 0);
    await flight.save();
  }

  const amount = number(req.body.total_amount ?? req.body.totalAmount ?? req.body.amount);
  const airlineName = flight?.airlineName || flightDetails.airline || flightDetails.airlineName || "Flight";
  const flightNumber = flight?.flightNumber || flightDetails.flightNumber || "";
  const booking = await Booking.create({
    user: req.user.id,
    vendor: flight?.vendor || flight?.vendorId || flightDetails.vendor || null,
    vendorId: flight?.vendorId || flight?.vendor || flightDetails.vendor || null,
    module: "flight",
    title: `${airlineName} ${flightNumber}`.trim(),
    flightId,
    customerName: passenger.name,
    customerEmail: passenger.email,
    customerMobile: passenger.mobile,
    seats,
    amount,
    bookingCode: makeBookingCode(),
    status: req.body.booking_status || req.body.bookingStatus || "confirmed",
    paymentStatus: req.body.payment_status || req.body.paymentStatus || "paid",
    details: {
      ...(req.body.details || {}),
      pnr,
      flightId,
      passenger,
      flight: flightDetails,
      cabinClass: req.body.class_type || req.body.classType || req.body.details?.cabinClass || flight?.cabinClass || flight?.classType,
      seats,
    },
  });

  res.status(201).json({ message: "Flight booking confirmed", booking, pnr });
};

const getFlightBookings = async (req, res) => {
  const query =
    req.user.role === "admin"
      ? { module: "flight" }
      : req.user.role === "vendor"
        ? { module: "flight", vendor: req.user.id }
        : { module: "flight", user: req.user.id };
  const bookings = await Booking.find(query).sort({ createdAt: -1 });
  res.json(bookings);
};

module.exports = {
  createFlight,
  getFlights,
  getFlight,
  updateFlight,
  deleteFlight,
  createFlightBooking,
  getFlightBookings,
  mapFlight,
};
