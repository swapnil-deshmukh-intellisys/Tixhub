const express = require("express");
const controller = require("../controllers/eventController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const router = express.Router();
const handle = (fn) => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const vendor = [requireAuth, requireRole("vendor","admin")];

router.get("/events", handle(controller.publicEvents));
router.get("/events/:id", handle(controller.publicEvent));
router.get("/events/:id/seats", handle(controller.eventSeats));
router.post("/event-bookings/quote", requireAuth, handle(controller.quoteBooking));
router.post("/event-bookings", requireAuth, handle(controller.createBooking));
router.get("/user/event-bookings/:id", requireAuth, handle(controller.userBooking));

router.post("/vendor/events", ...vendor, handle(controller.createEvent));
router.get("/vendor/events/dashboard/stats", ...vendor, handle(controller.dashboard));
router.get("/vendor/events/revenue", ...vendor, handle(controller.revenue));
router.get("/vendor/events/calendar", ...vendor, handle(controller.calendar));
router.get("/vendor/events/bookings", ...vendor, handle(controller.bookings));
router.get("/vendor/events/notifications", ...vendor, handle(controller.notifications));
router.patch("/vendor/events/bookings/:id/status", ...vendor, handle(controller.bookingStatus));
router.post("/vendor/events/notes", ...vendor, handle(controller.saveNote));
router.get("/vendor/events/notes", ...vendor, handle(controller.notes));
router.put("/vendor/events/notes/:id", ...vendor, handle(controller.updateNote));
router.delete("/vendor/events/notes/:id", ...vendor, handle(controller.deleteNote));
router.get("/vendor/events", ...vendor, handle(controller.vendorEvents));
router.get("/vendor/events/:id", ...vendor, handle(controller.vendorEvent));
router.post("/vendor/events/:id/duplicate", ...vendor, handle(controller.duplicateEvent));
router.put("/vendor/events/:id", ...vendor, handle(controller.updateEvent));
router.delete("/vendor/events/:id", ...vendor, handle(controller.deleteEvent));
router.patch("/vendor/events/:id/hide", ...vendor, handle(controller.hideEvent));
router.patch("/vendor/events/:id/show", ...vendor, handle(controller.showEvent));

module.exports = router;
