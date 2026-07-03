const Booking = require("../models/Booking");
const Flight = require("../models/Flight");
const { emitVendorUpdated } = require("../socket");
const { prepareFlightImages } = require("../services/flightImageService");

const makeBookingCode = () => `TH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const makePnr = () => `PNR${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

const toBool = (value) => value === true || value === "true" || value === "yes" || value === 1 || value === "1";
const number = (value, fallback = 0) => Number(value === undefined || value === null || value === "" ? fallback : value);
const airportCode = (value) => String(value || "AIR").trim().slice(0, 3).toUpperCase();
const seatSelectionModes = ["DURING_BOOKING", "AFTER_BOOKING", "CHECK_IN"];
let seatMutationQueue = Promise.resolve();

// Seat claims are serialized so payment and manage-booking requests cannot take the same seat.
const withSeatMutationLock = async (task) => {
  const previous = seatMutationQueue;
  let release;
  seatMutationQueue = new Promise((resolve) => { release = resolve; });
  await previous;
  try {
    return await task();
  } finally {
    release();
  }
};

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
    flightName: body.flight_name ?? body.flightName ?? body.airline_name ?? body.airlineName ?? body.airline ?? "",
    airlineLogo: body.airline_logo ?? body.airlineLogo ?? body.airlineLogoUrl ?? "",
    flightBanner: body.flight_banner ?? body.flightBanner ?? body.bannerImage ?? body.bannerImageUrl ?? "",
    flightThumbnail: body.flight_thumbnail ?? body.flightThumbnail ?? body.thumbnailImage ?? body.imageUrl ?? "",
    flightGallery: Array.isArray(body.flightGallery) ? body.flightGallery : [],
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
    seatSelectionMode: seatSelectionModes.includes(body.seatSelectionMode) ? body.seatSelectionMode : "CHECK_IN",
    checkInOpenHoursBefore: 24,
  };
};

const mapFlight = (flight) => ({
  id: String(flight._id),
  _id: flight._id,
  vendor: flight.vendor || flight.vendorId,
  airlineLogoUrl: flight.airlineLogo || "",
  airlineLogo: flight.airlineLogo || "",
  flightBanner: flight.flightBanner || "",
  flightThumbnail: flight.flightThumbnail || "",
  flightGallery: flight.flightGallery || [],
  airline: flight.airlineName,
  airlineName: flight.airlineName,
  flightName: flight.flightName || flight.airlineName,
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
  seatSelectionMode: flight.seatSelectionMode || "CHECK_IN",
  checkInOpenHoursBefore: Number(flight.checkInOpenHoursBefore ?? 24),
});

const createFlight = async (req, res) => {
  const images = prepareFlightImages(req, req.body);
  const payload = normalizeFlightPayload({ ...req.body, ...images }, req.user);
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

  const existingData = existing.toObject();
  const images = prepareFlightImages(req, req.body, existingData);
  const payload = normalizeFlightPayload({ ...existingData, ...req.body, ...images }, req.user);
  const flight = await Flight.findByIdAndUpdate(req.params.id, payload, { new: true });
  res.json({ message: "Flight updated", flight: mapFlight(flight) });
};

const deleteFlight = async (req, res) => {
  const flight = await Flight.findByIdAndDelete(req.params.id);
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  res.json({ message: "Flight deleted" });
};

