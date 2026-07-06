const crypto = require("crypto");
const { pool, ready } = require("../config/db");
const { getIo } = require("../socket");

const makeId = () => `${Date.now().toString(16)}${crypto.randomBytes(6).toString("hex")}`.slice(0, 24);
const clean = (value) => String(value ?? "").trim();
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const date = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").slice(0, 10)) ? String(value).slice(0, 10) : null;
const vendorWhere = (req, alias = "") => req.user.role === "admin" ? { sql: "1=1", params: [] } : { sql: `${alias}vendor_id=?`, params: [req.user.id] };
const eventStatus = (value) => ["active", "hidden", "completed"].includes(value) ? value : "active";
const notePriority = (value) => ["low", "medium", "high"].includes(value) ? value : "medium";
const noteStatus = (value) => ["open", "in_progress", "completed"].includes(value) ? value : "open";
const json = (value, fallback = []) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try { return JSON.parse(value || ""); } catch { return fallback; }
};

const payload = (body = {}) => ({
  eventName: clean(body.eventName ?? body.event_name), category: clean(body.category),
  eventType: clean(body.eventType ?? body.event_type), organizerName: clean(body.organizerName ?? body.organizer_name),
  eventDate: date(body.eventDate ?? body.event_date), startTime: clean(body.startTime ?? body.start_time),
  endTime: clean(body.endTime ?? body.end_time), venueName: clean(body.venueName ?? body.venue_name),
  city: clean(body.city), address: clean(body.address), ticketPrice: Math.max(0, number(body.ticketPrice ?? body.ticket_price)),
  totalTickets: Math.max(0, Math.floor(number(body.totalTickets ?? body.total_tickets))),
  availableTickets: Math.max(0, Math.floor(number(body.availableTickets ?? body.available_tickets, body.totalTickets ?? body.total_tickets))),
  posterUrl: clean(body.posterUrl ?? body.poster_url), bannerUrl: clean(body.bannerUrl ?? body.banner_url),
  description: clean(body.description), terms: clean(body.terms), status: eventStatus(body.status),
  tags: json(body.tags).map(clean).filter(Boolean), state: clean(body.state), country: clean(body.country) || "India",
  mapUrl: clean(body.mapUrl ?? body.map_url), endDate: date(body.endDate ?? body.end_date ?? body.eventDate ?? body.event_date),
  timezone: clean(body.timezone) || "Asia/Kolkata", ticketType: clean(body.ticketType ?? body.ticket_type) || "General Admission",
  bookingLimit: Math.max(1, Math.floor(number(body.bookingLimit ?? body.booking_limit, 10))),
  earlyBirdPrice: body.earlyBirdPrice === "" || body.early_bird_price === null ? null : Math.max(0, number(body.earlyBirdPrice ?? body.early_bird_price)),
  earlyBirdUntil: date(body.earlyBirdUntil ?? body.early_bird_until), gallery: json(body.gallery).filter(Boolean),
  thumbnailUrl: clean(body.thumbnailUrl ?? body.thumbnail_url), videoUrl: clean(body.videoUrl ?? body.video_url),
  organizerEmail: clean(body.organizerEmail ?? body.organizer_email), organizerPhone: clean(body.organizerPhone ?? body.organizer_phone),
  organizerWebsite: clean(body.organizerWebsite ?? body.organizer_website), socialLinks: json(body.socialLinks ?? body.social_links, {}),
});

const validateEvent = (item) => {
  if (!item.eventName || !item.category || !item.eventType || !item.organizerName || !item.eventDate || !item.startTime || !item.endTime || !item.venueName || !item.city || !item.address) return "Please complete all required event fields.";
  if (item.endTime <= item.startTime) return "End time must be later than start time.";
  if (item.endDate && item.endDate < item.eventDate) return "End date cannot be earlier than the start date.";
  if (item.availableTickets > item.totalTickets) return "Available tickets cannot exceed total tickets.";
  return "";
};

