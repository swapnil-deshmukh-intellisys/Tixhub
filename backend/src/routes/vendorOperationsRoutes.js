const express = require("express");

const {
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
} = require("../controllers/vendorOperationsController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

router.use("/vendor", requireAuth, requireRole("admin", "vendor"));

router.get("/vendor/ticket-scans", asyncHandler(getTicketScanner));
router.post("/vendor/ticket-scans", asyncHandler(scanTicket));
router.get("/vendor/theatre-overview", asyncHandler(getTheatreOverview));
router.get("/vendor/show-analytics", asyncHandler(getShowAnalytics));
router.get("/vendor/pricing", asyncHandler(getPricing));
router.put("/vendor/pricing", asyncHandler(savePricing));
router.patch("/vendor/shows/:showId/price", asyncHandler(updateShowPrice));
router.get("/vendor/refunds", asyncHandler(getRefundRequests));
router.patch("/vendor/refunds/:id", asyncHandler(updateRefundStatus));
router.get("/vendor/payouts", asyncHandler(getPayoutHistory));
router.post("/vendor/payouts", asyncHandler(savePayout));
router.get("/vendor/staff", asyncHandler(getStaff));
router.post("/vendor/staff", asyncHandler(createStaff));
router.patch("/vendor/staff/:id", asyncHandler(updateStaff));
router.get("/vendor/notifications", asyncHandler(getNotifications));
router.post("/vendor/notifications", asyncHandler(createNotification));
router.get("/vendor/customer-list", asyncHandler(getCustomerList));
router.patch("/vendor/movies/:id/status", asyncHandler(updateMovieStatus));

router.use((error, req, res, next) => {
  console.error("[vendor-operations:error]", {
    method: req.method,
    url: req.originalUrl,
    message: error.message,
    name: error.name,
  });
  res.status(error.statusCode || 500).json({ message: error.message || "Vendor operation failed" });
});

module.exports = router;