const createFlightBooking = async (req, res) => withSeatMutationLock(async () => {
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
  const seatSelectionMode = flight?.seatSelectionMode || flightDetails.seatSelectionMode || "CHECK_IN";
  const assignedSeats = seatSelectionMode === "DURING_BOOKING" ? seats : [];
  if (seatSelectionMode === "DURING_BOOKING" && !assignedSeats.length) {
    return res.status(400).json({ message: "Seat selection is required for this flight" });
  }
  if (new Set(assignedSeats).size !== assignedSeats.length) {
    return res.status(400).json({ message: "Duplicate seat numbers are not allowed" });
  }

  const passenger = {
    name: req.body.passenger_name || req.body.passengerName || req.body.details?.passenger?.name || req.user.name || "",
    mobile: req.body.passenger_mobile || req.body.passengerMobile || req.body.details?.passenger?.mobile || req.user.mobile || "",
    email: req.body.passenger_email || req.body.passengerEmail || req.body.details?.passenger?.email || req.user.email || "",
  };
  if (!passenger.name || !passenger.mobile || !passenger.email) {
    return res.status(400).json({ message: "Passenger name, mobile, and email are required" });
  }

  const pnr = makePnr();
  if (!flight && assignedSeats.length) {
    const validSeats = new Set(buildSeats(Number(flightDetails.totalSeats || 180), flightDetails.aircraftType || flightDetails.aircraft || "A320").map((seat) => seat.seatNumber));
    const reserved = new Set((flightDetails.reservedSeats || []).map((seat) => String(seat).replace(/^(\d+)([A-Z])$/, "$2$1")));
    const related = await Booking.find({ module: "flight", flightId });
    related.flatMap((booking) => booking.seats || []).forEach((seat) => reserved.add(seat));
    const unavailable = assignedSeats.filter((seat) => !validSeats.has(seat) || reserved.has(seat));
    if (unavailable.length) return res.status(409).json({ message: `Seats unavailable: ${unavailable.join(", ")}` });
  }
  if (flight) {
    const seatMap = new Map((flight.seats || []).map((seat) => [seat.seatNumber, seat]));
    const unavailable = assignedSeats.filter((seatNumber) => {
      const seat = seatMap.get(seatNumber);
      return !seat || seat.status !== "available";
    });
    if (unavailable.length) return res.status(409).json({ message: `Seats unavailable: ${unavailable.join(", ")}` });

    assignedSeats.forEach((seatNumber) => {
      const seat = seatMap.get(seatNumber);
      if (!seat) return;
      seat.status = "booked";
      seat.passengerName = passenger.name;
      seat.mobile = passenger.mobile;
      seat.email = passenger.email;
      seat.pnr = pnr;
      seat.amount = number(req.body.total_amount ?? req.body.totalAmount ?? req.body.amount);
      seat.paymentStatus = "PAID";
      seat.bookingStatus = "CONFIRMED";
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
    seats: assignedSeats,
    seatNumber: assignedSeats[0] || null,
    amount,
    bookingCode: makeBookingCode(),
    status: "confirmed",
    bookingStatus: "CONFIRMED",
    paymentStatus: "PAID",
    pnr,
    checkInStatus: "NOT_CHECKED_IN",
    boardingPassGenerated: false,
    qrData: null,
    details: {
      ...(req.body.details || {}),
      pnr,
      flightId,
      passenger,
      flight: flightDetails,
      cabinClass: req.body.class_type || req.body.classType || req.body.details?.cabinClass || flight?.cabinClass || flight?.classType,
      seats: assignedSeats,
      seatSelectionMode,
      checkInOpenHoursBefore: 24,
      bookingStatus: "CONFIRMED",
      paymentStatus: "PAID",
      checkInStatus: "NOT_CHECKED_IN",
    },
  });

  if (booking.vendorId || booking.vendor) {
    emitVendorUpdated(booking.vendorId || booking.vendor, "newBooking", { booking });
  }

  res.status(201).json({ message: "Flight booking confirmed", booking, pnr });
});

const getOwnedFlightBooking = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId, module: "flight" });
  if (!booking) return { error: "Flight booking not found" };

  const flightId = booking.flightId || booking.details?.flightId || booking.details?.flight?._id || booking.details?.flight?.id;
  let flight = flightId ? await Flight.findById(flightId) : null;

  // Demo/search flights are snapshots rather than Flight rows; rebuild their seat inventory safely.
  if (!flight && booking.details?.flight) {
    const snapshot = booking.details.flight;
    const aircraft = snapshot.aircraftType || snapshot.aircraft || "A320";
    const reserved = new Set((snapshot.reservedSeats || []).map((seat) => String(seat).replace(/^(\d+)([A-Z])$/, "$2$1")));
    const seats = buildSeats(Number(snapshot.totalSeats || 180), aircraft)
      .map((seat) => ({ ...seat, status: reserved.has(seat.seatNumber) ? "booked" : "available" }));
    const related = await Booking.find({ module: "flight", flightId });
    const assigned = new Set(related.flatMap((item) => item.seats || []));
    seats.forEach((seat) => { if (assigned.has(seat.seatNumber)) seat.status = "booked"; });
    flight = {
      ...snapshot,
      _id: flightId,
      airlineName: snapshot.airlineName || snapshot.airline,
      fromCity: snapshot.fromCity || snapshot.from,
      toCity: snapshot.toCity || snapshot.to,
      aircraftType: aircraft,
      seatSelectionMode: snapshot.seatSelectionMode || booking.details?.seatSelectionMode || "CHECK_IN",
      totalSeats: seats.length,
      availableSeats: seats.filter((seat) => seat.status === "available").length,
      seats,
    };
  }

  if (!flight) return { error: "Flight is no longer available" };
  return { booking, flight };
};

