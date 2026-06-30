const Movie = require("../models/Movie");
const { pool, ready } = require("../config/db");
const { emitSeatUpdated } = require("../socket");

const seatNo = (value) => String(value || "").trim().toUpperCase();

const makeShowId = ({ showId, movieId }) => String(showId || movieId || "").trim();

const mapSeat = (row) => ({
  seatNo: row.seat_no,
  rowName: row.row_name || String(row.seat_no || "").slice(0, 1),
  seatNumber: row.seat_number || String(row.seat_no || "").slice(1),
  seatType: row.seat_type || "prime",
  price: Number(row.price || row.amount || 0),
  showId: row.show_id,
  movieId: row.movie_id,
  theatreId: row.theatre_id,
  screenId: row.screen_id,
  status: row.status,
  bookedBy: row.booked_by,
  bookingId: row.booking_id,
  customerName: row.customer_name || "",
  customerEmail: row.customer_email || "",
  customerMobile: row.customer_mobile || "",
  mobile: row.customer_mobile || "",
  email: row.customer_email || "",
  amount: Number(row.price || row.amount || 0),
  paymentStatus: row.payment_status || "",
  bookingStatus: row.booking_status || "",
  bookingDate: row.booking_date || "",
  blockedBy: row.blocked_by,
  blockedReason: row.blocked_reason || "",
  blockedSeatType: row.blocked_seat_type || "",
  updatedAt: row.updated_at,
});

