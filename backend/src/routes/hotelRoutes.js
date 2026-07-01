const express = require("express");
const controller = require("../controllers/hotelController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();
const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const vendor = [requireAuth, requireRole("vendor", "admin")];

router.get("/hotels/search", handle(controller.publicHotels));
router.get("/hotels", handle(controller.publicHotels));
router.get("/hotels/:id/rooms", handle(controller.publicRooms));
router.get("/hotels/:id", handle(controller.getHotel));

router.post("/hotel-bookings", requireAuth, handle(controller.createBooking));
router.post("/hotel-bookings/quote", requireAuth, handle(controller.quoteBooking));
router.get("/user/hotel-bookings", requireAuth, handle(controller.userBookings));
router.get("/user/hotel-bookings/:id", requireAuth, handle(controller.userBooking));
router.put("/user/hotel-bookings/:id/cancel", requireAuth, handle(controller.cancelRequest));

router.get("/vendor/hotel/dashboard", ...vendor, handle(controller.dashboard));
router.get("/vendor/hotels", ...vendor, handle(controller.vendorHotels));
router.post("/vendor/hotels", ...vendor, handle(controller.createHotel));
router.get("/vendor/hotels/:id", ...vendor, handle(controller.vendorHotel));
router.put("/vendor/hotels/:id", ...vendor, handle(controller.updateHotel));
router.delete("/vendor/hotels/:id", ...vendor, handle(controller.deleteHotel));
router.patch("/vendor/hotels/:id/status", ...vendor, handle(controller.hotelStatus));

router.get("/vendor/hotels/:hotelId/rooms", ...vendor, handle(controller.vendorRooms));
router.post("/vendor/hotels/:hotelId/rooms", ...vendor, handle(controller.createRoom));
router.put("/vendor/rooms/:roomId", ...vendor, handle(controller.updateRoom));
router.delete("/vendor/rooms/:roomId", ...vendor, handle(controller.deleteRoom));
router.patch("/vendor/rooms/:roomId/status", ...vendor, handle(controller.roomStatus));

router.get("/vendor/hotel/calendar", ...vendor, handle(controller.calendar));
router.put("/vendor/hotel/calendar/update", ...vendor, handle(controller.inventoryUpdate));
router.put("/vendor/hotel/rooms/block", ...vendor, handle(controller.blockRooms));
router.put("/vendor/hotel/rooms/unblock", ...vendor, handle(controller.unblockRooms));

router.get("/vendor/hotel/bookings", ...vendor, handle(controller.vendorBookings));
router.get("/vendor/hotel/bookings/:id", ...vendor, handle(controller.vendorBooking));
router.put("/vendor/hotel/bookings/:id/status", ...vendor, handle(controller.bookingStatusUpdate));
router.put("/vendor/hotel/bookings/:id/refund", ...vendor, handle(controller.refundBooking));
router.put("/vendor/hotel/bookings/:id/check-in", ...vendor, handle(controller.checkIn));

router.get("/vendor/hotel/reviews", ...vendor, handle(controller.reviews));
router.post("/vendor/hotel/reviews/:id/reply", ...vendor, handle(controller.replyReview));
router.get("/vendor/hotel/reports", ...vendor, handle(controller.reports));
router.get("/vendor/hotel/booking-trends", ...vendor, handle(controller.trends));
router.get("/vendor/hotel/coupons", ...vendor, handle(controller.coupons));
router.post("/vendor/hotel/coupons", ...vendor, handle(controller.saveCoupon));
router.put("/vendor/hotel/coupons/:id", ...vendor, handle(controller.saveCoupon));
router.delete("/vendor/hotel/coupons/:id", ...vendor, handle(controller.deleteCoupon));

module.exports = router;
