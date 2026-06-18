const express = require("express");
const crypto = require("crypto");

const Booking = require("../models/Booking");
const Flight = require("../models/Flight");
const Movie = require("../models/Movie");
const SeatBlock = require("../models/SeatBlock");
const VendorListing = require("../models/VendorListing");
const WalletTransaction = require("../models/WalletTransaction");
const { requireAuth } = require("../middleware/authMiddleware");
const VendorNotification = require("../models/VendorNotification");
const { emitVendorUpdated } = require("../socket");
const {
  makeShowId,
  markMovieSeatsBooked,
  validateMovieSeatsAvailable,
} = require("../services/movieSeatService");

const router = express.Router();

const makeBookingCode = () => `TH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const makeQrToken = () => `QR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
const makeQrCodeUrl = (req, qrToken) => {
  if (!qrToken) return "";
  return `${req.protocol}://${req.get("host")}/api/vendor/qr/verify?token=${encodeURIComponent(qrToken)}`;
};

const withQrAliases = (booking) => {
  if (!booking) return booking;
  return {
    ...booking.toObject?.() || booking,
    qrToken: booking.qrToken || booking.qr_token || "",
    qr_token: booking.qrToken || booking.qr_token || "",
    qrCodeUrl: booking.qrCodeUrl || booking.qr_code_url || "",
    qr_code_url: booking.qrCodeUrl || booking.qr_code_url || "",
    bookingId: booking.bookingId || booking.booking_id || booking.bookingCode || "",
    booking_id: booking.bookingId || booking.booking_id || booking.bookingCode || "",
  };
};

const normalizePaymentStatus = (value) => {
  const status = String(value || "paid").toLowerCase();
  if (status === "paid") return "success";
  if (status === "success" || status === "pending" || status === "failed" || status === "refunded") return status;
  return "success";
};

const normalizeBookingStatus = (value) => {
  const status = String(value || "confirmed").toLowerCase();
  if (["pending", "confirmed", "completed", "cancelled", "refunded"].includes(status)) return status;
  return "confirmed";
};

const resolveVendorId = async (module, body) => {
  if (body.vendorId || body.vendor) return body.vendorId || body.vendor;
  if (body.details?.vendorId || body.details?.vendor) return body.details.vendorId || body.details.vendor;

  const movieId = body.movieId || body.details?.movieId || body.details?.movie?._id || body.details?.movie?.id;
  const flightId = body.flightId || body.details?.flightId || body.details?.flight?._id || body.details?.flight?.id;

  if (module === "movie" && movieId) {
    const movie = await Movie.findById(movieId).select("vendor vendorId");
    return movie?.vendorId || movie?.vendor || null;
  }

  if (module === "flight" && flightId) {
    const flight = await Flight.findById(flightId).select("vendor vendorId") || await VendorListing.findById(flightId).select("vendor vendorId");
    return flight?.vendorId || flight?.vendor || null;
  }

  return null;
};

router.use("/bookings", requireAuth);

router.get("/bookings", async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(bookings);
});

router.post("/bookings", async (req, res) => {
  const { module, title, details, seats, amount } = req.body;

  if (!module || !title || amount === undefined) {
    return res.status(400).json({ message: "Module, title, and amount are required" });
  }

  const vendorId = await resolveVendorId(module, req.body);
  const paymentStatus = normalizePaymentStatus(req.body.paymentStatus || req.body.payment_status || details?.paymentStatus || details?.payment_status);
  const bookingStatus = normalizeBookingStatus(req.body.bookingStatus || req.body.booking_status || req.body.status);
  const qrToken = module === "movie" && paymentStatus === "success" && bookingStatus === "confirmed" ? makeQrToken() : "";
  const qrCodeUrl = makeQrCodeUrl(req, qrToken);
  const bookingCode = makeBookingCode();
  const booking = await Booking.create({
    user: req.user.id,
    vendor: vendorId,
    vendorId,
    module,
    title,
    details: details || {},
    seats: seats || [],
    amount,
    totalAmount: amount,
    status: bookingStatus,
    bookingStatus,
    paymentStatus,
    bookingCode,
    bookingId: bookingCode,
    qrToken,
    qrCodeUrl,
    checkedIn: false,
  });
  booking.details = { ...(booking.details || {}), qrToken, qr_token: qrToken, qrCodeUrl, qr_code_url: qrCodeUrl };
  booking.markModified?.("details");
  await booking.save();

  await WalletTransaction.create({
    user: req.user.id,
    type: "debit",
    amount,
    note: `${title} booking payment`,
  });

  res.status(201).json({ message: "Booking confirmed", booking: withQrAliases(booking) });
});

