const express = require("express");
const controller = require("../controllers/vendorServiceModuleController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();
const asyncHandler = (handler) => async (req, res, next) => { try { await handler(req, res, next); } catch (error) { next(error); } };

router.use("/vendor", requireAuth, requireRole("admin", "vendor"));

Object.keys(controller.modules).forEach((service) => {
  router.get(`/vendor/${service}/bookings`, asyncHandler(controller.bookings(service)));
  router.get(`/vendor/${service}`, asyncHandler(controller.list(service)));
  router.post(`/vendor/${service}`, asyncHandler(controller.create(service)));
  router.get(`/vendor/${service}/:id`, asyncHandler(controller.getOne(service)));
  router.put(`/vendor/${service}/:id`, asyncHandler(controller.update(service)));
  router.delete(`/vendor/${service}/:id`, asyncHandler(controller.remove(service)));
});

module.exports = router;
