const crypto = require("crypto");
const { pool } = require("../config/db");
const { emitVendorUpdated } = require("../socket");

const id = () => `${Date.now().toString(16)}${crypto.randomBytes(6).toString("hex")}`.slice(0, 24);
const vendorFilter = (req, alias = "") => (req.user.role === "admin" ? { sql: "1=1", params: [] } : { sql: `${alias}vendor_id = ?`, params: [req.user.id] });
const money = (value) => Math.max(Number(value || 0), 0);
const json = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const scanLog = async ({ booking, req, status, message }) => {
  const scan = {
    id: id(),
    booking_id: booking?.booking_id || booking?.booking_code || booking?.id || "",
    qr_token: booking?.qr_token || req.body.qr_token || req.body.qrToken || "",
    vendor_id: booking?.vendor_id || req.user.id,
    scanned_by: req.user.id,
    scan_status: status,
    scan_message: message,
  };
  await pool.query(
    `INSERT INTO qr_scans (id, booking_id, qr_token, vendor_id, scanned_by, scan_status, scan_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [scan.id, scan.booking_id, scan.qr_token, scan.vendor_id, scan.scanned_by, scan.scan_status, scan.scan_message]
  );
  emitVendorUpdated(scan.vendor_id, "scannerUpdated", scan);
  return scan;
};

const getBookingByQr = async (req) => {
  let qrToken = req.query.token || req.query.qr_token || req.body.qr_token || req.body.qrToken || req.body.ticketCode || req.body.qrCode || req.body.code;
  try {
    const parsed = JSON.parse(qrToken);
    qrToken = parsed.qrToken || parsed.qr_token || parsed.token || parsed.code || qrToken;
  } catch {
    // Plain tokens are expected from QR scanners.
  }
  const filter = vendorFilter(req, "b.");
  const [rows] = await pool.query(
    `SELECT b.*, u.name AS user_name, u.email AS user_email, u.mobile AS user_mobile
     FROM bookings b
     LEFT JOIN users u ON u.id = b.user_id
     WHERE (b.qr_token = ? OR b.booking_id = ? OR b.booking_code = ? OR b.id = ?) AND ${filter.sql}
     LIMIT 1`,
    [qrToken, qrToken, qrToken, qrToken, ...filter.params]
  );
  return rows[0] || null;
};

const verifyQrTicket = async (req, res) => {
  const booking = await getBookingByQr(req);
  if (!booking) {
    const scan = await scanLog({ booking: null, req, status: "invalid", message: "Invalid Ticket" });
    return res.status(404).json({ status: "invalid", message: "Invalid Ticket", scan });
  }
  if (String(booking.payment_status).toLowerCase() !== "success") {
    const scan = await scanLog({ booking, req, status: "invalid", message: "Invalid Ticket" });
    return res.status(400).json({ status: "invalid", message: "Invalid Ticket", booking, scan });
  }
  if (String(booking.booking_status || booking.status).toLowerCase() !== "confirmed") {
    const scan = await scanLog({ booking, req, status: "invalid", message: "Invalid Ticket" });
    return res.status(400).json({ status: "invalid", message: "Invalid Ticket", booking, scan });
  }
  if (booking.checked_in) {
    const scan = await scanLog({ booking, req, status: "already_used", message: "Already Used" });
    return res.status(409).json({ status: "already_used", message: "Already Used", booking, scan });
  }
  const scan = await scanLog({ booking, req, status: "valid", message: "Valid Ticket" });
  res.json({ status: "valid", message: "Valid Ticket", booking, scan });
};

const checkInQrTicket = async (req, res) => {
  const booking = await getBookingByQr(req);
  if (!booking) {
    const scan = await scanLog({ booking: null, req, status: "invalid", message: "Invalid Ticket" });
    return res.status(404).json({ status: "invalid", message: "Invalid Ticket", scan });
  }
  if (String(booking.payment_status).toLowerCase() !== "success") {
    const scan = await scanLog({ booking, req, status: "invalid", message: "Invalid Ticket" });
    return res.status(400).json({ status: "invalid", message: "Invalid Ticket", booking, scan });
  }
  if (String(booking.booking_status || booking.status).toLowerCase() !== "confirmed") {
    const scan = await scanLog({ booking, req, status: "invalid", message: "Invalid Ticket" });
    return res.status(400).json({ status: "invalid", message: "Invalid Ticket", booking, scan });
  }
  if (booking.checked_in) {
    const scan = await scanLog({ booking, req, status: "already_used", message: "Already Used" });
    return res.status(409).json({ status: "already_used", message: "Already Used", booking, scan });
  }

  await pool.query(
    `UPDATE bookings
     SET checked_in = TRUE, checked_in_at = NOW(), scanned_by = ?, booking_status = 'completed', status = 'completed'
     WHERE id = ?`,
    [req.user.id, booking.id]
  );
  const scan = await scanLog({ booking, req, status: "checked_in", message: "Check-in success" });
  emitVendorUpdated(booking.vendor_id, "ticketCheckedIn", { bookingId: booking.booking_id || booking.booking_code, scan });
  res.json({ status: "checked_in", message: "Check-in success", booking: { ...booking, checked_in: true }, scan });
};

const getTicketScanner = async (req, res) => {
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT * FROM qr_scans WHERE ${filter.sql} ORDER BY scanned_at DESC LIMIT 50`, filter.params);
  res.json(rows);
};