router.post(["/bookings/movie", "/bookings/book-seat"], async (req, res) => {
  req.body.module = "movie";
  req.body.title = req.body.title || req.body.details?.movie?.title || "Movie booking";
  req.body.amount = req.body.amount ?? req.body.totalAmount ?? 0;
  const movieId = req.body.movieId || req.body.details?.movieId || req.body.details?.movie?._id || req.body.details?.movie?.id;
  const showId = req.body.showId || req.body.details?.showId || req.body.details?.showtime?.showId || req.body.details?.showtime?._id;
  const customerName = req.body.customerName || req.body.details?.customerName || req.body.details?.passenger?.name || req.user.name;
  const customerEmail = req.body.customerEmail || req.body.details?.customerEmail || req.body.details?.passenger?.email || req.user.email;
  const customerMobile = req.body.customerMobile || req.body.details?.customerMobile || req.body.details?.passenger?.mobile || req.user.mobile || "";
  const seats = Array.isArray(req.body.seats) ? req.body.seats : [];
  const vendorId = await resolveVendorId("movie", req.body);
  const paymentStatus = normalizePaymentStatus(req.body.paymentStatus || req.body.payment_status || req.body.details?.paymentStatus || req.body.details?.payment_status);
  const bookingStatus = normalizeBookingStatus(req.body.bookingStatus || req.body.status);
  const qrToken = paymentStatus === "success" && bookingStatus === "confirmed" ? makeQrToken() : "";
  const qrCodeUrl = makeQrCodeUrl(req, qrToken);
  const theatre = req.body.theatre || req.body.details?.theatre?.name || req.body.details?.theatre || "";
  const showDate = req.body.showDate || req.body.details?.showDate || req.body.details?.showtime?.date?.value || req.body.details?.showtime?.date?.label || "";
  const showTime = req.body.showTime || req.body.details?.showTime || req.body.details?.showtime?.time || "";

  if (!movieId) return res.status(400).json({ message: "movieId is required" });
  if (!seats.length) return res.status(400).json({ message: "At least one seat is required" });

  const movie = await Movie.findById(movieId).select("title vendor vendorId bookedSeats");
  if (!movie) return res.status(404).json({ message: "Movie not found" });

  const blockedSeats = await SeatBlock.find({
    vendorId: vendorId || movie.vendorId || movie.vendor,
    targetType: { $in: ["movie", "show"] },
    targetId: { $in: [movieId, showId].filter(Boolean) },
    seatNumber: { $in: seats },
    status: "blocked",
  });

  if (blockedSeats.length) {
    return res.status(409).json({ message: `Seats blocked by vendor: ${blockedSeats.map((seat) => seat.seatNumber).join(", ")}` });
  }

  const seatContext = {
    showId: makeShowId({ showId: showId || movieId, movieId }),
    movieId,
    theatre,
    screenId: req.body.screenId || req.body.details?.screenId || "Screen 1",
    showDate,
    showTime,
    totalSeats: movie.totalSeats,
    price: movie.ticketPrice,
  };
  await validateMovieSeatsAvailable(seatContext, seats);

  const seatDetails = seats.map((seatNumber) => ({
    seatNumber,
    status: "booked",
    customerName,
    customerEmail,
    customerMobile,
    amount: req.body.amount,
    paymentStatus: req.body.paymentStatus || "Paid",
  }));

  const booking = await Booking.create({
    user: req.user.id,
    vendor: vendorId,
    vendorId,
    module: "movie",
    movieId,
    showId: showId || undefined,
    customerName,
    customerEmail,
    customerMobile,
    title: req.body.title || movie.title,
    details: {
      ...(req.body.details || {}),
      movieId,
      showId,
      vendorId,
      customerName,
      customerEmail,
      customerMobile,
      theatre,
      showDate,
      showTime,
      seatDetails,
      qrToken,
      qr_token: qrToken,
      qrCodeUrl,
      qr_code_url: qrCodeUrl,
    },
    seats,
    amount: req.body.amount,
    totalAmount: req.body.amount,
    status: bookingStatus,
    bookingStatus,
    paymentStatus,
    bookingCode: makeBookingCode(),
    bookingId: makeBookingCode(),
    qrToken,
    qrCodeUrl,
    checkedIn: false,
  });

  await Movie.findByIdAndUpdate(movieId, {
    $addToSet: { bookedSeats: { $each: seats } },
  });

  booking.details.seatDetails = seatDetails.map((seat) => ({
    ...seat,
    bookingId: booking._id,
  }));
  booking.details.qrToken = qrToken;
  booking.details.qr_token = qrToken;
  booking.details.qrCodeUrl = qrCodeUrl;
  booking.details.qr_code_url = qrCodeUrl;
  booking.markModified("details");
  await booking.save();
  await markMovieSeatsBooked(seatContext, seats, booking, { customerName, customerEmail, customerMobile });
  if (vendorId) {
    const notification = await VendorNotification.create({
      vendor: vendorId,
      vendorId,
      type: "new_booking",
      title: "New booking alert",
      message: `${customerName} booked ${seats.join(", ")} for ${booking.title}`,
      bookingId: booking._id,
      read: false,
    });
    emitVendorUpdated(vendorId, "newBooking", { booking, notification });
  }

  res.status(201).json({ message: "Movie booking confirmed", booking: withQrAliases(booking) });
});

