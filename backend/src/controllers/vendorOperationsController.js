const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const RefundRequest = require("../models/RefundRequest");
const Screen = require("../models/Screen");
const SeatBlock = require("../models/SeatBlock");
const Show = require("../models/Show");
const Theatre = require("../models/Theatre");
const TicketScan = require("../models/TicketScan");
const VendorNotification = require("../models/VendorNotification");
const VendorPayout = require("../models/VendorPayout");
const VendorPricing = require("../models/VendorPricing");
const VendorStaff = require("../models/VendorStaff");
const { emitVendorUpdated } = require("../socket");

const vendorQuery = (req) => {
  if (req.user.role === "admin") return {};
  return { $or: [{ vendor: req.user.id }, { vendorId: req.user.id }] };
};

const vendorPayload = (req) => ({
  vendor: req.user.id,
  vendorId: req.user.id,
});

const vendorIdFromBooking = (booking) => String(booking.vendorId || booking.vendor || booking.details?.vendorId || "");

const belongsToVendor = (req, booking) => (
  req.user.role === "admin" || vendorIdFromBooking(booking) === String(req.user.id)
);

const money = (value) => Math.max(Number(value || 0), 0);

const parseTicketCode = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return {
      bookingCode: parsed.bookingCode || parsed.code || parsed.bookingId || parsed._id,
      bookingId: parsed.bookingId || parsed._id || parsed.id,
      seatNumber: parsed.seatNumber || parsed.seat,
    };
  } catch {
    return { bookingCode: raw, bookingId: raw };
  }
};

const findBookingByTicket = async (req, ticketCode) => {
  const parsed = parseTicketCode(ticketCode);
  const bookings = await Booking.find({ module: "movie" }).populate("user", "name email mobile phone");
  return bookings.find((booking) => {
    const ids = [booking._id, booking.bookingCode, booking.details?.bookingCode].filter(Boolean).map(String);
    return ids.includes(String(parsed.bookingCode || "")) || ids.includes(String(parsed.bookingId || ""));
  });
};

const getTicketScanner = async (req, res) => {
  const scans = await TicketScan.find(vendorQuery(req)).sort({ createdAt: -1 });
  res.json(scans.slice(0, 25));
};

const scanTicket = async (req, res) => {
  const ticketCode = req.body.ticketCode || req.body.qrCode || req.body.code;
  const parsed = parseTicketCode(ticketCode);
  const booking = await findBookingByTicket(req, ticketCode);

  if (!booking || !belongsToVendor(req, booking)) {
    return res.status(404).json({ status: "invalid", message: "Ticket is invalid or not owned by this vendor" });
  }

  const existing = await TicketScan.findOne({
    $or: [{ bookingId: booking._id }, { bookingCode: booking.bookingCode }],
    ...vendorQuery(req),
  });

  if (existing) {
    return res.status(409).json({ status: "already_used", message: "Ticket already checked in", scan: existing, booking });
  }

  const seatNumber = parsed.seatNumber || (booking.seats || [])[0] || "";
  const scan = await TicketScan.create({
    ...vendorPayload(req),
    bookingId: booking._id,
    bookingCode: booking.bookingCode,
    ticketCode: String(ticketCode || booking.bookingCode),
    customerName: booking.customerName || booking.user?.name || booking.details?.customerName || "Customer",
    movieTitle: booking.title,
    seatNumber,
    checkedInAt: new Date(),
    checkedInBy: req.user.id,
    status: "checked-in",
  });

  booking.status = "completed";
  booking.details = { ...(booking.details || {}), checkedIn: true, checkedInAt: scan.checkedInAt };
  booking.markModified?.("details");
  await booking.save();
  emitVendorUpdated(req.user.id, "ticketCheckedIn", { scan, booking });
  res.json({ status: "valid", message: "Ticket checked in", scan, booking });
};

const getShowAnalytics = async (req, res) => {
  const [movies, bookings, blocks] = await Promise.all([
    Movie.find(vendorQuery(req)),
    Booking.find({ module: "movie", ...vendorQuery(req) }),
    SeatBlock.find({ ...vendorQuery(req), status: "blocked" }),
  ]);

  const rows = movies.map((movie) => {
    const movieBookings = bookings.filter((booking) => {
      const details = booking.details || {};
      return String(booking.movieId || details.movieId || "") === String(movie._id) || booking.title === movie.title;
    });
    const bookedSeats = movieBookings.reduce((sum, booking) => sum + (booking.seats || []).length, 0);
    const blockedSeats = blocks.filter((block) => String(block.targetId) === String(movie._id)).length;
    const totalSeats = Number(movie.totalSeats || 0);
    const revenue = movieBookings.reduce((sum, booking) => sum + money(booking.amount), 0);

    return {
      movieId: movie._id,
      movieTitle: movie.title,
      showTime: movie.showTime || movie.showTimes?.[0] || "-",
      theatre: movie.theatre || movie.theatreName || "-",
      totalSeats,
      bookedSeats,
      blockedSeats,
      availableSeats: Math.max(totalSeats - bookedSeats - blockedSeats, 0),
      occupancyPercentage: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0,
      revenue,
      revenuePerShow: revenue,
    };
  });

  res.json(rows);
};