const scanTicket = checkInQrTicket;

const getTheatreOverview = async (req, res) => {
  const filter = vendorFilter(req);
  const [theatres] = await pool.query(`SELECT * FROM theatres WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  const [screens] = await pool.query(`SELECT * FROM screens WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  const [shows] = await pool.query(`SELECT * FROM shows WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  res.json({ theatres, screens, shows });
};

const createTheatre = async (req, res) => {
  const theatreId = id();
  await pool.query(
    `INSERT INTO theatres (id, vendor_id, theatre_name, city, location, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [theatreId, req.user.id, req.body.theatre_name || req.body.name || req.body.theatreName || "", req.body.city || "", req.body.location || "", req.body.status || "active"]
  );
  emitVendorUpdated(req.user.id, "theatreUpdated", { id: theatreId });
  res.status(201).json({ message: "Theatre created", theatre: { id: theatreId, ...req.body } });
};

const getTheatres = async (req, res) => {
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT * FROM theatres WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  res.json(rows);
};

const updateTheatre = async (req, res) => {
  const filter = vendorFilter(req);
  const [result] = await pool.query(
    `UPDATE theatres SET theatre_name = ?, city = ?, location = ?, status = ? WHERE id = ? AND ${filter.sql}`,
    [req.body.theatre_name || req.body.name || req.body.theatreName || "", req.body.city || "", req.body.location || "", req.body.status || "active", req.params.id, ...filter.params]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Theatre not found" });
  emitVendorUpdated(req.user.id, "theatreUpdated", { id: req.params.id });
  res.json({ message: "Theatre updated" });
};

const deleteTheatre = async (req, res) => {
  const filter = vendorFilter(req);
  const [result] = await pool.query(`DELETE FROM theatres WHERE id = ? AND ${filter.sql}`, [req.params.id, ...filter.params]);
  if (!result.affectedRows) return res.status(404).json({ message: "Theatre not found" });
  emitVendorUpdated(req.user.id, "theatreUpdated", { id: req.params.id, deleted: true });
  res.json({ success: true });
};

const createScreen = async (req, res) => {
  const screenId = id();
  const totalRows = Number(req.body.total_rows || req.body.totalRows || req.body.rows || 10);
  const seatsPerRow = Number(req.body.seats_per_row || req.body.seatsPerRow || 12);
  await pool.query(
    `INSERT INTO screens (id, theatre_id, vendor_id, screen_name, total_rows, seats_per_row, total_seats, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [screenId, req.body.theatre_id || req.body.theatreId || null, req.user.id, req.body.screen_name || req.body.name || req.body.screenName || "", totalRows, seatsPerRow, totalRows * seatsPerRow, req.body.status || "active"]
  );
  emitVendorUpdated(req.user.id, "screenUpdated", { id: screenId });
  res.status(201).json({ message: "Screen created", screen: { id: screenId, ...req.body } });
};

const getScreens = async (req, res) => {
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT * FROM screens WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  res.json(rows);
};

const createShow = async (req, res) => {
  const showId = id();
  await pool.query(
    `INSERT INTO shows (id, movie_id, theatre_id, screen_id, vendor_id, show_date, show_time, end_time, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [showId, req.body.movie_id || req.body.movieId || null, req.body.theatre_id || req.body.theatreId || null, req.body.screen_id || req.body.screenId || null, req.user.id, req.body.show_date || req.body.showDate || "", req.body.show_time || req.body.showTime || "", req.body.end_time || req.body.endTime || "", req.body.status || "booking_open"]
  );
  emitVendorUpdated(req.user.id, "showUpdated", { id: showId });
  res.status(201).json({ message: "Show created", show: { id: showId, ...req.body } });
};

const getShows = async (req, res) => {
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT * FROM shows WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  res.json(rows);
};

const updateShow = async (req, res) => {
  const filter = vendorFilter(req);
  const [result] = await pool.query(
    `UPDATE shows SET movie_id = ?, theatre_id = ?, screen_id = ?, show_date = ?, show_time = ?, end_time = ?, status = ?
     WHERE id = ? AND ${filter.sql}`,
    [req.body.movie_id || req.body.movieId || null, req.body.theatre_id || req.body.theatreId || null, req.body.screen_id || req.body.screenId || null, req.body.show_date || req.body.showDate || "", req.body.show_time || req.body.showTime || "", req.body.end_time || req.body.endTime || "", req.body.status || "booking_open", req.params.id, ...filter.params]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Show not found" });
  emitVendorUpdated(req.user.id, "showUpdated", { id: req.params.id });
  res.json({ message: "Show updated" });
};

const deleteShow = async (req, res) => {
  const filter = vendorFilter(req);
  const [result] = await pool.query(`DELETE FROM shows WHERE id = ? AND ${filter.sql}`, [req.params.id, ...filter.params]);
  if (!result.affectedRows) return res.status(404).json({ message: "Show not found" });
  emitVendorUpdated(req.user.id, "showUpdated", { id: req.params.id, deleted: true });
  res.json({ success: true });
};

const updateScreen = async (req, res) => {
  const filter = vendorFilter(req);
  const totalRows = Number(req.body.total_rows || req.body.totalRows || req.body.rows || 10);
  const seatsPerRow = Number(req.body.seats_per_row || req.body.seatsPerRow || 12);
  const [result] = await pool.query(
    `UPDATE screens SET theatre_id = ?, screen_name = ?, total_rows = ?, seats_per_row = ?, total_seats = ?, status = ?
     WHERE id = ? AND ${filter.sql}`,
    [req.body.theatre_id || req.body.theatreId || null, req.body.screen_name || req.body.name || req.body.screenName || "", totalRows, seatsPerRow, totalRows * seatsPerRow, req.body.status || "active", req.params.id, ...filter.params]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Screen not found" });
  emitVendorUpdated(req.user.id, "screenUpdated", { id: req.params.id });
  res.json({ message: "Screen updated" });
};

const deleteScreen = async (req, res) => {
  const filter = vendorFilter(req);
  const [result] = await pool.query(`DELETE FROM screens WHERE id = ? AND ${filter.sql}`, [req.params.id, ...filter.params]);
  if (!result.affectedRows) return res.status(404).json({ message: "Screen not found" });
  emitVendorUpdated(req.user.id, "screenUpdated", { id: req.params.id, deleted: true });
  res.json({ success: true });
};

const getShowAnalytics = async (req, res) => {
  const filter = vendorFilter(req, "s.");
  const [rows] = await pool.query(
    `SELECT s.id AS showId, m.title AS movieTitle, t.theatre_name AS theatre, s.show_date AS showDate,
            s.show_time AS showTime, COUNT(se.id) AS totalSeats,
            SUM(se.status = 'booked') AS bookedSeats, SUM(se.status = 'blocked') AS blockedSeats,
            SUM(CASE WHEN se.status = 'booked' THEN se.price ELSE 0 END) AS revenue
     FROM shows s
     LEFT JOIN movies m ON m.id = s.movie_id
     LEFT JOIN theatres t ON t.id = s.theatre_id
     LEFT JOIN seats se ON se.show_id = s.id
     WHERE ${filter.sql}
     GROUP BY s.id, m.title, t.theatre_name, s.show_date, s.show_time
     ORDER BY s.created_at DESC`,
    filter.params
  );
  res.json(rows.map((row) => ({
    ...row,
    availableSeats: Number(row.totalSeats || 0) - Number(row.bookedSeats || 0) - Number(row.blockedSeats || 0),
    occupancyPercentage: row.totalSeats ? Math.round((Number(row.bookedSeats || 0) / Number(row.totalSeats)) * 100) : 0,
    revenuePerShow: Number(row.revenue || 0),
  })));
};

const getPricing = async (req, res) => {
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT * FROM movie_pricing WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  res.json(rows);
};

const savePricing = async (req, res) => {
  const pricingId = req.body.id || id();
  await pool.query(
    `INSERT INTO movie_pricing (id, vendor_id, movie_id, show_id, seat_type, price, day_type, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE movie_id = VALUES(movie_id), show_id = VALUES(show_id), seat_type = VALUES(seat_type),
       price = VALUES(price), day_type = VALUES(day_type), status = VALUES(status)`,
    [pricingId, req.user.id, req.body.movie_id || req.body.movieId || null, req.body.show_id || req.body.showId || null, req.body.seat_type || req.body.seatType || "prime", money(req.body.price), req.body.day_type || req.body.dayType || "all", req.body.status || "active"]
  );
  emitVendorUpdated(req.user.id, "pricingUpdated", { id: pricingId });
  res.json({ message: "Pricing saved", pricing: { id: pricingId, ...req.body } });
};

const updateShowPrice = async (req, res) => {
  req.body.show_id = req.params.showId;
  return savePricing(req, res);
};

const getRefundRequests = async (req, res) => {
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT * FROM refunds WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  res.json(rows);
};

const updateRefundStatus = async (req, res) => {
  const filter = vendorFilter(req);
  const refundStatus = req.body.refundStatus || req.body.refund_status || req.body.status || "pending";
  const [existing] = await pool.query(`SELECT * FROM refunds WHERE id = ? AND ${filter.sql}`, [req.params.id, ...filter.params]);
  if (!existing.length) {
    const [bookings] = await pool.query(`SELECT * FROM bookings WHERE id = ? AND ${filter.sql}`, [req.params.id, ...filter.params]);
    if (!bookings.length) return res.status(404).json({ message: "Refund request not found" });
    await pool.query(
      `INSERT INTO refunds (id, booking_id, user_id, vendor_id, amount, reason, refund_status, vendor_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id(), bookings[0].booking_id || bookings[0].booking_code || bookings[0].id, bookings[0].user_id, bookings[0].vendor_id, bookings[0].total_amount || bookings[0].amount, req.body.reason || "Customer cancellation request", refundStatus, refundStatus]
    );
  } else {
    await pool.query(
      `UPDATE refunds SET refund_status = ?, vendor_status = ?, updated_at = NOW() WHERE id = ? AND ${filter.sql}`,
      [refundStatus, refundStatus, req.params.id, ...filter.params]
    );
  }
  emitVendorUpdated(req.user.id, "refundUpdated", { id: req.params.id, refundStatus });
  res.json({ message: "Refund status updated" });
};

const getPayoutHistory = async (req, res) => {
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT * FROM payouts WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  if (rows.length) return res.json(rows);
  const [summary] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), SUM(amount), 0) AS totalRevenue FROM bookings WHERE ${filter.sql} AND payment_status IN ('success','paid')`,
    filter.params
  );
  const totalRevenue = money(summary[0]?.totalRevenue);
  const platformCommission = Math.round(totalRevenue * 0.12);
  res.json([{ id: "current-cycle", totalRevenue, platformCommission, vendorPayable: totalRevenue - platformCommission, payoutStatus: totalRevenue ? "pending" : "paid" }]);
};

const savePayout = async (req, res) => {
  const payoutId = req.body.id || id();
  const totalRevenue = money(req.body.total_revenue || req.body.totalRevenue);
  const platformCommission = money(req.body.platform_commission || req.body.platformCommission || Math.round(totalRevenue * 0.12));
  await pool.query(
    `INSERT INTO payouts (id, vendor_id, total_revenue, platform_commission, vendor_payable, payout_status, payout_date, transaction_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [payoutId, req.user.id, totalRevenue, platformCommission, money(req.body.vendor_payable || req.body.vendorPayable || totalRevenue - platformCommission), req.body.payout_status || req.body.payoutStatus || "pending", req.body.payout_date || req.body.payoutDate || null, req.body.transaction_id || req.body.transactionId || null]
  );
  emitVendorUpdated(req.user.id, "payoutUpdated", { id: payoutId });
  res.status(201).json({ message: "Payout recorded", payout: { id: payoutId, ...req.body } });
};

const getStaff = async (req, res) => {
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT * FROM vendor_staff WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  res.json(rows.map((row) => ({ ...row, permissions: json(row.permissions, []) })));
};

const createStaff = async (req, res) => {
  const staffId = id();
  await pool.query(
    `INSERT INTO vendor_staff (id, vendor_id, name, email, mobile, role, permissions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [staffId, req.user.id, req.body.name || "", req.body.email || "", req.body.mobile || "", req.body.role || "Ticket Checker", JSON.stringify(req.body.permissions || []), req.body.status || "active"]
  );
  emitVendorUpdated(req.user.id, "staffUpdated", { id: staffId });
  res.status(201).json({ message: "Staff added", staff: { id: staffId, ...req.body } });
};

const updateStaff = async (req, res) => {
  const filter = vendorFilter(req);
  const [result] = await pool.query(
    `UPDATE vendor_staff SET name = COALESCE(?, name), email = COALESCE(?, email), mobile = COALESCE(?, mobile),
       role = COALESCE(?, role), permissions = COALESCE(?, permissions), status = COALESCE(?, status)
     WHERE id = ? AND ${filter.sql}`,
    [req.body.name ?? null, req.body.email ?? null, req.body.mobile ?? null, req.body.role ?? null, req.body.permissions ? JSON.stringify(req.body.permissions) : null, req.body.status ?? null, req.params.id, ...filter.params]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Staff not found" });
  emitVendorUpdated(req.user.id, "staffUpdated", { id: req.params.id });
  res.json({ message: "Staff updated" });
};

const getNotifications = async (req, res) => {
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT * FROM notifications WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  res.json(rows);
};

const createNotification = async (req, res) => {
  const notificationId = id();
  await pool.query(
    `INSERT INTO notifications (id, vendor_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)`,
    [notificationId, req.user.id, req.body.title || "", req.body.message || "", req.body.type || "general", Boolean(req.body.is_read || req.body.isRead)]
  );
  emitVendorUpdated(req.user.id, "vendorNotification", { id: notificationId, ...req.body });
  res.status(201).json({ message: "Notification added", notification: { id: notificationId, ...req.body } });
};

const getCustomerList = async (req, res) => {
  const filter = vendorFilter(req, "b.");
  const [rows] = await pool.query(
    `SELECT b.*, u.name AS user_name, u.email AS user_email, u.mobile AS user_mobile
     FROM bookings b LEFT JOIN users u ON u.id = b.user_id
     WHERE b.module = 'movie' AND ${filter.sql}
     ORDER BY b.created_at DESC`,
    filter.params
  );
  res.json(rows.map((booking) => ({
    _id: booking.id,
    customerName: booking.customer_name || booking.user_name || "Customer",
    mobile: booking.customer_mobile || booking.user_mobile || "-",
    email: booking.customer_email || booking.user_email || "-",
    movieBooked: booking.title,
    seatNumber: json(booking.seat_numbers || booking.seats, []).join(", "),
    bookingDate: booking.created_at,
    paymentStatus: booking.payment_status,
  })));
};

const updateMovieStatus = async (req, res) => {
  const status = String(req.body.status || "").toLowerCase().replace(/\s+/g, "_");
  const filter = vendorFilter(req);
  const [rows] = await pool.query(`SELECT status, vendor_id FROM movies WHERE id = ? AND ${filter.sql}`, [req.params.id, ...filter.params]);
  if (!rows.length) return res.status(404).json({ message: "Movie not found" });
  await pool.query(`UPDATE movies SET status = ? WHERE id = ? AND ${filter.sql}`, [status, req.params.id, ...filter.params]);
  await pool.query(
    `INSERT INTO movie_status_logs (id, movie_id, vendor_id, old_status, new_status, changed_by, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id(), req.params.id, rows[0].vendor_id || req.user.id, rows[0].status, status, req.user.id, req.body.reason || ""]
  );
  emitVendorUpdated(rows[0].vendor_id || req.user.id, "movieStatusUpdated", { movieId: req.params.id, status });
  res.json({ message: "Movie status updated", movie: { id: req.params.id, status } });
};

module.exports = {
  checkInQrTicket,
  createNotification,
  createScreen,
  createShow,
  createStaff,
  createTheatre,
  deleteScreen,
  deleteShow,
  deleteTheatre,
  getCustomerList,
  getNotifications,
  getPayoutHistory,
  getPricing,
  getRefundRequests,
  getScreens,
  getShowAnalytics,
  getShows,
  getStaff,
  getTheatreOverview,
  getTheatres,
  getTicketScanner,
  savePayout,
  savePricing,
  scanTicket,
  updateMovieStatus,
  updateRefundStatus,
  updateScreen,
  updateShow,
  updateShowPrice,
  updateStaff,
  updateTheatre,
  verifyQrTicket,
};
