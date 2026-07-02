const crypto = require("crypto");
const { pool, ready } = require("../config/db");

const id = () => `${Date.now().toString(16)}${crypto.randomBytes(6).toString("hex")}`.slice(0, 24);
const bookingCode = () => `HTL${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
const qrToken = () => `HOTEL-${crypto.randomBytes(18).toString("hex").toUpperCase()}`;
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const text = (value) => String(value ?? "").trim();
const json = (value, fallback = []) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try { return JSON.parse(value || ""); } catch { return fallback; }
};
const sqlDate = (value) => {
  const raw = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw ? null : raw;
};
const datesBetween = (start, end) => {
  const first = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  const dates = [];
  for (let cursor = first; cursor < last && dates.length < 370; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
};
const vendorFilter = (req, alias = "") => req.user.role === "admin"
  ? { sql: "1=1", params: [] }
  : { sql: `${alias}vendor_id = ?`, params: [req.user.id] };
const status = (value) => ["draft", "active", "inactive", "hidden"].includes(value) ? value : "active";
const serializeHotel = (row) => ({
  ...row,
  amenities: json(row.amenities),
  images: json(row.images),
  policies: json(row.policies),
  onboardingData: json(row.onboarding_data, {}),
  minPrice: n(row.min_price ?? row.minPrice),
  totalRooms: n(row.total_rooms ?? row.totalRooms),
  availableRooms: n(row.available_rooms ?? row.availableRooms),
  starRating: n(row.star_rating),
  reviewRating: n(row.review_rating),
  reviewCount: n(row.review_count),
});
const serializeRoom = (row) => ({
  ...row,
  amenities: json(row.amenities),
  images: json(row.images),
  basePrice: n(row.base_price),
  effectivePrice: n(row.effective_price ?? row.base_price),
  stayPrice: n(row.stay_price ?? row.effective_price ?? row.base_price),
  totalRooms: n(row.total_rooms),
  availableRooms: n(row.available_rooms ?? row.total_rooms),
  maxAdults: n(row.max_adults),
  maxChildren: n(row.max_children),
  taxPercent: n(row.tax_percent),
  weekdayPrice: n(row.weekday_price ?? row.base_price),
  weekendPrice: n(row.weekend_price ?? row.base_price),
  seasonalPrice: n(row.seasonal_price ?? row.base_price),
  extraAdultCharge: n(row.extra_adult_charge),
  extraChildCharge: n(row.extra_child_charge),
  discountPercent: n(row.discount_percent),
  offerPrice: n(row.offer_price ?? row.base_price),
});

const imageAggregate = `(SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', hi.id, 'url', hi.image_url, 'alt', hi.alt_text, 'isPrimary', hi.is_primary)), JSON_ARRAY()) FROM hotel_images hi WHERE hi.hotel_id = h.id)`;
const roomImageAggregate = `(SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', ri.id, 'url', ri.image_url, 'alt', ri.alt_text, 'isPrimary', ri.is_primary)), JSON_ARRAY()) FROM hotel_room_images ri WHERE ri.room_id = r.id)`;

async function publicHotels(req, res) {
  await ready;
  const city = text(req.query.city || req.query.search);
  const hotelType = text(req.query.hotelType);
  const minPrice = n(req.query.minPrice, 0);
  const maxPrice = n(req.query.maxPrice, 10000000);
  const rating = n(req.query.rating, 0);
  const guests = Math.max(1, n(req.query.guests, 1));
  const rooms = Math.max(1, n(req.query.rooms, 1));
  const checkIn = sqlDate(req.query.checkIn);
  const checkOut = sqlDate(req.query.checkOut);
  const params = [];
  const where = ["h.status = 'active'"];
  if (city) { where.push("(h.city LIKE ? OR h.name LIKE ? OR h.address LIKE ?)"); params.push(`%${city}%`, `%${city}%`, `%${city}%`); }
  if (hotelType) { where.push("h.hotel_type = ?"); params.push(hotelType); }
  if (rating) { where.push("h.review_rating >= ?"); params.push(rating); }
  const [rows] = await pool.query(`
    SELECT h.*,
      ${imageAggregate} AS images,
      MIN(r.base_price) AS min_price,
      COALESCE(SUM(r.total_rooms), 0) AS total_rooms
    FROM hotels h
    JOIN hotel_rooms r ON r.hotel_id = h.id AND r.status = 'active' AND r.max_adults + r.max_children >= ?
    WHERE ${where.join(" AND ")}
    GROUP BY h.id
    HAVING min_price BETWEEN ? AND ? AND total_rooms >= ?
  `, [guests, ...params, minPrice, maxPrice, rooms]);
  let result = rows.map(serializeHotel);
  const requestedAmenities = String(req.query.amenities || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (requestedAmenities.length) result = result.filter((hotel) => requestedAmenities.every((a) => hotel.amenities.map((x) => String(x).toLowerCase()).includes(a)));
  if (checkIn && checkOut && checkOut > checkIn) {
    const checked = await Promise.all(result.map(async (hotel) => {
      const [availability] = await pool.query(`
        SELECT r.id, COALESCE(MIN(i.available_rooms), r.total_rooms) AS available_rooms
        FROM hotel_rooms r LEFT JOIN hotel_inventory_calendar i ON i.room_id = r.id AND i.inventory_date >= ? AND i.inventory_date < ?
        WHERE r.hotel_id = ? AND r.status = 'active' GROUP BY r.id
        HAVING available_rooms >= ?`, [checkIn, checkOut, hotel.id, rooms]);
      return availability.length ? { ...hotel, availableRooms: availability.reduce((sum, row) => sum + n(row.available_rooms), 0) } : null;
    }));
    result = checked.filter(Boolean);
  }
  const sort = text(req.query.sort);
  result.sort((a, b) => sort === "price_desc" ? b.minPrice - a.minPrice : sort === "rating" ? b.reviewRating - a.reviewRating : sort === "popularity" ? b.reviewCount - a.reviewCount : a.minPrice - b.minPrice);
  res.json(result);
}

async function getHotel(req, res) {
  await ready;
  const [rows] = await pool.query(`SELECT h.*, ${imageAggregate} AS images,
    (SELECT MIN(base_price) FROM hotel_rooms WHERE hotel_id=h.id AND status='active') AS min_price,
    (SELECT COALESCE(SUM(total_rooms),0) FROM hotel_rooms WHERE hotel_id=h.id AND status='active') AS total_rooms
    FROM hotels h WHERE h.id = ? AND h.status <> 'hidden'`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Hotel not found." });
  const [policies] = await pool.query("SELECT id, policy_type AS type, title, description FROM hotel_policies WHERE hotel_id=? ORDER BY sort_order", [req.params.id]);
  const [reviews] = await pool.query(`SELECT hr.*, u.name AS user_name,
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', rr.id, 'reply', rr.reply, 'createdAt', rr.created_at)), JSON_ARRAY()) FROM hotel_review_replies rr WHERE rr.review_id=hr.id) replies
    FROM hotel_reviews hr LEFT JOIN users u ON u.id=hr.user_id WHERE hr.hotel_id=? AND hr.status='published' ORDER BY hr.created_at DESC`, [req.params.id]);
  res.json({ ...serializeHotel(rows[0]), policies, reviews: reviews.map((r) => ({ ...r, replies: json(r.replies) })) });
}

async function publicRooms(req, res) {
  await ready;
  const checkIn = sqlDate(req.query.checkIn);
  const checkOut = sqlDate(req.query.checkOut);
  const params = checkIn && checkOut ? [checkIn, checkOut] : ["1900-01-01", "1900-01-02"];
  const [rows] = await pool.query(`SELECT r.*, ${roomImageAggregate} AS images,
    COALESCE(MIN(i.available_rooms), r.total_rooms) AS available_rooms,
    COALESCE(MAX(i.price), r.base_price) AS effective_price,
    (r.base_price * GREATEST(DATEDIFF(?, ?), 1)) + COALESCE(SUM(i.price - r.base_price), 0) AS stay_price
    FROM hotel_rooms r LEFT JOIN hotel_inventory_calendar i ON i.room_id=r.id AND i.inventory_date >= ? AND i.inventory_date < ?
    WHERE r.hotel_id=? AND r.status='active' GROUP BY r.id ORDER BY effective_price`, [checkOut || "1900-01-02", checkIn || "1900-01-01", ...params, req.params.id]);
  res.json(rows.map(serializeRoom));
}

async function quoteBooking(req, res) {
  await ready;
  const checkIn = sqlDate(req.body.checkIn || req.body.checkInDate);
  const checkOut = sqlDate(req.body.checkOut || req.body.checkOutDate);
  const stayDates = checkIn && checkOut ? datesBetween(checkIn, checkOut) : [];
  const roomCount = Math.max(1, Math.floor(n(req.body.rooms || req.body.roomCount, 1)));
  if (!req.body.hotelId || !req.body.roomId || !stayDates.length) return res.status(400).json({ message: "Hotel, room, and valid stay dates are required." });
  const [rooms] = await pool.query("SELECT r.*,h.vendor_id FROM hotel_rooms r JOIN hotels h ON h.id=r.hotel_id WHERE r.id=? AND r.hotel_id=? AND r.status='active' AND h.status='active'", [req.body.roomId, req.body.hotelId]);
  if (!rooms.length) return res.status(404).json({ message: "Room is no longer available." });
  const room = rooms[0];
  const [inventory] = await pool.query("SELECT * FROM hotel_inventory_calendar WHERE room_id=? AND inventory_date>=? AND inventory_date<?", [room.id, checkIn, checkOut]);
  if (inventory.some((day) => n(day.available_rooms) < roomCount || day.status === "blocked")) return res.status(409).json({ message: "Selected rooms are unavailable for one or more dates." });
  const inventoryByDate = new Map(inventory.map((day) => [String(day.inventory_date).slice(0, 10), day]));
  const subtotal = stayDates.reduce((sum, date) => sum + n(inventoryByDate.get(date)?.price, n(room.base_price)) * roomCount, 0);
  let discount = 0;
  const code = text(req.body.couponCode).toUpperCase();
  if (code) {
    const [coupons] = await pool.query("SELECT * FROM hotel_coupons WHERE code=? AND vendor_id=? AND status='active' AND valid_from<=CURDATE() AND valid_until>=CURDATE() AND (hotel_id IS NULL OR hotel_id=?)", [code, room.vendor_id, room.hotel_id]);
    const coupon = coupons[0];
    if (!coupon || subtotal < n(coupon.min_booking_amount) || (coupon.usage_limit && n(coupon.used_count) >= n(coupon.usage_limit))) return res.status(400).json({ message: "Coupon is invalid or not applicable." });
    discount = coupon.discount_type === "fixed" ? n(coupon.discount_value) : subtotal * n(coupon.discount_value) / 100;
    if (coupon.max_discount != null) discount = Math.min(discount, n(coupon.max_discount));
  }
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = taxable * n(room.tax_percent) / 100;
  res.json({ subtotal, discountAmount: discount, taxAmount, totalAmount: taxable + taxAmount, couponCode: code });
}

async function createBooking(req, res) {
  await ready;
  const checkIn = sqlDate(req.body.checkIn || req.body.checkInDate);
  const checkOut = sqlDate(req.body.checkOut || req.body.checkOutDate);
  const stayDates = checkIn && checkOut ? datesBetween(checkIn, checkOut) : [];
  const roomCount = Math.max(1, Math.floor(n(req.body.rooms || req.body.roomCount, 1)));
  if (!req.body.hotelId || !req.body.roomId || !stayDates.length) return res.status(400).json({ message: "Hotel, room, and valid stay dates are required." });
  if (text(req.body.paymentStatus) !== "success") return res.status(400).json({ message: "A verified payment is required before booking." });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [roomRows] = await connection.query("SELECT r.*, h.vendor_id, h.name hotel_name FROM hotel_rooms r JOIN hotels h ON h.id=r.hotel_id WHERE r.id=? AND r.hotel_id=? AND r.status='active' AND h.status='active' FOR UPDATE", [req.body.roomId, req.body.hotelId]);
    if (!roomRows.length) throw Object.assign(new Error("Room is no longer available."), { status: 404 });
    const room = roomRows[0];
    for (const date of stayDates) {
      await connection.query(`INSERT INTO hotel_inventory_calendar (id,hotel_id,room_id,inventory_date,total_rooms,available_rooms,price,status)
        VALUES (?,?,?,?,?,?,?,'available') ON DUPLICATE KEY UPDATE room_id=VALUES(room_id)`, [id(), room.hotel_id, room.id, date, room.total_rooms, room.total_rooms, room.base_price]);
    }
    const [inventory] = await connection.query(`SELECT * FROM hotel_inventory_calendar WHERE room_id=? AND inventory_date>=? AND inventory_date<? ORDER BY inventory_date FOR UPDATE`, [room.id, checkIn, checkOut]);
    if (inventory.length !== stayDates.length || inventory.some((day) => n(day.available_rooms) < roomCount || day.status === "blocked")) throw Object.assign(new Error("Selected rooms are unavailable for one or more dates."), { status: 409 });
    const subtotal = inventory.reduce((sum, day) => sum + n(day.price, n(room.base_price)) * roomCount, 0);
    let discount = 0;
    let coupon = null;
    const code = text(req.body.couponCode).toUpperCase();
    if (code) {
      const [coupons] = await connection.query(`SELECT * FROM hotel_coupons WHERE code=? AND vendor_id=? AND status='active' AND valid_from<=CURDATE() AND valid_until>=CURDATE() AND (hotel_id IS NULL OR hotel_id=?) FOR UPDATE`, [code, room.vendor_id, room.hotel_id]);
      coupon = coupons[0];
      if (!coupon || subtotal < n(coupon.min_booking_amount) || (coupon.usage_limit && n(coupon.used_count) >= n(coupon.usage_limit))) throw Object.assign(new Error("Coupon is invalid or not applicable."), { status: 400 });
      discount = coupon.discount_type === "fixed" ? n(coupon.discount_value) : subtotal * n(coupon.discount_value) / 100;
      if (coupon.max_discount != null) discount = Math.min(discount, n(coupon.max_discount));
    }
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * n(room.tax_percent) / 100;
    const total = taxable + tax;
    const bookingId = id();
    const codeValue = bookingCode();
    const token = qrToken();
    const guest = req.body.primaryGuest || req.body.guest || {};
    await connection.query(`INSERT INTO hotel_bookings
      (id,booking_code,qr_token,user_id,vendor_id,hotel_id,room_id,check_in_date,check_out_date,room_count,adult_count,child_count,guest_name,guest_email,guest_phone,special_requests,subtotal,tax_amount,discount_amount,total_amount,coupon_code,payment_id,payment_status,booking_status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'success','confirmed')`, [bookingId, codeValue, token, req.user.id, room.vendor_id, room.hotel_id, room.id, checkIn, checkOut, roomCount, Math.max(1,n(req.body.adults,1)), n(req.body.children), text(guest.name || req.user.name), text(guest.email || req.user.email), text(guest.phone || req.user.mobile), text(req.body.specialRequests), subtotal, tax, discount, total, code || null, text(req.body.paymentId)]);
    const guests = Array.isArray(req.body.guests) && req.body.guests.length ? req.body.guests : [guest];
    for (let index = 0; index < guests.length; index += 1) {
      const item = guests[index];
      await connection.query("INSERT INTO hotel_booking_guests (id,booking_id,full_name,age,gender,guest_type,is_primary) VALUES (?,?,?,?,?,?,?)", [id(), bookingId, text(item.name || item.fullName || guest.name), item.age ? n(item.age) : null, text(item.gender) || null, item.guestType === "child" ? "child" : "adult", index === 0]);
    }
    await connection.query(`UPDATE hotel_inventory_calendar SET available_rooms=available_rooms-?, booked_rooms=booked_rooms+?, status=IF(available_rooms-?<=0,'sold_out',status) WHERE room_id=? AND inventory_date>=? AND inventory_date<?`, [roomCount, roomCount, roomCount, room.id, checkIn, checkOut]);
    if (coupon) await connection.query("UPDATE hotel_coupons SET used_count=used_count+1 WHERE id=?", [coupon.id]);
    await connection.commit();
    res.status(201).json({ message: "Hotel booking confirmed.", booking: { id: bookingId, bookingCode: codeValue, qrToken: token, hotelName: room.hotel_name, totalAmount: total, bookingStatus: "confirmed", paymentStatus: "success" } });
  } catch (error) {
    await connection.rollback();
    res.status(error.status || 500).json({ message: error.message || "Unable to complete hotel booking." });
  } finally { connection.release(); }
}

const bookingSelect = `SELECT b.*, h.name hotel_name,h.city,h.address,h.check_in_time,h.check_out_time,r.name room_name,r.room_type,
  (SELECT image_url FROM hotel_images WHERE hotel_id=h.id ORDER BY is_primary DESC,sort_order LIMIT 1) hotel_image,
  (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id',g.id,'name',g.full_name,'age',g.age,'gender',g.gender,'guestType',g.guest_type,'isPrimary',g.is_primary)),JSON_ARRAY()) FROM hotel_booking_guests g WHERE g.booking_id=b.id) guests
  FROM hotel_bookings b JOIN hotels h ON h.id=b.hotel_id JOIN hotel_rooms r ON r.id=b.room_id`;
const serializeBooking = (row) => ({ ...row, guests: json(row.guests), totalAmount: n(row.total_amount), taxAmount: n(row.tax_amount), subtotal: n(row.subtotal), discountAmount: n(row.discount_amount), bookingCode: row.booking_code, qrToken: row.qr_token, bookingStatus: row.booking_status, paymentStatus: row.payment_status });

async function userBookings(req, res) { await ready; const [rows] = await pool.query(`${bookingSelect} WHERE b.user_id=? ORDER BY b.created_at DESC`, [req.user.id]); res.json(rows.map(serializeBooking)); }
async function userBooking(req, res) { await ready; const [rows] = await pool.query(`${bookingSelect} WHERE b.id=? AND b.user_id=?`, [req.params.id, req.user.id]); if (!rows.length) return res.status(404).json({ message: "Booking not found." }); res.json(serializeBooking(rows[0])); }
async function cancelRequest(req, res) {
  await ready;
  const [result] = await pool.query("UPDATE hotel_bookings SET booking_status='cancel_requested',cancellation_reason=? WHERE id=? AND user_id=? AND booking_status IN ('pending','confirmed') AND check_in_date>CURDATE()", [text(req.body.reason), req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(409).json({ message: "This booking cannot be cancelled." });
  res.json({ message: "Cancellation request submitted." });
}

async function vendorHotels(req, res) {
  await ready; const filter = vendorFilter(req, "h.");
  const [rows] = await pool.query(`SELECT h.*,${imageAggregate} images,(SELECT MIN(base_price) FROM hotel_rooms WHERE hotel_id=h.id AND status<>'hidden') min_price,(SELECT COALESCE(SUM(total_rooms),0) FROM hotel_rooms WHERE hotel_id=h.id AND status<>'hidden') total_rooms FROM hotels h WHERE ${filter.sql} ORDER BY h.created_at DESC`, filter.params);
  res.json(rows.map(serializeHotel));
}

const hotelPayload = (body) => ({
  name: text(body.name || body.hotelName),
  slug: text(body.name || body.hotelName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  description: text(body.description),
  hotelType: text(body.hotelType || body.propertyType) || "Hotel",
  starRating: Math.min(5, Math.max(0, n(body.starRating))),
  address: text(body.address || body.fullAddress),
  city: text(body.city),
  state: text(body.state),
  country: text(body.country) || "India",
  postalCode: text(body.postalCode || body.pincode),
  latitude: body.latitude || null,
  longitude: body.longitude || null,
  phone: text(body.phone || body.mobileNumber),
  email: text(body.email),
  checkInTime: text(body.checkInTime) || "14:00",
  checkOutTime: text(body.checkOutTime) || "11:00",
  amenities: Array.isArray(body.amenities) ? body.amenities : String(body.amenities || "").split(",").map((item) => item.trim()).filter(Boolean),
  status: status(body.status),
  images: Array.isArray(body.images) ? body.images : [],
  policies: Array.isArray(body.policies) ? body.policies : [],
  rooms: Array.isArray(body.rooms) ? body.rooms : null,
  onboardingData: body.onboardingData && typeof body.onboardingData === "object" ? body.onboardingData : null,
});
async function replaceHotelChildren(connection, hotelId, payload) {
  await connection.query("DELETE FROM hotel_images WHERE hotel_id=?", [hotelId]);
  for (let index=0; index<payload.images.length; index+=1) { const image = payload.images[index]; const url = typeof image === "string" ? image : image.url || image.data; if (url) await connection.query("INSERT INTO hotel_images (id,hotel_id,image_url,alt_text,is_primary,sort_order) VALUES (?,?,?,?,?,?)", [id(),hotelId,url,text(image.alt),Boolean(image.isPrimary || index===0),index]); }
  await connection.query("DELETE FROM hotel_policies WHERE hotel_id=?", [hotelId]);
  for (let index=0; index<payload.policies.length; index+=1) { const policy=payload.policies[index]; if (text(policy.description)) await connection.query("INSERT INTO hotel_policies (id,hotel_id,policy_type,title,description,sort_order) VALUES (?,?,?,?,?,?)", [id(),hotelId,text(policy.type)||"general",text(policy.title)||"Policy",text(policy.description),index]); }
}
async function replaceHotelRooms(connection, hotelId, vendorId, rooms) {
  if (!Array.isArray(rooms)) return;
  await connection.query("DELETE ri FROM hotel_room_images ri JOIN hotel_rooms r ON r.id=ri.room_id WHERE r.hotel_id=?", [hotelId]);
  await connection.query("DELETE FROM hotel_rooms WHERE hotel_id=?", [hotelId]);
  for (const source of rooms) {
    const room = roomPayload(source);
    if (!room.name || !room.roomType) continue;
    const roomId = id();
    await connection.query(`INSERT INTO hotel_rooms
      (id,hotel_id,vendor_id,name,room_type,description,max_adults,max_children,bed_type,room_size,total_rooms,base_price,
       weekday_price,weekend_price,seasonal_price,extra_adult_charge,extra_child_charge,tax_percent,discount_percent,offer_price,
       amenities,refundable,meal_plan,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      roomId, hotelId, vendorId, room.name, room.roomType, room.description, room.maxAdults, room.maxChildren,
      room.bedType, room.roomSize, room.totalRooms, room.basePrice, room.weekdayPrice, room.weekendPrice,
      room.seasonalPrice, room.extraAdultCharge, room.extraChildCharge, room.taxPercent, room.discountPercent,
      room.offerPrice, JSON.stringify(room.amenities), room.refundable, room.mealPlan, room.status,
    ]);
    await replaceRoomImages(connection, roomId, room.images);
  }
}

async function createHotel(req, res) {
  await ready;
  const payload = hotelPayload(req.body);
  if (!payload.name || (payload.status !== "draft" && (!payload.city || !payload.address))) {
    return res.status(400).json({ message: payload.status === "draft" ? "Hotel name is required." : "Hotel name, city, and address are required." });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const hotelId = id();
    await connection.query(`INSERT INTO hotels
      (id,vendor_id,hotel_name,name,slug,description,hotel_type,star_rating,address,city,state,country,postal_code,latitude,longitude,
       phone,email,check_in_time,check_out_time,amenities,onboarding_data,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      hotelId, req.user.id, payload.name, payload.name, payload.slug, payload.description, payload.hotelType,
      payload.starRating, payload.address, payload.city, payload.state, payload.country, payload.postalCode,
      payload.latitude, payload.longitude, payload.phone, payload.email, payload.checkInTime, payload.checkOutTime,
      JSON.stringify(payload.amenities), JSON.stringify(payload.onboardingData || {}), payload.status,
    ]);
    await replaceHotelChildren(connection, hotelId, payload);
    await replaceHotelRooms(connection, hotelId, req.user.id, payload.rooms);
    await connection.commit();
    res.status(201).json({ id: hotelId, status: payload.status, message: payload.status === "draft" ? "Hotel draft saved successfully." : "Hotel published successfully." });
  } catch (error) {
    await connection.rollback();
    res.status(error.status || 500).json({ message: error.message });
  } finally { connection.release(); }
}
async function vendorHotel(req,res) { await ready; const filter=vendorFilter(req,"h."); req.params.id=req.params.id; const [rows]=await pool.query(`SELECT h.*,${imageAggregate} images FROM hotels h WHERE h.id=? AND ${filter.sql}`,[req.params.id,...filter.params]); if(!rows.length)return res.status(404).json({message:"Hotel not found."}); const [policies]=await pool.query("SELECT id,policy_type type,title,description FROM hotel_policies WHERE hotel_id=? ORDER BY sort_order",[req.params.id]); res.json({...serializeHotel(rows[0]),policies}); }
async function updateHotel(req, res) {
  await ready;
  const payload = hotelPayload(req.body);
  const filter = vendorFilter(req);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(`UPDATE hotels SET hotel_name=?,name=?,slug=?,description=?,hotel_type=?,star_rating=?,address=?,city=?,state=?,country=?,postal_code=?,latitude=?,longitude=?,phone=?,email=?,check_in_time=?,check_out_time=?,amenities=?,onboarding_data=COALESCE(?,onboarding_data),status=? WHERE id=? AND ${filter.sql}`, [
      payload.name, payload.name, payload.slug, payload.description, payload.hotelType, payload.starRating,
      payload.address, payload.city, payload.state, payload.country, payload.postalCode, payload.latitude,
      payload.longitude, payload.phone, payload.email, payload.checkInTime, payload.checkOutTime,
      JSON.stringify(payload.amenities), payload.onboardingData ? JSON.stringify(payload.onboardingData) : null,
      payload.status, req.params.id, ...filter.params,
    ]);
    if (!result.affectedRows) throw Object.assign(new Error("Hotel not found."), { status: 404 });
    await replaceHotelChildren(connection, req.params.id, payload);
    await replaceHotelRooms(connection, req.params.id, req.user.id, payload.rooms);
    await connection.commit();
    res.json({ id: req.params.id, status: payload.status, message: payload.status === "draft" ? "Hotel draft updated." : "Hotel updated successfully." });
  } catch (error) {
    await connection.rollback();
    res.status(error.status || 500).json({ message: error.message });
  } finally { connection.release(); }
}
async function deleteHotel(req,res) { await ready; const filter=vendorFilter(req); const [result]=await pool.query(`UPDATE hotels SET status='hidden' WHERE id=? AND ${filter.sql}`,[req.params.id,...filter.params]); if(!result.affectedRows)return res.status(404).json({message:"Hotel not found."});res.json({message:"Hotel hidden successfully."}); }
async function hotelStatus(req,res) { await ready; const next=status(req.body.status); const filter=vendorFilter(req); const [result]=await pool.query(`UPDATE hotels SET status=? WHERE id=? AND ${filter.sql}`,[next,req.params.id,...filter.params]);if(!result.affectedRows)return res.status(404).json({message:"Hotel not found."});res.json({message:`Hotel ${next}.`}); }

async function vendorRooms(req,res) { await ready; const filter=vendorFilter(req,"r."); const [rows]=await pool.query(`SELECT r.*,${roomImageAggregate} images FROM hotel_rooms r WHERE r.hotel_id=? AND ${filter.sql} ORDER BY r.created_at DESC`,[req.params.hotelId,...filter.params]);res.json(rows.map(serializeRoom)); }
const roomPayload=(body)=>{const basePrice=Math.max(0,n(body.basePrice||body.offerPrice||body.weekdayPrice));return {name:text(body.name||body.roomName),roomType:text(body.roomType),description:text(body.description||body.roomDescription),maxAdults:Math.max(1,n(body.maxAdults||body.adults,2)),maxChildren:Math.max(0,n(body.maxChildren??body.children)),bedType:text(body.bedType),roomSize:text(body.roomSize),totalRooms:Math.max(1,n(body.totalRooms,1)),basePrice,weekdayPrice:Math.max(0,n(body.weekdayPrice,basePrice)),weekendPrice:Math.max(0,n(body.weekendPrice,basePrice)),seasonalPrice:Math.max(0,n(body.seasonalPrice,basePrice)),extraAdultCharge:Math.max(0,n(body.extraAdultCharge)),extraChildCharge:Math.max(0,n(body.extraChildCharge)),taxPercent:Math.max(0,n(body.taxPercent,12)),discountPercent:Math.max(0,n(body.discountPercent)),offerPrice:Math.max(0,n(body.offerPrice,basePrice)),amenities:Array.isArray(body.amenities)?body.amenities:String(body.amenities||"").split(",").map(x=>x.trim()).filter(Boolean),refundable:body.refundable!==false,mealPlan:text(body.mealPlan),status:status(body.status),images:Array.isArray(body.images)?body.images:[]};};
async function replaceRoomImages(connection,roomId,images){await connection.query("DELETE FROM hotel_room_images WHERE room_id=?",[roomId]);for(let i=0;i<images.length;i+=1){const image=images[i];const url=typeof image==="string"?image:image.url||image.data;if(url)await connection.query("INSERT INTO hotel_room_images (id,room_id,image_url,alt_text,is_primary,sort_order) VALUES (?,?,?,?,?,?)",[id(),roomId,url,text(image.alt),Boolean(image.isPrimary||i===0),i]);}}
async function createRoom(req,res){await ready;const p=roomPayload(req.body);const filter=vendorFilter(req);const [hotels]=await pool.query(`SELECT * FROM hotels WHERE id=? AND ${filter.sql}`,[req.params.hotelId,...filter.params]);if(!hotels.length)return res.status(404).json({message:"Hotel not found."});if(!p.name||!p.roomType||!p.basePrice)return res.status(400).json({message:"Room name, type, and price are required."});const connection=await pool.getConnection();try{await connection.beginTransaction();const roomId=id();await connection.query(`INSERT INTO hotel_rooms (id,hotel_id,vendor_id,name,room_type,description,max_adults,max_children,bed_type,room_size,total_rooms,base_price,tax_percent,amenities,refundable,meal_plan,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[roomId,req.params.hotelId,hotels[0].vendor_id,p.name,p.roomType,p.description,p.maxAdults,p.maxChildren,p.bedType,p.roomSize,p.totalRooms,p.basePrice,p.taxPercent,JSON.stringify(p.amenities),p.refundable,p.mealPlan,p.status]);await replaceRoomImages(connection,roomId,p.images);await connection.commit();res.status(201).json({id:roomId,message:"Room added."});}catch(error){await connection.rollback();res.status(500).json({message:error.message});}finally{connection.release();}}
async function updateRoom(req,res){await ready;const p=roomPayload(req.body);const filter=vendorFilter(req,"r.");const connection=await pool.getConnection();try{await connection.beginTransaction();const [result]=await connection.query(`UPDATE hotel_rooms r SET name=?,room_type=?,description=?,max_adults=?,max_children=?,bed_type=?,room_size=?,total_rooms=?,base_price=?,tax_percent=?,amenities=?,refundable=?,meal_plan=?,status=? WHERE r.id=? AND ${filter.sql}`,[p.name,p.roomType,p.description,p.maxAdults,p.maxChildren,p.bedType,p.roomSize,p.totalRooms,p.basePrice,p.taxPercent,JSON.stringify(p.amenities),p.refundable,p.mealPlan,p.status,req.params.roomId,...filter.params]);if(!result.affectedRows)throw Object.assign(new Error("Room not found."),{status:404});await replaceRoomImages(connection,req.params.roomId,p.images);await connection.query("UPDATE hotel_inventory_calendar SET total_rooms=?,available_rooms=GREATEST(0,?-booked_rooms-blocked_rooms),price=IF(price=0,?,price) WHERE room_id=? AND inventory_date>=CURDATE()",[p.totalRooms,p.totalRooms,p.basePrice,req.params.roomId]);await connection.commit();res.json({message:"Room updated."});}catch(error){await connection.rollback();res.status(error.status||500).json({message:error.message});}finally{connection.release();}}
async function deleteRoom(req,res){await ready;const filter=vendorFilter(req);const [result]=await pool.query(`UPDATE hotel_rooms SET status='hidden' WHERE id=? AND ${filter.sql}`,[req.params.roomId,...filter.params]);if(!result.affectedRows)return res.status(404).json({message:"Room not found."});res.json({message:"Room hidden."});}
async function roomStatus(req,res){await ready;const filter=vendorFilter(req);const [result]=await pool.query(`UPDATE hotel_rooms SET status=? WHERE id=? AND ${filter.sql}`,[status(req.body.status),req.params.roomId,...filter.params]);if(!result.affectedRows)return res.status(404).json({message:"Room not found."});res.json({message:"Room status updated."});}

async function calendar(req,res){await ready;const month=Math.min(12,Math.max(1,n(req.query.month,new Date().getMonth()+1)));const year=Math.max(2020,n(req.query.year,new Date().getFullYear()));const start=`${year}-${String(month).padStart(2,"0")}-01`;const end=new Date(year,month,1).toISOString().slice(0,10);const filter=vendorFilter(req,"r.");const [rooms]=await pool.query(`SELECT r.id,r.name,r.room_type,r.total_rooms,r.base_price FROM hotel_rooms r WHERE r.hotel_id=? AND r.status<>'hidden' AND ${filter.sql}`,[req.query.hotelId,...filter.params]);const [entries]=await pool.query(`SELECT i.* FROM hotel_inventory_calendar i JOIN hotel_rooms r ON r.id=i.room_id WHERE i.hotel_id=? AND i.inventory_date>=? AND i.inventory_date<? AND ${filter.sql}`,[req.query.hotelId,start,end,...filter.params]);res.json({hotelId:req.query.hotelId,month,year,rooms,entries});}
async function inventoryUpdate(req,res){await ready;const date=sqlDate(req.body.date||req.body.inventoryDate);const filter=vendorFilter(req,"r.");const [rooms]=await pool.query(`SELECT r.* FROM hotel_rooms r WHERE r.id=? AND ${filter.sql}`,[req.body.roomId,...filter.params]);if(!rooms.length||!date)return res.status(400).json({message:"Valid room and date are required."});const room=rooms[0];const total=Math.max(0,n(req.body.totalRooms,room.total_rooms));const available=Math.max(0,Math.min(total,n(req.body.availableRooms,total)));const blocked=Math.max(0,Math.min(total-available,n(req.body.blockedRooms,0)));const price=Math.max(0,n(req.body.price,room.base_price));await pool.query(`INSERT INTO hotel_inventory_calendar (id,hotel_id,room_id,inventory_date,total_rooms,available_rooms,blocked_rooms,booked_rooms,price,status) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE total_rooms=VALUES(total_rooms),available_rooms=LEAST(VALUES(available_rooms),GREATEST(0,VALUES(total_rooms)-booked_rooms)),blocked_rooms=VALUES(blocked_rooms),price=VALUES(price),status=VALUES(status)`,[id(),room.hotel_id,room.id,date,total,available,blocked,0,price,text(req.body.status)||"available"]);res.json({message:"Inventory updated."});}
async function changeBlock(req,res,unblock=false){await ready;const start=sqlDate(req.body.startDate||req.body.date),end=sqlDate(req.body.endDate)||start;const inclusiveEnd=end?new Date(new Date(`${end}T00:00:00Z`).getTime()+86400000).toISOString().slice(0,10):null;const stayDates=start&&inclusiveEnd?datesBetween(start,inclusiveEnd):[];const filter=vendorFilter(req,"r.");const [rooms]=await pool.query(`SELECT r.* FROM hotel_rooms r WHERE r.id=? AND ${filter.sql}`,[req.body.roomId,...filter.params]);if(!rooms.length||!stayDates.length)return res.status(400).json({message:"Room and date range are required."});const room=rooms[0],quantity=Math.max(1,n(req.body.quantity,1));for(const date of stayDates){await pool.query(`INSERT INTO hotel_inventory_calendar (id,hotel_id,room_id,inventory_date,total_rooms,available_rooms,blocked_rooms,booked_rooms,price,status) VALUES (?,?,?,?,?,?,0,0,?,'available') ON DUPLICATE KEY UPDATE room_id=VALUES(room_id)`,[id(),room.hotel_id,room.id,date,room.total_rooms,room.total_rooms,room.base_price]);if(unblock)await pool.query(`UPDATE hotel_inventory_calendar SET blocked_rooms=GREATEST(0,blocked_rooms-?),available_rooms=LEAST(total_rooms-booked_rooms,available_rooms+?),status=IF(available_rooms+?>0,'available',status) WHERE room_id=? AND inventory_date=?`,[quantity,quantity,quantity,room.id,date]);else await pool.query(`UPDATE hotel_inventory_calendar SET blocked_rooms=blocked_rooms+LEAST(?,available_rooms),available_rooms=GREATEST(0,available_rooms-?),status=IF(available_rooms-?<=0,'blocked',status) WHERE room_id=? AND inventory_date=?`,[quantity,quantity,quantity,room.id,date]);}res.json({message:`Rooms ${unblock?"unblocked":"blocked"}.`});}

async function vendorBookings(req,res){await ready;const filter=vendorFilter(req,"b.");const params=[...filter.params];let where=filter.sql;if(req.query.status){where+=" AND b.booking_status=?";params.push(req.query.status);}if(req.query.hotelId){where+=" AND b.hotel_id=?";params.push(req.query.hotelId);}const [rows]=await pool.query(`${bookingSelect} WHERE ${where} ORDER BY b.created_at DESC`,params);res.json(rows.map(serializeBooking));}
async function vendorBooking(req,res){await ready;const filter=vendorFilter(req,"b.");const [rows]=await pool.query(`${bookingSelect} WHERE b.id=? AND ${filter.sql}`,[req.params.id,...filter.params]);if(!rows.length)return res.status(404).json({message:"Booking not found."});res.json(serializeBooking(rows[0]));}
async function bookingStatusUpdate(req,res){await ready;const allowed=["pending","confirmed","cancelled","checked_in","checked_out","refunded"];if(!allowed.includes(req.body.status))return res.status(400).json({message:"Invalid booking status."});const filter=vendorFilter(req,"b.");const connection=await pool.getConnection();try{await connection.beginTransaction();const [rows]=await connection.query(`SELECT b.* FROM hotel_bookings b WHERE b.id=? AND ${filter.sql} FOR UPDATE`,[req.params.id,...filter.params]);if(!rows.length)throw Object.assign(new Error("Booking not found."),{status:404});const booking=rows[0];if(req.body.status==="cancelled"&&!['cancelled','refunded'].includes(booking.booking_status))await connection.query(`UPDATE hotel_inventory_calendar SET booked_rooms=GREATEST(0,booked_rooms-?),available_rooms=LEAST(total_rooms-blocked_rooms,available_rooms+?),status=IF(available_rooms+?>0,'available',status) WHERE room_id=? AND inventory_date>=? AND inventory_date<?`,[booking.room_count,booking.room_count,booking.room_count,booking.room_id,booking.check_in_date,booking.check_out_date]);await connection.query("UPDATE hotel_bookings SET booking_status=?,cancellation_reason=COALESCE(?,cancellation_reason),cancelled_at=IF(?='cancelled',NOW(),cancelled_at),checked_in_at=IF(?='checked_in',NOW(),checked_in_at) WHERE id=?",[req.body.status,text(req.body.reason)||null,req.body.status,req.body.status,booking.id]);await connection.commit();res.json({message:"Booking status updated."});}catch(error){await connection.rollback();res.status(error.status||500).json({message:error.message});}finally{connection.release();}}
async function refundBooking(req,res){await ready;const filter=vendorFilter(req,"b.");const [rows]=await pool.query(`SELECT b.* FROM hotel_bookings b WHERE b.id=? AND ${filter.sql}`,[req.params.id,...filter.params]);if(!rows.length)return res.status(404).json({message:"Booking not found."});const booking=rows[0];const refundId=id();await pool.query("INSERT INTO hotel_refunds (id,booking_id,vendor_id,user_id,amount,reason,status,transaction_id,processed_at) VALUES (?,?,?,?,?,?,'processed',?,NOW())",[refundId,booking.id,booking.vendor_id,booking.user_id,n(req.body.amount,booking.total_amount),text(req.body.reason),text(req.body.transactionId)||`RFND-${Date.now()}`]);await pool.query("UPDATE hotel_bookings SET booking_status='refunded',payment_status='refunded' WHERE id=?",[booking.id]);res.json({message:"Refund processed.",refundId});}
async function checkIn(req,res){await ready;const filter=vendorFilter(req,"b.");const value=text(req.body.qrToken||req.body.token);const [rows]=await pool.query(`SELECT b.* FROM hotel_bookings b WHERE (b.id=? OR b.booking_code=? OR b.qr_token=?) AND ${filter.sql}`,[req.params.id,req.params.id,value||req.params.id,...filter.params]);if(!rows.length)return res.status(404).json({message:"Booking or QR code not found."});if(rows[0].payment_status!=="success"||rows[0].booking_status!=="confirmed")return res.status(409).json({message:"Only paid, confirmed bookings can check in."});await pool.query("UPDATE hotel_bookings SET booking_status='checked_in',checked_in_at=NOW() WHERE id=?",[rows[0].id]);res.json({message:"Guest checked in successfully.",bookingId:rows[0].id});}

async function reviews(req,res){await ready;const filter=vendorFilter(req,"h.");const [rows]=await pool.query(`SELECT hr.*,h.name hotel_name,u.name user_name,(SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id',rr.id,'reply',rr.reply,'createdAt',rr.created_at)),JSON_ARRAY()) FROM hotel_review_replies rr WHERE rr.review_id=hr.id) replies FROM hotel_reviews hr JOIN hotels h ON h.id=hr.hotel_id LEFT JOIN users u ON u.id=hr.user_id WHERE ${filter.sql} ORDER BY hr.created_at DESC`,filter.params);res.json(rows.map(row=>({...row,replies:json(row.replies)})));}
async function replyReview(req,res){await ready;const filter=vendorFilter(req,"h.");const [rows]=await pool.query(`SELECT hr.id FROM hotel_reviews hr JOIN hotels h ON h.id=hr.hotel_id WHERE hr.id=? AND ${filter.sql}`,[req.params.id,...filter.params]);if(!rows.length)return res.status(404).json({message:"Review not found."});if(!text(req.body.reply))return res.status(400).json({message:"Reply is required."});await pool.query("INSERT INTO hotel_review_replies (id,review_id,vendor_id,reply) VALUES (?,?,?,?)",[id(),req.params.id,req.user.id,text(req.body.reply)]);res.status(201).json({message:"Reply posted."});}

async function getDashboardData(req){
  const hotelFilter=vendorFilter(req,"h.");
  const [hotels]=await pool.query(`SELECT COUNT(*) total_hotels,SUM(h.status='active') active_hotels FROM hotels h WHERE ${hotelFilter.sql}`,hotelFilter.params);
  const roomFilter=vendorFilter(req,"r.");
  const [rooms]=await pool.query(`SELECT COALESCE(SUM(r.total_rooms),0) total_rooms FROM hotel_rooms r WHERE r.status='active' AND ${roomFilter.sql}`,roomFilter.params);
  const bookingFilter=vendorFilter(req,"b.");
  const [bookings]=await pool.query(`SELECT COUNT(*) total_bookings,COALESCE(SUM(IF(b.payment_status='success',b.total_amount,0)),0) revenue,COALESCE(SUM(b.check_in_date=CURDATE() AND b.booking_status='confirmed'),0) today_check_ins,COALESCE(SUM(b.check_out_date=CURDATE() AND b.booking_status IN ('confirmed','checked_in')),0) today_check_outs,COALESCE(SUM(IF(b.booking_status IN ('confirmed','checked_in') AND CURDATE()>=b.check_in_date AND CURDATE()<b.check_out_date,b.room_count,0)),0) booked_rooms FROM hotel_bookings b WHERE ${bookingFilter.sql}`,bookingFilter.params);
  const [inventory]=await pool.query(`SELECT COALESCE(SUM(COALESCE(i.available_rooms,r.total_rooms)),0) available_rooms,COALESCE(SUM(COALESCE(i.blocked_rooms,0)),0) blocked_rooms FROM hotel_rooms r LEFT JOIN hotel_inventory_calendar i ON i.room_id=r.id AND i.inventory_date=CURDATE() WHERE r.status='active' AND ${roomFilter.sql}`,roomFilter.params);
  const refundFilter=vendorFilter(req,"f.");
  const [refunds]=await pool.query(`SELECT COUNT(*) pending_refunds FROM hotel_refunds f WHERE f.status='pending' AND ${refundFilter.sql}`,refundFilter.params);
  const data={...hotels[0],...rooms[0],...bookings[0],...inventory[0],...refunds[0]};
  data.occupancy_rate=n(data.total_rooms)?Math.round(n(data.booked_rooms)/n(data.total_rooms)*100):0;
  return data;
}
async function dashboard(req,res){await ready;res.json(await getDashboardData(req));}
async function reports(req,res){await ready;const summary=await getDashboardData(req);const hotelFilter=vendorFilter(req,"h.");const [byHotel]=await pool.query(`SELECT h.id,h.name,COUNT(b.id) bookings,COALESCE(SUM(IF(b.payment_status='success',b.total_amount,0)),0) revenue FROM hotels h LEFT JOIN hotel_bookings b ON b.hotel_id=h.id WHERE ${hotelFilter.sql} GROUP BY h.id ORDER BY revenue DESC`,hotelFilter.params);const bookingFilter=vendorFilter(req,"b.");const [statusRows]=await pool.query(`SELECT booking_status status,COUNT(*) count FROM hotel_bookings b WHERE ${bookingFilter.sql} GROUP BY booking_status`,bookingFilter.params);res.json({summary,byHotel,statusBreakdown:statusRows});}
async function trends(req,res){await ready;const range=["day","week","month","year"].includes(req.query.range)?req.query.range:"month";const expr={day:"DATE_FORMAT(created_at,'%H:00')",week:"DATE_FORMAT(created_at,'%a')",month:"DATE_FORMAT(created_at,'%Y-%m-%d')",year:"DATE_FORMAT(created_at,'%Y-%m')"}[range];const interval={day:"1 DAY",week:"7 DAY",month:"1 MONTH",year:"1 YEAR"}[range];const filter=vendorFilter(req,"b.");const [rows]=await pool.query(`SELECT ${expr} label,COUNT(*) bookings,COALESCE(SUM(total_amount),0) revenue FROM hotel_bookings b WHERE created_at>=DATE_SUB(NOW(),INTERVAL ${interval}) AND ${filter.sql} GROUP BY label ORDER BY MIN(created_at)`,filter.params);res.json(rows);}

async function coupons(req,res){await ready;const filter=vendorFilter(req);const [rows]=await pool.query(`SELECT * FROM hotel_coupons WHERE ${filter.sql} ORDER BY created_at DESC`,filter.params);res.json(rows);}
async function saveCoupon(req,res){await ready;const couponId=req.params.id||id();const values=[req.user.id,req.body.hotelId||null,text(req.body.code).toUpperCase(),text(req.body.description),req.body.discountType==="fixed"?"fixed":"percent",n(req.body.discountValue),n(req.body.minBookingAmount),req.body.maxDiscount===""?null:n(req.body.maxDiscount),sqlDate(req.body.validFrom),sqlDate(req.body.validUntil),req.body.usageLimit?Math.floor(n(req.body.usageLimit)):null,req.body.status==="inactive"?"inactive":"active"];if(!text(req.body.code)||!values[8]||!values[9])return res.status(400).json({message:"Code and validity dates are required."});if(req.params.id){const filter=vendorFilter(req);const [result]=await pool.query(`UPDATE hotel_coupons SET hotel_id=?,code=?,description=?,discount_type=?,discount_value=?,min_booking_amount=?,max_discount=?,valid_from=?,valid_until=?,usage_limit=?,status=? WHERE id=? AND ${filter.sql}`,[...values.slice(1),couponId,...filter.params]);if(!result.affectedRows)return res.status(404).json({message:"Coupon not found."});}else await pool.query("INSERT INTO hotel_coupons (id,vendor_id,hotel_id,code,description,discount_type,discount_value,min_booking_amount,max_discount,valid_from,valid_until,usage_limit,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",[couponId,...values]);res.status(req.params.id?200:201).json({id:couponId,message:"Coupon saved."});}
async function deleteCoupon(req,res){await ready;const filter=vendorFilter(req);const [result]=await pool.query(`DELETE FROM hotel_coupons WHERE id=? AND ${filter.sql}`,[req.params.id,...filter.params]);if(!result.affectedRows)return res.status(404).json({message:"Coupon not found."});res.json({message:"Coupon deleted."});}

module.exports={publicHotels,getHotel,publicRooms,quoteBooking,createBooking,userBookings,userBooking,cancelRequest,vendorHotels,createHotel,vendorHotel,updateHotel,deleteHotel,hotelStatus,vendorRooms,createRoom,updateRoom,deleteRoom,roomStatus,calendar,inventoryUpdate,blockRooms:(req,res)=>changeBlock(req,res,false),unblockRooms:(req,res)=>changeBlock(req,res,true),vendorBookings,vendorBooking,bookingStatusUpdate,refundBooking,checkIn,reviews,replyReview,dashboard,reports,trends,coupons,saveCoupon,deleteCoupon};