const eventRecord = (item, vendorId) => ({
  ...(vendorId ? { vendor_id: vendorId } : {}), event_title: item.eventName, venue: item.venueName,
  event_name: item.eventName, category: item.category, event_type: item.eventType, organizer_name: item.organizerName,
  event_date: item.eventDate, end_date: item.endDate, start_time: item.startTime, end_time: item.endTime,
  venue_name: item.venueName, city: item.city, state: item.state || null, country: item.country, address: item.address,
  map_url: item.mapUrl || null, ticket_price: item.ticketPrice, total_tickets: item.totalTickets,
  available_tickets: item.availableTickets, ticket_type: item.ticketType, booking_limit: item.bookingLimit,
  early_bird_price: item.earlyBirdPrice, early_bird_until: item.earlyBirdUntil, poster_url: item.posterUrl || null,
  banner_url: item.bannerUrl || null, thumbnail_url: item.thumbnailUrl || null, video_url: item.videoUrl || null,
  gallery: JSON.stringify(item.gallery), tags: JSON.stringify(item.tags), description: item.description, terms: item.terms,
  organizer_email: item.organizerEmail || null, organizer_phone: item.organizerPhone || null,
  organizer_website: item.organizerWebsite || null, social_links: JSON.stringify(item.socialLinks),
  timezone: item.timezone, status: item.status,
});
const serializeEvent = (row) => ({ ...row, tags: json(row.tags), gallery: json(row.gallery), social_links: json(row.social_links, {}) });

const eventSelect = `SELECT e.*,
  (SELECT COUNT(*) FROM event_bookings b WHERE b.event_id=e.id AND b.booking_status<>'cancelled') booking_count,
  (SELECT COALESCE(SUM(b.quantity),0) FROM event_bookings b WHERE b.event_id=e.id AND b.booking_status<>'cancelled') tickets_sold,
  (SELECT COALESCE(SUM(b.total_amount),0) FROM event_bookings b WHERE b.event_id=e.id AND b.payment_status='success' AND b.booking_status<>'cancelled') revenue
  FROM events e`;

async function publicEvents(req, res) {
  await ready;
  const values = [], where = ["e.status='active'", "e.event_date>=CURDATE()"];
  for (const [column, value] of [["e.city", req.query.city], ["e.category", req.query.category]]) if (clean(value)) { where.push(`${column}=?`); values.push(clean(value)); }
  if (clean(req.query.search)) { where.push("(e.event_name LIKE ? OR e.venue_name LIKE ? OR e.organizer_name LIKE ?)"); values.push(...Array(3).fill(`%${clean(req.query.search)}%`)); }
  const [rows] = await pool.query(`${eventSelect} WHERE ${where.join(" AND ")} ORDER BY e.event_date,e.start_time`, values);
  res.json(rows.map(serializeEvent));
}