const getAvailableFlightSeats = async (req, res) => {
  const result = await getOwnedFlightBooking(req.params.id, req.user.id);
  if (result.error) return res.status(404).json({ message: result.error });
  const { booking, flight } = result;
  const mode = flight.seatSelectionMode || "CHECK_IN";
  const checkInWindow = getCheckInWindow(flight);
  if (mode === "CHECK_IN" && !checkInWindow.isCheckInOpen) {
    return res.status(403).json({ message: "Seat selection will open 24 hours before departure.", ...checkInWindow });
  }
  return res.json({
    booking: {
      _id: booking._id,
      title: booking.title,
      pnr: booking.pnr || booking.details?.pnr,
      seatNumber: booking.seatNumber || booking.seats?.[0] || null,
      bookingStatus: booking.bookingStatus,
      seatSelectionMode: mode,
    },
    flight: mapFlight(flight),
    seats: (flight.seats || []).map((seat) => ({ seatNumber: seat.seatNumber, status: seat.status })),
  });
};

const getCheckInWindow = (flight) => {
  const hoursBefore = 24;
  const departure = new Date(`${flight.departureDate || ""}T${flight.departureTime || "00:00"}:00`);
  if (Number.isNaN(departure.getTime())) {
    return { isCheckInOpen: false, checkInOpenHoursBefore: hoursBefore, checkInOpensAt: null, departureAt: null };
  }
  const opensAt = new Date(departure.getTime() - hoursBefore * 60 * 60 * 1000);
  const now = new Date();
  return {
    isCheckInOpen: now >= opensAt && now < departure,
    checkInOpenHoursBefore: hoursBefore,
    checkInOpensAt: opensAt.toISOString(),
    departureAt: departure.toISOString(),
  };
};

const flightBookingResponse = (booking, flight) => ({
  ...booking.toObject(),
  pnr: booking.pnr || booking.details?.pnr,
  seatNumber: booking.seatNumber || booking.seats?.[0] || null,
  checkInStatus: booking.checkInStatus || "NOT_CHECKED_IN",
  boardingPassGenerated: Boolean(booking.boardingPassGenerated),
  qrData: booking.qrData || null,
  flight: mapFlight(flight),
  ...getCheckInWindow(flight),
});

const getFlightBooking = async (req, res) => {
  const result = await getOwnedFlightBooking(req.params.id, req.user.id);
  if (result.error) return res.status(404).json({ message: result.error });
  return res.json(flightBookingResponse(result.booking, result.flight));
};

const selectFlightSeat = async (req, res) => withSeatMutationLock(async () => {
  const result = await getOwnedFlightBooking(req.params.id, req.user.id);
  if (result.error) return res.status(404).json({ message: result.error });
  const { booking, flight } = result;
  if ((flight.seatSelectionMode || "CHECK_IN") !== "AFTER_BOOKING") {
    return res.status(400).json({ message: "Manual seat selection is not available for this flight" });
  }
  if (String(booking.bookingStatus || booking.status).toUpperCase() !== "CONFIRMED") {
    return res.status(400).json({ message: "Only confirmed bookings can select a seat" });
  }
  if (booking.seatNumber || booking.seats?.length) {
    return res.status(409).json({ message: "A seat is already assigned to this booking" });
  }

  const seatNumber = String(req.body.seatNumber || "").trim().toUpperCase();
  const seat = (flight.seats || []).find((item) => item.seatNumber === seatNumber);
  if (!seat) return res.status(404).json({ message: "Seat does not exist on this flight" });
  if (seat.status !== "available") return res.status(409).json({ message: "Seat is no longer available" });

  seat.status = "booked";
  seat.bookingId = booking._id;
  seat.passengerName = booking.details?.passenger?.name || booking.customerName || "Passenger";
  seat.pnr = booking.pnr || booking.details?.pnr || "";
  flight.bookedSeats = flight.seats.filter((item) => item.status === "booked").length;
  flight.blockedSeats = flight.seats.filter((item) => item.status === "blocked").length;
  flight.availableSeats = Math.max(Number(flight.totalSeats || flight.seats.length) - flight.bookedSeats - flight.blockedSeats, 0);

  booking.seatNumber = seatNumber;
  booking.seats = [seatNumber];
  booking.details = { ...booking.details, seats: [seatNumber] };
  booking.markModified?.("details");
  await flight.save?.();
  await booking.save();

  return res.json({
    message: "Seat assigned",
    booking: { ...booking.toObject(), seatNumber, qrData: null, boardingPassGenerated: false },
  });
});