const getPricing = async (req, res) => {
  const pricing = await VendorPricing.findOne(vendorQuery(req));
  res.json(pricing || {});
};

const savePricing = async (req, res) => {
  const pricing = await VendorPricing.findOneAndUpdate(
    { vendor: req.user.id },
    { ...req.body, ...vendorPayload(req) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  emitVendorUpdated(req.user.id, "pricingUpdated", pricing);
  res.json({ message: "Pricing updated", pricing });
};

const updateShowPrice = async (req, res) => {
  const price = money(req.body.price);
  const show = await Show.findOneAndUpdate({ _id: req.params.showId, ...vendorQuery(req) }, { price }, { new: true });
  if (!show) return res.status(404).json({ message: "Show not found" });
  emitVendorUpdated(req.user.id, "showPriceUpdated", show);
  res.json({ message: "Show price updated", show });
};

const getRefundRequests = async (req, res) => {
  const existing = await RefundRequest.find(vendorQuery(req)).sort({ createdAt: -1 });
  const existingBookingIds = new Set(existing.map((item) => String(item.bookingId)));
  const cancelledBookings = await Booking.find({ module: "movie", status: { $in: ["cancelled", "refunded"] }, ...vendorQuery(req) }).populate("user", "name email mobile phone");
  const generated = cancelledBookings
    .filter((booking) => !existingBookingIds.has(String(booking._id)))
    .map((booking) => ({
      _id: `request-${booking._id}`,
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName || booking.user?.name || "Customer",
      movieTitle: booking.title,
      amount: booking.amount,
      refundStatus: booking.paymentStatus === "refunded" ? "paid" : "pending",
      reason: booking.details?.cancelReason || "Customer cancellation request",
      createdAt: booking.updatedAt || booking.createdAt,
    }));
  res.json([...existing, ...generated]);
};

const updateRefundStatus = async (req, res) => {
  const allowed = ["pending", "approved", "rejected", "paid"];
  const refundStatus = String(req.body.refundStatus || req.body.status || "").toLowerCase();
  if (!allowed.includes(refundStatus)) return res.status(400).json({ message: "Invalid refund status" });

  let refund = await RefundRequest.findOne({ _id: req.params.id, ...vendorQuery(req) });
  if (!refund) {
    const booking = await Booking.findOne({ _id: req.params.id, ...vendorQuery(req) });
    if (!booking) return res.status(404).json({ message: "Refund request not found" });
    refund = await RefundRequest.create({
      ...vendorPayload(req),
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName || booking.details?.customerName || "Customer",
      movieTitle: booking.title,
      amount: booking.amount,
      reason: booking.details?.cancelReason || "Customer cancellation request",
      refundStatus,
    });
  } else {
    refund.refundStatus = refundStatus;
    refund.reviewedBy = req.user.id;
    refund.reviewedAt = new Date();
    await refund.save();
  }

  if (refund.bookingId && ["approved", "paid"].includes(refundStatus)) {
    const booking = await Booking.findById(refund.bookingId);
    if (booking) {
      booking.status = refundStatus === "paid" ? "refunded" : "cancelled";
      booking.paymentStatus = refundStatus === "paid" ? "refunded" : booking.paymentStatus;
      await booking.save();
    }
  }

  emitVendorUpdated(req.user.id, "refundUpdated", refund);
  res.json({ message: "Refund status updated", refund });
};

const getPayoutHistory = async (req, res) => {
  const saved = await VendorPayout.find(vendorQuery(req)).sort({ createdAt: -1 });
  if (saved.length) return res.json(saved);

  const bookings = await Booking.find({ module: "movie", ...vendorQuery(req) });
  const totalRevenue = bookings.reduce((sum, booking) => sum + money(booking.amount), 0);
  const platformCommission = Math.round(totalRevenue * 0.12);
  res.json([{
    _id: "current-cycle",
    settlementId: "SETTLE-CURRENT",
    totalRevenue,
    platformCommission,
    vendorPayableAmount: totalRevenue - platformCommission,
    settlementStatus: totalRevenue ? "pending" : "paid",
    settlementDate: totalRevenue ? "" : new Date(),
  }]);
};

const savePayout = async (req, res) => {
  const totalRevenue = money(req.body.totalRevenue);
  const platformCommission = money(req.body.platformCommission || Math.round(totalRevenue * 0.12));
  const payout = await VendorPayout.create({
    ...vendorPayload(req),
    settlementId: req.body.settlementId || `SETTLE-${Date.now().toString(36).toUpperCase()}`,
    totalRevenue,
    platformCommission,
    vendorPayableAmount: money(req.body.vendorPayableAmount ?? totalRevenue - platformCommission),
    settlementStatus: req.body.settlementStatus || "pending",
    settlementDate: req.body.settlementDate || new Date(),
  });
  emitVendorUpdated(req.user.id, "payoutUpdated", payout);
  res.status(201).json({ message: "Payout recorded", payout });
};

const getStaff = async (req, res) => {
  const staff = await VendorStaff.find(vendorQuery(req)).sort({ createdAt: -1 });
  res.json(staff);
};

const createStaff = async (req, res) => {
  const role = req.body.role || "Ticket Checker";
  if (!["Manager", "Ticket Checker", "Cashier"].includes(role)) return res.status(400).json({ message: "Invalid staff role" });
  const staff = await VendorStaff.create({ ...req.body, role, ...vendorPayload(req) });
  emitVendorUpdated(req.user.id, "staffUpdated", staff);
  res.status(201).json({ message: "Staff added", staff });
};

const updateStaff = async (req, res) => {
  const staff = await VendorStaff.findOneAndUpdate({ _id: req.params.id, ...vendorQuery(req) }, req.body, { new: true });
  if (!staff) return res.status(404).json({ message: "Staff not found" });
  emitVendorUpdated(req.user.id, "staffUpdated", staff);
  res.json({ message: "Staff updated", staff });
};

const getNotifications = async (req, res) => {
  const saved = await VendorNotification.find(vendorQuery(req)).sort({ createdAt: -1 });
  const [movies, bookings] = await Promise.all([
    Movie.find(vendorQuery(req)),
    Booking.find({ module: "movie", ...vendorQuery(req) }).sort({ createdAt: -1 }),
  ]);
  const generated = [
    bookings[0] && {
      _id: "alert-new-booking",
      type: "new_booking",
      title: "New booking alert",
      message: `${bookings[0].title} booking received`,
      createdAt: bookings[0].createdAt,
    },
    ...movies
      .filter((movie) => Number(movie.totalSeats || 0) - Number(movie.bookedSeats?.length || 0) <= 10)
      .slice(0, 2)
      .map((movie) => ({
        _id: `alert-low-seat-${movie._id}`,
        type: "low_seat",
        title: "Low seat availability alert",
        message: `${movie.title} has limited seats left`,
        createdAt: new Date(),
      })),
  ].filter(Boolean);
  res.json([...saved, ...generated]);
};

const createNotification = async (req, res) => {
  const notification = await VendorNotification.create({ ...req.body, ...vendorPayload(req) });
  emitVendorUpdated(req.user.id, "vendorNotification", notification);
  res.status(201).json({ message: "Notification added", notification });
};

const updateMovieStatus = async (req, res) => {
  const allowed = ["upcoming", "now_showing", "house_full", "ended", "cancelled", "hidden", "active", "draft"];
  const status = String(req.body.status || "").toLowerCase().replace(/\s+/g, "_");
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid movie status" });
  const movie = await Movie.findOneAndUpdate({ _id: req.params.id, ...vendorQuery(req) }, { status }, { new: true });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  emitVendorUpdated(req.user.id, "movieStatusUpdated", movie);
  res.json({ message: "Movie status updated", movie });
};

const getCustomerList = async (req, res) => {
  const bookings = await Booking.find({ module: "movie", ...vendorQuery(req) }).populate("user", "name email mobile phone").sort({ createdAt: -1 });
  res.json(bookings.map((booking) => ({
    _id: booking._id,
    customerName: booking.customerName || booking.user?.name || booking.details?.customerName || "Customer",
    mobile: booking.customerMobile || booking.user?.mobile || booking.user?.phone || booking.details?.customerMobile || "-",
    email: booking.customerEmail || booking.user?.email || booking.details?.customerEmail || "-",
    movieBooked: booking.title,
    seatNumber: (booking.seats || []).join(", "),
    bookingDate: booking.createdAt,
    paymentStatus: booking.paymentStatus || "paid",
  })));
};

const getTheatreOverview = async (req, res) => {
  const [theatres, screens, shows] = await Promise.all([
    Theatre.find(vendorQuery(req)).sort({ createdAt: -1 }),
    Screen.find(vendorQuery(req)).sort({ createdAt: -1 }),
    Show.find(vendorQuery(req)).sort({ createdAt: -1 }),
  ]);
  res.json({ theatres, screens, shows });
};

module.exports = {
  createNotification,
  createStaff,
  getCustomerList,
  getNotifications,
  getPayoutHistory,
  getPricing,
  getRefundRequests,
  getShowAnalytics,
  getStaff,
  getTheatreOverview,
  getTicketScanner,
  savePayout,
  savePricing,
  scanTicket,
  updateMovieStatus,
  updateRefundStatus,
  updateShowPrice,
  updateStaff,
};