router.post("/bookings/flight", async (req, res) => {
  req.body.module = "flight";
  req.body.title = req.body.title || `${req.body.details?.flight?.airline || "Flight"} ${req.body.details?.flight?.flightNumber || ""}`;
  req.body.amount = req.body.amount ?? req.body.totalAmount ?? 0;
  const flightId = req.body.flightId || req.body.details?.flightId || req.body.details?.flight?._id || req.body.details?.flight?.id;
  const seats = Array.isArray(req.body.seats) ? req.body.seats : [];
  const vendorId = await resolveVendorId("flight", req.body);
  const pnr = `PNR${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const passenger = req.body.details?.passenger || {};

  if (flightId) {
    const flight = await Flight.findById(flightId);
    if (flight) {
      const seatMap = new Map((flight.seats || []).map((seat) => [seat.seatNumber, seat]));
      const alreadyUnavailable = seats.filter((seatNumber) => {
        const seat = seatMap.get(seatNumber);
        return seat && seat.status !== "available";
      });
      if (alreadyUnavailable.length) {
        return res.status(409).json({ message: `Seats unavailable: ${alreadyUnavailable.join(", ")}` });
      }
      seats.forEach((seatNumber) => {
        const seat = seatMap.get(seatNumber);
        if (!seat) return;
        seat.status = "booked";
        seat.passengerName = passenger.name || req.user.name || "Passenger";
        seat.pnr = pnr;
        seat.mobile = passenger.mobile || req.user.mobile || "";
        seat.email = passenger.email || req.user.email || "";
        seat.amount = req.body.amount;
        seat.paymentStatus = "paid";
        seat.bookingStatus = "confirmed";
        seat.bookingDate = new Date();
      });
      flight.bookedSeats = flight.seats.filter((seat) => seat.status === "booked").length;
      flight.blockedSeats = flight.seats.filter((seat) => seat.status === "blocked").length;
      flight.availableSeats = Math.max(Number(flight.totalSeats || flight.seats.length) - flight.bookedSeats - flight.blockedSeats, 0);
      await flight.save();
    }
  }

  const booking = await Booking.create({
    user: req.user.id,
    vendor: vendorId,
    vendorId,
    module: "flight",
    title: req.body.title,
    details: { ...(req.body.details || req.body), pnr, flightId },
    seats,
    amount: req.body.amount,
    bookingCode: makeBookingCode(),
  });
  res.status(201).json({ message: "Flight booking confirmed", booking, pnr });
});

router.get("/my-bookings", requireAuth, async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(bookings);
});

router.patch("/bookings/:id/cancel", async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id, status: { $nin: ["cancelled", "refunded"] } },
    { status: "cancelled" },
    { new: true }
  );

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  await WalletTransaction.create({
    user: req.user.id,
    type: "refund",
    amount: booking.amount,
    note: `${booking.title} cancellation refund`,
  });

  res.json({ message: "Booking cancelled", booking });
});

module.exports = router;