const checkInFlight = async (req, res) => withSeatMutationLock(async () => {
  const result = await getOwnedFlightBooking(req.params.id, req.user.id);
  if (result.error) return res.status(404).json({ message: result.error });
  const { booking, flight } = result;
  if (booking.checkInStatus === "CHECKED_IN") {
    return res.status(409).json({ message: "Passenger is already checked in" });
  }
  if (String(booking.bookingStatus || booking.status).toUpperCase() !== "CONFIRMED" || String(booking.paymentStatus).toUpperCase() !== "PAID") {
    return res.status(400).json({ message: "Only confirmed, paid flight bookings can check in" });
  }

  const window = getCheckInWindow(flight);
  if (!window.isCheckInOpen) {
    return res.status(400).json({ message: `Check-in opens ${window.checkInOpenHoursBefore} hours before departure.`, ...window });
  }

  const mode = flight.seatSelectionMode || booking.details?.seatSelectionMode || "CHECK_IN";
  let seatNumber = booking.seatNumber || booking.seats?.[0] || null;
  if (!seatNumber && mode === "AUTO_ASSIGN") {
    seatNumber = (flight.seats || []).find((seat) => seat.status === "available")?.seatNumber || null;
  } else if (!seatNumber) {
    seatNumber = String(req.body.seatNumber || "").trim().toUpperCase() || null;
  }
  if (!seatNumber) return res.status(409).json({ message: "Select an available seat before completing check-in" });

  if (!booking.seatNumber && !booking.seats?.length) {
    const seat = (flight.seats || []).find((item) => item.seatNumber === seatNumber);
    if (!seat) return res.status(404).json({ message: "Seat does not exist on this flight" });
    if (seat.status !== "available") return res.status(409).json({ message: "Seat is no longer available" });
    seat.status = "booked";
    seat.bookingId = booking._id;
    seat.passengerName = booking.details?.passenger?.name || booking.customerName || "Passenger";
    seat.pnr = booking.pnr || booking.details?.pnr || "";
    flight.bookedSeats = flight.seats.filter((item) => item.status === "booked").length;
    flight.blockedSeats = flight.seats.filter((item) => item.status === "blocked").length;
    flight.availableSeats = Math.max(Number(flight.totalSeats || flight.seats.length) - flight.bookedSeats - flight.blockedSeats, 0);
    await flight.save?.();
  }

  const frontendOrigin = req.get("origin") || "http://localhost:5173";
  const qrData = `${frontendOrigin}/verify/boarding-pass/${encodeURIComponent(booking._id)}`;
  booking.seatNumber = seatNumber;
  booking.seats = [seatNumber];
  booking.checkInStatus = "CHECKED_IN";
  booking.checkedIn = true;
  booking.checkedInAt = new Date();
  booking.boardingPassGenerated = true;
  booking.qrData = qrData;
  booking.details = { ...booking.details, seats: [seatNumber], checkInStatus: "CHECKED_IN" };
  booking.markModified?.("details");
  await booking.save();

  return res.json({ message: "Check-in complete", boardingPass: flightBookingResponse(booking, flight) });
});

const verifyBoardingPass = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ valid: false, message: "Invalid boarding pass: booking not found" });
  if (booking.module !== "flight") return res.status(400).json({ valid: false, message: "Invalid boarding pass: booking is not a flight" });
  if (booking.checkInStatus !== "CHECKED_IN") return res.status(400).json({ valid: false, message: "Invalid boarding pass: passenger is not checked in" });
  if (!booking.boardingPassGenerated) return res.status(400).json({ valid: false, message: "Invalid boarding pass: boarding pass was not generated" });
  const seatNumber = booking.seatNumber || booking.seats?.[0] || null;
  if (!seatNumber) return res.status(400).json({ valid: false, message: "Invalid boarding pass: seat is not assigned" });
  if (!booking.qrData) return res.status(400).json({ valid: false, message: "Invalid boarding pass: QR verification data is missing" });
  const flight = await Flight.findById(booking.flightId || booking.details?.flightId);
  const snapshot = flight || booking.details?.flight || {};
  return res.json({
    valid: true,
    message: "Boarding pass verified",
    boardingPass: {
      bookingId: booking._id,
      passengerName: booking.details?.passenger?.name || booking.customerName || "Passenger",
      pnr: booking.pnr || booking.details?.pnr,
      flightNumber: snapshot.flightNumber || "",
      airline: snapshot.airlineName || snapshot.airline || "",
      source: snapshot.fromCode || snapshot.fromCity || snapshot.from || "",
      destination: snapshot.toCode || snapshot.toCity || snapshot.to || "",
      departureDate: snapshot.departureDate || "",
      departureTime: snapshot.departureTime || "",
      seatNumber,
      checkInStatus: booking.checkInStatus,
      boardingPassGenerated: Boolean(booking.boardingPassGenerated),
    },
  });
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
  getAvailableFlightSeats,
  getFlightBooking,
  selectFlightSeat,
  checkInFlight,
  verifyBoardingPass,
  mapFlight,
};