const rowNameFromIndex = (index) => {
  let value = Number(index);
  let name = "";
  do {
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return name;
};

const buildSeatLayout = (context = {}, movie = null) => {
  const total = Math.max(Number(context.totalSeats || movie?.totalSeats || 0), 1);
  const vipCount = Math.min(Number(context.vipSeats ?? movie?.vipSeats ?? 0), total);
  const primeCount = Math.min(Number(context.primeSeats ?? movie?.primeSeats ?? 0), Math.max(total - vipCount, 0));
  const regularCount = Math.max(total - vipCount - primeCount, 0);
  const blockedByType = {
    vip: Math.min(Number(context.blockedVipSeats ?? movie?.blockedVipSeats ?? 0), vipCount),
    prime: Math.min(Number(context.blockedPrimeSeats ?? movie?.blockedPrimeSeats ?? 0), primeCount),
    regular: Math.min(Number(context.blockedRegularSeats ?? movie?.blockedRegularSeats ?? 0), regularCount),
  };
  const legacyBlockedLimit = Math.min(Number(context.blockedSeats ?? movie?.blockedSeats ?? 0), total);
  const hasTypedBlocks = Object.values(blockedByType).some((value) => value > 0);
  const prices = {
    vip: Number(context.vipSeatPrice || movie?.vipSeatPrice || context.price || movie?.ticketPrice || 0),
    prime: Number(context.premiumSeatPrice || context.primeSeatPrice || movie?.premiumSeatPrice || movie?.primeSeatPrice || context.price || movie?.ticketPrice || 0),
    regular: Number(context.regularSeatPrice || movie?.regularSeatPrice || context.price || movie?.ticketPrice || 0),
  };
  const seatSections = [
    { seatType: "vip", count: vipCount, seatsPerRow: 10 },
    { seatType: "prime", count: primeCount, seatsPerRow: 10 },
    { seatType: "regular", count: regularCount, seatsPerRow: 10 },
  ];
  const seats = [];
  let rowIndex = 0;
  let legacyBlockedCreated = 0;
  const typedBlockedCreated = { vip: 0, prime: 0, regular: 0 };

  for (const section of seatSections) {
    for (let sectionCreated = 0; sectionCreated < section.count && seats.length < total;) {
      const rowName = rowNameFromIndex(rowIndex);
      const seatsInRow = Math.min(section.seatsPerRow, section.count - sectionCreated, total - seats.length);
      for (let seatIndex = 1; seatIndex <= seatsInRow; seatIndex += 1) {
        const seatNumber = String(seatIndex).padStart(2, "0");
        const isTypedBlocked = typedBlockedCreated[section.seatType] < blockedByType[section.seatType];
        const isLegacyBlocked = !hasTypedBlocks && legacyBlockedCreated < legacyBlockedLimit;
        const isBlocked = isTypedBlocked || isLegacyBlocked;
        if (isTypedBlocked) typedBlockedCreated[section.seatType] += 1;
        if (isLegacyBlocked) legacyBlockedCreated += 1;
        seats.push({
          rowName,
          seatNumber,
          seatNo: `${rowName}${seatNumber}`,
          seatType: section.seatType,
          price: prices[section.seatType],
          status: isBlocked ? "blocked" : "available",
          blockedSeatType: isBlocked ? section.seatType : "",
        });
      }
      sectionCreated += seatsInRow;
      rowIndex += 1;
    }
  }

  return seats;
};

const seatLayoutMatches = (existingSeats, desiredSeats) => {
  if (existingSeats.length !== desiredSeats.length) return false;
  const counts = (seats) => seats.reduce((acc, seat) => {
    const type = String(seat.seat_type || seat.seatType || "").toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const existingCounts = counts(existingSeats);
  const desiredCounts = counts(desiredSeats);
  return ["vip", "prime", "regular"].every((type) => existingCounts[type] === desiredCounts[type]);
};

const ensureShowSeats = async (context = {}) => {
  await ready;
  const showId = makeShowId(context);
  if (!showId) throw new Error("showId is required");

  const movie = context.movieId ? await Movie.findById(context.movieId) : null;
  const seats = buildSeatLayout(context, movie);
  const [existingSeats] = await pool.query("SELECT seat_no, seat_type, status FROM seats WHERE show_id = ?", [showId]);

  if (existingSeats.length) {
    const hasBookedSeats = existingSeats.some((seat) => seat.status === "booked");
    const desiredBySeat = new Map(seats.map((seat) => [seat.seatNo, seat.status]));
    const statusMismatch = existingSeats.some((seat) => desiredBySeat.get(seat.seat_no) && desiredBySeat.get(seat.seat_no) !== seat.status);
    if (!hasBookedSeats && (!seatLayoutMatches(existingSeats, seats) || statusMismatch)) {
      await pool.query("DELETE FROM seats WHERE show_id = ?", [showId]);
    }
  }

  const values = seats.map((seat) => [
    seat.rowName,
    seat.seatNumber,
    seat.seatNo,
    showId,
    context.movieId || null,
    context.theatreId || context.theatre || null,
    context.screenId || "Screen 1",
    seat.seatType,
    seat.price,
    seat.status,
    seat.blockedSeatType || null,
  ]);

  await pool.query(
    `INSERT IGNORE INTO seats (
      row_name, seat_number, seat_no, show_id, movie_id, theatre_id, screen_id, seat_type, price, status, blocked_seat_type
    ) VALUES ?`,
    [values]
  );

  return { showId, movie };
};

const getShowSeats = async (context = {}) => {
  const { showId } = await ensureShowSeats(context);
  const [rows] = await pool.query(
    "SELECT * FROM seats WHERE show_id = ? ORDER BY row_name, CAST(seat_number AS UNSIGNED), seat_no",
    [showId]
  );
  return rows.map(mapSeat);
};

const validateMovieSeatsAvailable = async (context, seats) => {
  const { showId } = await ensureShowSeats(context);
  const requestedSeats = seats.map(seatNo).filter(Boolean);
  if (!requestedSeats.length) throw new Error("At least one seat is required");

  const [rows] = await pool.query("SELECT seat_no, status FROM seats WHERE show_id = ? AND seat_no IN (?)", [showId, requestedSeats]);
  const statusBySeat = new Map(rows.map((row) => [row.seat_no, row.status]));
  const unavailable = requestedSeats.filter((number) => statusBySeat.get(number) && statusBySeat.get(number) !== "available");

  if (unavailable.length) {
    const error = new Error(`Seats unavailable: ${unavailable.join(", ")}`);
    error.statusCode = 409;
    throw error;
  }
};

const markMovieSeatsBooked = async (context, seats, booking, customer) => {
  const { showId } = await ensureShowSeats(context);
  const requestedSeats = seats.map(seatNo).filter(Boolean);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT seat_no, status FROM seats WHERE show_id = ? AND seat_no IN (?) FOR UPDATE",
      [showId, requestedSeats]
    );
    const statusBySeat = new Map(rows.map((row) => [row.seat_no, row.status]));
    const unavailable = requestedSeats.filter((number) => statusBySeat.get(number) && statusBySeat.get(number) !== "available");

    if (unavailable.length) {
      const error = new Error(`Seats unavailable: ${unavailable.join(", ")}`);
      error.statusCode = 409;
      throw error;
    }

    await connection.query(
      `UPDATE seats
       SET status = 'booked',
           booked_by = ?,
           booking_id = ?,
           blocked_by = NULL,
           blocked_reason = NULL,
           blocked_seat_type = NULL
       WHERE show_id = ? AND seat_no IN (?)`,
      [
        booking.user,
        booking.bookingId || booking.bookingCode || booking._id,
        showId,
        requestedSeats,
      ]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [updatedRows] = await pool.query("SELECT * FROM seats WHERE show_id = ? AND seat_no IN (?)", [showId, requestedSeats]);
  updatedRows.map(mapSeat).forEach(emitSeatUpdated);
  return updatedRows.map(mapSeat);
};

const setMovieSeatBlocked = async (context, seatNumber, user, reason = "", blockedSeatType = "") => {
  const { showId } = await ensureShowSeats(context);
  const normalizedSeat = seatNo(seatNumber);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT * FROM seats WHERE show_id = ? AND seat_no = ? FOR UPDATE",
      [showId, normalizedSeat]
    );
    const current = rows[0];
    if (!current) {
      const error = new Error("Seat not found");
      error.statusCode = 404;
      throw error;
    }
    if (current.status === "booked") {
      const error = new Error("Booked seat cannot be blocked");
      error.statusCode = 409;
      throw error;
    }

    await connection.query(
      `UPDATE seats
       SET status = 'blocked', blocked_by = ?, blocked_reason = ?, blocked_seat_type = ?, booking_id = NULL
       WHERE show_id = ? AND seat_no = ?`,
      [user.id, reason || "Blocked by vendor", blockedSeatType || current.seat_type || "regular", showId, normalizedSeat]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [rows] = await pool.query("SELECT * FROM seats WHERE show_id = ? AND seat_no = ?", [showId, normalizedSeat]);
  const seat = mapSeat(rows[0]);
  emitSeatUpdated(seat);
  return seat;
};

const setMovieSeatAvailable = async (context, seatNumber) => {
  const { showId } = await ensureShowSeats(context);
  const normalizedSeat = seatNo(seatNumber);
  const [rows] = await pool.query("SELECT * FROM seats WHERE show_id = ? AND seat_no = ?", [showId, normalizedSeat]);
  const current = rows[0];

  if (!current) {
    const error = new Error("Seat not found");
    error.statusCode = 404;
    throw error;
  }
  if (current.status === "booked") {
    const error = new Error("Booked seat cannot be unblocked");
    error.statusCode = 409;
    throw error;
  }

  await pool.query(
    `UPDATE seats
     SET status = 'available',
         blocked_by = NULL,
         blocked_reason = NULL,
         blocked_seat_type = NULL
     WHERE show_id = ? AND seat_no = ?`,
    [showId, normalizedSeat]
  );

  const [updatedRows] = await pool.query("SELECT * FROM seats WHERE show_id = ? AND seat_no = ?", [showId, normalizedSeat]);
  const seat = mapSeat(updatedRows[0]);
  emitSeatUpdated(seat);
  return seat;
};

module.exports = {
  getShowSeats,
  makeShowId,
  markMovieSeatsBooked,
  setMovieSeatAvailable,
  setMovieSeatBlocked,
  validateMovieSeatsAvailable,
};
