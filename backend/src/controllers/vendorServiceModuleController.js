const crypto = require("crypto");
const { pool, ready } = require("../config/db");

const createId = () => `${Date.now().toString(16)}${crypto.randomBytes(6).toString("hex")}`.slice(0, 24);
const dateTime = (value) => value ? String(value).replace("T", " ").replace("Z", "").slice(0, 19) : null;
const statusValue = (value) => ["active", "inactive", "hidden"].includes(String(value)) ? String(value) : "active";
const numberValue = (value) => Math.max(Number(value || 0), 0);
const camel = (value) => value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const modules = {
  buses: {
    module: "bus", table: "vendor_buses", name: "busName",
    columns: [
      ["busName", "bus_name"], ["busNumber", "bus_number"], ["operatorName", "operator_name"], ["fromCity", "from_city"], ["toCity", "to_city"],
      ["departureDateTime", "departure_date_time", "datetime"], ["arrivalDateTime", "arrival_date_time", "datetime"], ["busType", "bus_type"],
      ["totalSeats", "total_seats", "number"], ["seatPrice", "seat_price", "number"], ["availableSeats", "available_seats", "number"], ["bookedSeats", "booked_seats", "number"],
    ],
  },
  trains: {
    module: "train", table: "vendor_trains", name: "trainName",
    columns: [
      ["trainName", "train_name"], ["trainNumber", "train_number"], ["fromStation", "from_station"], ["toStation", "to_station"],
      ["departureDateTime", "departure_date_time", "datetime"], ["arrivalDateTime", "arrival_date_time", "datetime"], ["coachType", "coach_type"],
      ["totalSeats", "total_seats", "number"], ["seatPrice", "seat_price", "number"], ["availableSeats", "available_seats", "number"], ["bookedSeats", "booked_seats", "number"],
    ],
  },
  events: {
    module: "event", table: "vendor_events", name: "eventName",
    columns: [
      ["eventName", "event_name"], ["eventType", "event_type"], ["organizerName", "organizer_name"], ["venue", "venue"], ["city", "city"],
      ["eventDateTime", "event_date_time", "datetime"], ["ticketType", "ticket_type"], ["ticketPrice", "ticket_price", "number"],
      ["totalTickets", "total_tickets", "number"], ["availableTickets", "available_tickets", "number"], ["bookedTickets", "booked_tickets", "number"], ["posterImage", "poster_image", "optional"],
    ],
  },
  hotels: {
    module: "hotel", table: "vendor_hotels", name: "hotelName",
    columns: [
      ["hotelName", "hotel_name"], ["city", "city"], ["address", "address"], ["roomType", "room_type"],
      ["totalRooms", "total_rooms", "number"], ["availableRooms", "available_rooms", "number"], ["bookedRooms", "booked_rooms", "number"], ["pricePerNight", "price_per_night", "number"],
      ["checkInTime", "check_in_time"], ["checkOutTime", "check_out_time"], ["amenities", "amenities", "optional"], ["hotelImage", "hotel_image", "optional"],
    ],
  },
};

const vendorWhere = (req, alias = "") => req.user.role === "admin" ? { sql: "1=1", params: [] } : { sql: `${alias}vendor_id = ?`, params: [req.user.id] };

const serialize = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key === "id" ? "id" : camel(key), value]));

const payloadFor = (config, body) => {
  const missing = config.columns.filter(([key, , type]) => type !== "optional" && (body[key] === undefined || String(body[key] ?? "").trim() === ""));
  if (missing.length) return { error: `${missing[0][0]} is required.` };
  const values = config.columns.map(([key, , type]) => type === "number" ? numberValue(body[key]) : type === "datetime" ? dateTime(body[key]) : String(body[key] ?? "").trim());
  return { values };
};