async function publicEvent(req, res) {
  await ready;
  const [rows] = await pool.query(`${eventSelect} WHERE e.id=? AND e.status='active'`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Event not found." });
  res.json(serializeEvent(rows[0]));
}

async function vendorEvents(req, res) {
  await ready; const filter = vendorWhere(req, "e.");
  const values = [...filter.params], where = [filter.sql];
  if (clean(req.query.status)) { where.push("e.status=?"); values.push(clean(req.query.status)); }
  if (clean(req.query.category)) { where.push("e.category=?"); values.push(clean(req.query.category)); }
  if (clean(req.query.search)) { where.push("(e.event_name LIKE ? OR e.venue_name LIKE ? OR e.city LIKE ?)"); values.push(...Array(3).fill(`%${clean(req.query.search)}%`)); }
  const [rows] = await pool.query(`${eventSelect} WHERE ${where.join(" AND ")} ORDER BY e.event_date DESC,e.created_at DESC`, values);
  res.json(rows.map(serializeEvent));
}

async function vendorEvent(req, res) { await ready; const f=vendorWhere(req,"e."); const [rows]=await pool.query(`${eventSelect} WHERE e.id=? AND ${f.sql}`,[req.params.id,...f.params]); if(!rows.length)return res.status(404).json({message:"Event not found."}); res.json(serializeEvent(rows[0])); }

async function createEvent(req, res) {
  await ready; const item=payload(req.body); const error=validateEvent(item); if(error)return res.status(400).json({message:error}); const eventId=makeId();
  await pool.query("INSERT INTO events SET ?", [{ id:eventId, ...eventRecord(item, req.user.id) }]);
  res.status(201).json({id:eventId,message:"Event created successfully."});
}

async function updateEvent(req,res){await ready;const item=payload(req.body),error=validateEvent(item);if(error)return res.status(400).json({message:error});const f=vendorWhere(req);const [result]=await pool.query(`UPDATE events SET ? WHERE id=? AND ${f.sql}`,[eventRecord(item),req.params.id,...f.params]);if(!result.affectedRows)return res.status(404).json({message:"Event not found."});res.json({message:"Event updated successfully."});}
async function deleteEvent(req,res){await ready;const f=vendorWhere(req);const [bookings]=await pool.query(`SELECT COUNT(*) total FROM event_bookings WHERE event_id=?`,[req.params.id]);if(number(bookings[0]?.total)>0)return res.status(409).json({message:"Events with bookings cannot be deleted. Hide the event instead."});const [result]=await pool.query(`DELETE FROM events WHERE id=? AND ${f.sql}`,[req.params.id,...f.params]);if(!result.affectedRows)return res.status(404).json({message:"Event not found."});res.json({message:"Event deleted."});}
async function setVisibility(req,res,status){await ready;const f=vendorWhere(req);const [result]=await pool.query(`UPDATE events SET status=? WHERE id=? AND ${f.sql}`,[status,req.params.id,...f.params]);if(!result.affectedRows)return res.status(404).json({message:"Event not found."});res.json({message:`Event ${status === "hidden" ? "hidden" : "published"}.`});}

async function duplicateEvent(req,res){await ready;const f=vendorWhere(req);const [rows]=await pool.query(`SELECT * FROM events WHERE id=? AND ${f.sql}`,[req.params.id,...f.params]);if(!rows.length)return res.status(404).json({message:"Event not found."});const source={...rows[0]},eventId=makeId();delete source.id;delete source.created_at;delete source.updated_at;for(const field of ["tags","gallery","social_links"])if(source[field]&&typeof source[field]!=="string")source[field]=JSON.stringify(source[field]);source.event_name=`${source.event_name||source.event_title} (Copy)`;source.event_title=source.event_name;source.status="hidden";source.available_tickets=source.total_tickets;source.sold_tickets=0;await pool.query("INSERT INTO events SET ?",[{id:eventId,...source}]);res.status(201).json({id:eventId,message:"Event duplicated as an unpublished copy."});}

async function dashboard(req,res){await ready;const f=vendorWhere(req,"e.");const [stats]=await pool.query(`SELECT COUNT(*) total_events,COALESCE(SUM(e.status='active'),0) active_events,COALESCE(SUM(e.status='active' AND e.event_date>=CURDATE()),0) upcoming_events,COALESCE(SUM(e.status='completed' OR e.event_date<CURDATE()),0) completed_events,COALESCE(SUM(e.available_tickets),0) available_tickets FROM events e WHERE ${f.sql}`,f.params);const bf=vendorWhere(req,"b.");const [booking]=await pool.query(`SELECT COUNT(*) total_bookings,COALESCE(SUM(IF(b.payment_status='success' AND b.booking_status<>'cancelled',b.total_amount,0)),0) total_revenue,COALESCE(SUM(IF(b.payment_status='success' AND b.booking_status<>'cancelled',b.total_amount,0)),0)*.90 vendor_earning FROM event_bookings b WHERE ${bf.sql}`,bf.params);const total=number(booking[0]?.total_revenue);res.json({...stats[0],...booking[0],pending_settlement:number(booking[0]?.vendor_earning),platform_commission:total*.1});}

async function revenue(req,res){await ready;const range=["daily","weekly","monthly","yearly"].includes(req.query.range)?req.query.range:"monthly";const config={daily:["%H:00","1 DAY"],weekly:["%a","7 DAY"],monthly:["%d %b","30 DAY"],yearly:["%b","1 YEAR"]}[range];const f=vendorWhere(req,"b.");const [rows]=await pool.query(`SELECT DATE_FORMAT(b.created_at,?) label,COUNT(*) bookings,COALESCE(SUM(b.total_amount),0) revenue FROM event_bookings b WHERE b.payment_status='success' AND b.booking_status<>'cancelled' AND b.created_at>=DATE_SUB(NOW(),INTERVAL ${config[1]}) AND ${f.sql} GROUP BY label ORDER BY MIN(b.created_at)`,[config[0],...f.params]);const total=rows.reduce((sum,row)=>sum+number(row.revenue),0);res.json({range,chart:rows,totalRevenue:total,platformCommission:total*.1,vendorEarning:total*.9,pendingSettlement:total*.9});}
async function calendar(req,res){await ready;const f=vendorWhere(req,"e.");const month=Math.min(12,Math.max(1,number(req.query.month,new Date().getMonth()+1))),year=Math.max(2020,number(req.query.year,new Date().getFullYear()));const [rows]=await pool.query(`SELECT e.* FROM events e WHERE YEAR(e.event_date)=? AND MONTH(e.event_date)=? AND ${f.sql} ORDER BY e.event_date,e.start_time`,[year,month,...f.params]);res.json({month,year,events:rows});}
async function bookings(req,res){await ready;const f=vendorWhere(req,"b.");const values=[...f.params],where=[f.sql];if(clean(req.query.status)){where.push("b.booking_status=?");values.push(clean(req.query.status));}if(clean(req.query.search)){where.push("(b.id LIKE ? OR b.customer_name LIKE ? OR e.event_name LIKE ?)");values.push(...Array(3).fill(`%${clean(req.query.search)}%`));}const [rows]=await pool.query(`SELECT b.*,e.event_name,e.event_date,e.venue_name FROM event_bookings b JOIN events e ON e.id=b.event_id WHERE ${where.join(" AND ")} ORDER BY b.created_at DESC`,values);res.json(rows);}
async function bookingStatus(req,res){await ready;const status=["pending","confirmed","cancelled","completed"].includes(req.body.status)?req.body.status:null;if(!status)return res.status(400).json({message:"Invalid booking status."});const f=vendorWhere(req,"b.");const connection=await pool.getConnection();try{await connection.beginTransaction();const [rows]=await connection.query(`SELECT b.* FROM event_bookings b WHERE b.id=? AND ${f.sql} FOR UPDATE`,[req.params.id,...f.params]);if(!rows.length)throw Object.assign(new Error("Booking not found."),{status:404});if(status==="cancelled"&&rows[0].booking_status!=="cancelled")await connection.query("UPDATE events SET available_tickets=LEAST(total_tickets,available_tickets+?) WHERE id=?",[rows[0].quantity,rows[0].event_id]);await connection.query("UPDATE event_bookings SET booking_status=? WHERE id=?",[status,req.params.id]);await connection.commit();res.json({message:"Booking status updated."});}catch(error){await connection.rollback();res.status(error.status||500).json({message:error.message});}finally{connection.release();}}

async function saveNote(req,res){await ready;const title=clean(req.body.noteTitle??req.body.note_title),description=clean(req.body.noteDescription??req.body.note_description);if(!title||!description)return res.status(400).json({message:"Note title and description are required."});const noteId=makeId();await pool.query("INSERT INTO event_notes (id,vendor_id,event_id,note_title,note_description,priority,status) VALUES (?,?,?,?,?,?,?)",[noteId,req.user.id,req.body.eventId||req.body.event_id||null,title,description,notePriority(req.body.priority),noteStatus(req.body.status)]);res.status(201).json({id:noteId,message:"Note saved."});}
async function notes(req,res){await ready;const f=vendorWhere(req,"n.");const [rows]=await pool.query(`SELECT n.*,e.event_name FROM event_notes n LEFT JOIN events e ON e.id=n.event_id WHERE ${f.sql} ORDER BY FIELD(n.priority,'high','medium','low'),n.updated_at DESC`,f.params);res.json(rows);}
async function updateNote(req,res){await ready;const f=vendorWhere(req);const title=clean(req.body.noteTitle??req.body.note_title),description=clean(req.body.noteDescription??req.body.note_description);if(!title||!description)return res.status(400).json({message:"Note title and description are required."});const [result]=await pool.query(`UPDATE event_notes SET event_id=?,note_title=?,note_description=?,priority=?,status=? WHERE id=? AND ${f.sql}`,[req.body.eventId||req.body.event_id||null,title,description,notePriority(req.body.priority),noteStatus(req.body.status),req.params.id,...f.params]);if(!result.affectedRows)return res.status(404).json({message:"Note not found."});res.json({message:"Note updated."});}
async function deleteNote(req,res){await ready;const f=vendorWhere(req);const [result]=await pool.query(`DELETE FROM event_notes WHERE id=? AND ${f.sql}`,[req.params.id,...f.params]);if(!result.affectedRows)return res.status(404).json({message:"Note not found."});res.json({message:"Note deleted."});}

async function notifications(req,res){await ready;const f=vendorWhere(req);const [rows]=await pool.query(`SELECT id,title,message,type,is_read,created_at FROM notifications WHERE ${f.sql} ORDER BY created_at DESC LIMIT 8`,f.params);res.json(rows);}

async function eventSeats(req,res){await ready;const [rows]=await pool.query("SELECT id,total_tickets,available_tickets,booking_limit FROM events WHERE id=? AND status='active'",[req.params.id]);if(!rows.length)return res.status(404).json({message:"Event not found."});const event=rows[0],[assigned]=await pool.query("SELECT s.seat_no FROM event_booking_seats s JOIN event_bookings b ON b.id=s.booking_id WHERE s.event_id=? AND b.booking_status<>'cancelled'",[event.id]);const taken=new Set(assigned.map(row=>row.seat_no)),sold=Math.max(0,number(event.total_tickets)-number(event.available_tickets));for(let index=0;taken.size<sold&&index<number(event.total_tickets);index+=1){const label=`${String.fromCharCode(65+Math.floor(index/10))}${index%10+1}`;taken.add(label);}const seats=Array.from({length:number(event.total_tickets)},(_,index)=>{const seatNo=`${String.fromCharCode(65+Math.floor(index/10))}${index%10+1}`;return {seatNo,row:String.fromCharCode(65+Math.floor(index/10)),number:index%10+1,status:taken.has(seatNo)?"booked":"available"};});res.json({eventId:event.id,bookingLimit:number(event.booking_limit,10),seats});}

async function calculateQuote(connection,event,quantity,couponCode){const early=event.early_bird_price!=null&&event.early_bird_until&&String(event.early_bird_until).slice(0,10)>=new Date().toISOString().slice(0,10);const unitPrice=early?number(event.early_bird_price):number(event.ticket_price),subtotal=unitPrice*quantity;let discountAmount=0,coupon=null;const code=clean(couponCode).toUpperCase();if(code){const [rows]=await connection.query("SELECT * FROM event_coupons WHERE code=? AND vendor_id=? AND status='active' AND valid_from<=CURDATE() AND valid_until>=CURDATE() AND (event_id IS NULL OR event_id=?)",[code,event.vendor_id,event.id]);coupon=rows[0];if(!coupon||(coupon.usage_limit&&number(coupon.used_count)>=number(coupon.usage_limit)))throw Object.assign(new Error("Coupon is invalid, expired, or fully used."),{status:400});discountAmount=coupon.discount_type==="fixed"?number(coupon.discount_value):subtotal*number(coupon.discount_value)/100;if(coupon.max_discount!=null)discountAmount=Math.min(discountAmount,number(coupon.max_discount));}const convenienceFee=Math.round(Math.max(0,subtotal-discountAmount)*.02);return {unitPrice,subtotal,discountAmount,convenienceFee,totalAmount:Math.max(0,subtotal-discountAmount)+convenienceFee,coupon};}
async function quoteBooking(req,res){await ready;const quantity=Math.max(1,Math.floor(number(req.body.quantity,1)));const [rows]=await pool.query("SELECT * FROM events WHERE id=? AND status='active' AND event_date>=CURDATE()",[req.body.eventId]);if(!rows.length)return res.status(404).json({message:"Event is unavailable."});const event=rows[0];if(quantity>number(event.booking_limit,10)||quantity>number(event.available_tickets))return res.status(409).json({message:"Requested ticket quantity is unavailable."});const quote=await calculateQuote(pool,event,quantity,req.body.couponCode);delete quote.coupon;res.json({...quote,couponCode:clean(req.body.couponCode).toUpperCase()});}

async function createBooking(req,res){await ready;const seats=[...new Set(json(req.body.seats).map(clean).filter(Boolean))],quantity=seats.length||Math.max(1,Math.floor(number(req.body.quantity,1)));if(clean(req.body.paymentStatus)!=="success")return res.status(400).json({message:"Successful payment is required."});const connection=await pool.getConnection();try{await connection.beginTransaction();const [events]=await connection.query("SELECT * FROM events WHERE id=? AND status='active' AND event_date>=CURDATE() FOR UPDATE",[req.body.eventId]);if(!events.length)throw Object.assign(new Error("Event is unavailable."),{status:404});const event=events[0];if(quantity>number(event.booking_limit,10))throw Object.assign(new Error(`A maximum of ${event.booking_limit||10} tickets can be booked.`),{status:400});if(number(event.available_tickets)<quantity)throw Object.assign(new Error("Not enough tickets are available."),{status:409});const quote=await calculateQuote(connection,event,quantity,req.body.couponCode),bookingId=makeId(),qr=`EVENT-${crypto.randomBytes(18).toString("hex").toUpperCase()}`;await connection.query("INSERT INTO event_bookings (id,event_id,user_id,vendor_id,customer_name,customer_email,quantity,total_amount,payment_status,booking_status,qr_code,details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",[bookingId,event.id,req.user.id,event.vendor_id,clean(req.body.customerName)||req.user.name,clean(req.body.customerEmail)||req.user.email,quantity,quote.totalAmount,"success","confirmed",qr,JSON.stringify({seats,couponCode:clean(req.body.couponCode).toUpperCase(),discountAmount:quote.discountAmount,convenienceFee:quote.convenienceFee})]);for(const seatNo of seats)await connection.query("INSERT INTO event_booking_seats (id,booking_id,event_id,seat_no) VALUES (?,?,?,?)",[makeId(),bookingId,event.id,seatNo]);await connection.query("UPDATE events SET available_tickets=available_tickets-? WHERE id=?",[quantity,event.id]);if(quote.coupon)await connection.query("UPDATE event_coupons SET used_count=used_count+1 WHERE id=?",[quote.coupon.id]);await connection.commit();const io=getIo(),update={bookingId,eventId:event.id};if(io){io.to(`vendor:${event.vendor_id}`).emit("eventBookingUpdated",update);io.emit("eventDashboardUpdated",update);}res.status(201).json({id:bookingId,bookingId,qrCode:qr,totalAmount:quote.totalAmount,message:"Event booked successfully."});}catch(error){await connection.rollback();res.status(error.status||(error.code==="ER_DUP_ENTRY"?409:500)).json({message:error.code==="ER_DUP_ENTRY"?"One or more selected seats were just booked. Please choose again.":error.message});}finally{connection.release();}}
async function userBooking(req,res){await ready;const [rows]=await pool.query("SELECT b.*,e.event_name,e.event_date,e.start_time,e.venue_name,e.city,e.poster_url FROM event_bookings b JOIN events e ON e.id=b.event_id WHERE b.id=? AND b.user_id=?",[req.params.id,req.user.id]);if(!rows.length)return res.status(404).json({message:"Booking not found."});const [seats]=await pool.query("SELECT seat_no FROM event_booking_seats WHERE booking_id=? ORDER BY seat_no",[req.params.id]);res.json({...rows[0],details:json(rows[0].details,{}),seats:seats.map(row=>row.seat_no)});}

module.exports={publicEvents,publicEvent,eventSeats,quoteBooking,vendorEvents,vendorEvent,createEvent,updateEvent,duplicateEvent,deleteEvent,hideEvent:(req,res)=>setVisibility(req,res,"hidden"),showEvent:(req,res)=>setVisibility(req,res,"active"),dashboard,revenue,calendar,bookings,bookingStatus,saveNote,notes,updateNote,deleteNote,notifications,createBooking,userBooking};