const attachAggregates = async (req, config, rows) => {
  if (!rows.length) return [];
  const filter = vendorWhere(req, "b.");
  const [bookingRows] = await pool.query(
    `SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(b.details, '$.listingId')), JSON_UNQUOTE(JSON_EXTRACT(b.details, '$.${config.module}Id'))) AS listing_id,
            COUNT(*) AS total_bookings, COALESCE(SUM(COALESCE(b.total_amount, b.amount)), 0) AS revenue
     FROM bookings b WHERE b.module IN (?, ?) AND ${filter.sql} GROUP BY listing_id`,
    [config.module, `${config.module}s`, ...filter.params]
  );
  const aggregates = new Map(bookingRows.map((row) => [String(row.listing_id), row]));
  return rows.map((row) => ({ ...serialize(row), totalBookings: Number(aggregates.get(String(row.id))?.total_bookings || 0), revenue: Number(aggregates.get(String(row.id))?.revenue || 0) }));
};

const list = (service) => async (req, res) => {
  await ready;
  const config = modules[service];
  const filter = vendorWhere(req);
  const [rows] = await pool.query(`SELECT * FROM ${config.table} WHERE ${filter.sql} ORDER BY created_at DESC`, filter.params);
  res.json(await attachAggregates(req, config, rows));
};

const getOne = (service) => async (req, res) => {
  await ready;
  const config = modules[service];
  const filter = vendorWhere(req);
  const [rows] = await pool.query(`SELECT * FROM ${config.table} WHERE id = ? AND ${filter.sql} LIMIT 1`, [req.params.id, ...filter.params]);
  if (!rows.length) return res.status(404).json({ message: `${config.module} not found.` });
  const [record] = await attachAggregates(req, config, rows);
  res.json(record);
};

const create = (service) => async (req, res) => {
  await ready;
  const config = modules[service];
  const payload = payloadFor(config, req.body);
  if (payload.error) return res.status(400).json({ message: payload.error });
  const id = createId();
  const columns = config.columns.map(([, column]) => column);
  await pool.query(`INSERT INTO ${config.table} (id, vendor_id, ${columns.join(", ")}, status) VALUES (?, ?, ${columns.map(() => "?").join(", ")}, ?)`, [id, req.user.id, ...payload.values, statusValue(req.body.status)]);
  const [rows] = await pool.query(`SELECT * FROM ${config.table} WHERE id = ?`, [id]);
  res.status(201).json(serialize(rows[0]));
};

const update = (service) => async (req, res) => {
  await ready;
  const config = modules[service];
  const payload = payloadFor(config, req.body);
  if (payload.error) return res.status(400).json({ message: payload.error });
  const filter = vendorWhere(req);
  const columns = config.columns.map(([, column]) => column);
  const [result] = await pool.query(`UPDATE ${config.table} SET ${columns.map((column) => `${column} = ?`).join(", ")}, status = ? WHERE id = ? AND ${filter.sql}`, [...payload.values, statusValue(req.body.status), req.params.id, ...filter.params]);
  if (!result.affectedRows) return res.status(404).json({ message: `${config.module} not found.` });
  const [rows] = await pool.query(`SELECT * FROM ${config.table} WHERE id = ?`, [req.params.id]);
  res.json(serialize(rows[0]));
};

const remove = (service) => async (req, res) => {
  await ready;
  const config = modules[service];
  const filter = vendorWhere(req);
  const [result] = await pool.query(`DELETE FROM ${config.table} WHERE id = ? AND ${filter.sql}`, [req.params.id, ...filter.params]);
  if (!result.affectedRows) return res.status(404).json({ message: `${config.module} not found.` });
  res.json({ message: `${config.module} deleted successfully.` });
};

const bookings = (service) => async (req, res) => {
  await ready;
  const config = modules[service];
  const filter = vendorWhere(req);
  const [rows] = await pool.query(
    `SELECT id, booking_code, title, customer_name, seats, amount, total_amount, status, booking_status, details, created_at
     FROM bookings WHERE module IN (?, ?) AND ${filter.sql} ORDER BY created_at DESC`,
    [config.module, `${config.module}s`, ...filter.params]
  );
  res.json(rows.map((row) => ({ ...serialize(row), seats: typeof row.seats === "string" ? JSON.parse(row.seats || "[]") : row.seats, details: typeof row.details === "string" ? JSON.parse(row.details || "{}") : row.details })));
};

module.exports = { modules, list, getOne, create, update, remove, bookings };
