const express = require("express");

const {
  createVendorListing,
  createVendorFlight,
  createVendorMovie,
  deleteVendorFlight,
  deleteVendorListing,
  deleteVendorMovie,
  blockVendorFlightSeat,
  createScreen,
  createShow,
  createTheatre,
  deleteTheatre,
  getVendorBookings,
  getVendorFlight,
  getVendorFlightBookings,
  getVendorFlightDashboardStats,
  getVendorFlightRevenue,
  getVendorFlights,
  getVendorFlightSeatDetails,
  getVendorFlightSeats,
  getVendorListings,
  getVendorMovieDashboard,
  getVendorMovieDetails,
  getVendorMovies,
  getVendorDashboard,
  getVendorProfile,
  getVendorReports,
  getVendorPassengers,
  addMovieSeat,
  blockMovieSeat,
  getPaymentDetails,
  getMovieSeats,
  getScreens,
  getSettlements,
  getShows,
  getShowSeats,
  getTheatres,
  getVendorAvailability,
  getVendorCustomers,
  savePaymentDetails,
  removeMovieSeat,
  setSeatBlock,
  unsetSeatBlock,
  unblockMovieSeat,
  unblockVendorFlightSeat,
  updateTheatre,
  updateVendorFlight,
  updateVendorListing,
  updateVendorMovie,
} = require("../controllers/vendorListingController");

const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const vendorPaths = [
  "/vendor-listings",
  "/vendor-bookings",
  "/vendor-reports",
  "/vendor",
];

router.use(vendorPaths, (req, res, next) => {
  console.log(`[vendor-listings:route] ${req.method} ${req.originalUrl}`);
  next();
});

router.use(vendorPaths, requireAuth, requireRole("admin", "vendor"));

/* =========================
   BUS DASHBOARD ROUTES
========================= */

router.get("/vendor/dashboard/stats", asyncHandler(getVendorReports));

router.get("/vendor/bookings/trends", (req, res) => {
  const { range = "week" } = req.query;

  let data = [];

  if (range === "day") {
    data = [
      { name: "6 AM", bookings: 8, revenue: 4000 },
      { name: "9 AM", bookings: 12, revenue: 7000 },
      { name: "12 PM", bookings: 18, revenue: 11000 },
      { name: "3 PM", bookings: 22, revenue: 14500 },
      { name: "6 PM", bookings: 30, revenue: 21000 },
    ];
  } else if (range === "week") {
    data = [
      { name: "Mon", bookings: 12, revenue: 8500 },
      { name: "Tue", bookings: 18, revenue: 13200 },
      { name: "Wed", bookings: 25, revenue: 19000 },
      { name: "Thu", bookings: 16, revenue: 12000 },
      { name: "Fri", bookings: 30, revenue: 24500 },
      { name: "Sat", bookings: 38, revenue: 31000 },
      { name: "Sun", bookings: 42, revenue: 35500 },
    ];
  } else if (range === "month") {
    data = [
      { name: "Week 1", bookings: 120, revenue: 95000 },
      { name: "Week 2", bookings: 180, revenue: 140000 },
      { name: "Week 3", bookings: 220, revenue: 170000 },
      { name: "Week 4", bookings: 260, revenue: 210000 },
    ];
  } else if (range === "year") {
    data = [
      { name: "Jan", bookings: 950, revenue: 780000 },
      { name: "Feb", bookings: 820, revenue: 690000 },
      { name: "Mar", bookings: 1100, revenue: 920000 },
      { name: "Apr", bookings: 980, revenue: 810000 },
      { name: "May", bookings: 1200, revenue: 980000 },
      { name: "Jun", bookings: 1320, revenue: 1100000 },
    ];
  }

  res.json(data);
});

/* =========================
   VENDOR LISTINGS
========================= */

router.get("/vendor-listings", asyncHandler(getVendorListings));
router.post("/vendor-listings", asyncHandler(createVendorListing));
router.put("/vendor-listings/:id", asyncHandler(updateVendorListing));
router.delete("/vendor-listings/:id", asyncHandler(deleteVendorListing));

/* =========================
   VENDOR MAIN
========================= */

router.get("/vendor/dashboard", asyncHandler(getVendorDashboard));
router.get("/vendor/dashboard-stats", asyncHandler(getVendorReports));
router.get("/vendor/profile", asyncHandler(getVendorProfile));

/* =========================
   MOVIE VENDOR
========================= */

router.get("/vendor/movies", asyncHandler(getVendorMovies));
router.post("/vendor/movies", asyncHandler(createVendorMovie));
router.get("/vendor/movies/dashboard/summary", asyncHandler(getVendorMovieDashboard));
router.get("/vendor/movies/:id/details", asyncHandler(getVendorMovieDetails));
router.put("/vendor/movies/:id", asyncHandler(updateVendorMovie));
router.delete("/vendor/movies/:id", asyncHandler(deleteVendorMovie));

router.get("/vendor/movies/:movieId/seats", asyncHandler(getMovieSeats));
router.post("/vendor/movies/:movieId/seats", asyncHandler(addMovieSeat));
router.patch("/vendor/movies/:movieId/seats/:seatNumber/block", asyncHandler(blockMovieSeat));
router.patch("/vendor/movies/:movieId/seats/:seatNumber/unblock", asyncHandler(unblockMovieSeat));
router.delete("/vendor/movies/:movieId/seats/:seatNumber", asyncHandler(removeMovieSeat));

/* =========================
   FLIGHT VENDOR
========================= */

router.get("/vendor/flights", asyncHandler(getVendorFlights));
router.post("/vendor/flights", asyncHandler(createVendorFlight));
router.get("/vendor/flights/:id", asyncHandler(getVendorFlight));
router.put("/vendor/flights/:id", asyncHandler(updateVendorFlight));
router.delete("/vendor/flights/:id", asyncHandler(deleteVendorFlight));

router.get("/vendor/flights/:flightId/seats", asyncHandler(getVendorFlightSeats));
router.patch("/vendor/flights/:flightId/seats/:seatNumber/block", asyncHandler(blockVendorFlightSeat));
router.patch("/vendor/flights/:flightId/seats/:seatNumber/unblock", asyncHandler(unblockVendorFlightSeat));
router.get("/vendor/flights/:flightId/seats/:seatNumber/details", asyncHandler(getVendorFlightSeatDetails));

router.get("/vendor/flight-bookings", asyncHandler(getVendorFlightBookings));
router.get("/vendor/flight-revenue", asyncHandler(getVendorFlightRevenue));
router.get("/vendor/flight-dashboard-stats", asyncHandler(getVendorFlightDashboardStats));

/* =========================
   THEATRE / SCREEN / SHOW
========================= */

router.post("/vendor/theatres", asyncHandler(createTheatre));
router.get("/vendor/theatres", asyncHandler(getTheatres));
router.put("/vendor/theatres/:id", asyncHandler(updateTheatre));
router.delete("/vendor/theatres/:id", asyncHandler(deleteTheatre));

router.post("/vendor/screens", asyncHandler(createScreen));
router.get("/vendor/screens", asyncHandler(getScreens));

router.post("/vendor/shows", asyncHandler(createShow));
router.get("/vendor/shows", asyncHandler(getShows));
router.get("/vendor/shows/:showId/seats", asyncHandler(getShowSeats));

router.patch(
  "/vendor/shows/:showId/seats/:seatNumber/block",
  asyncHandler((req, res) => setSeatBlock(req, res, "show"))
);

router.patch(
  "/vendor/shows/:showId/seats/:seatNumber/unblock",
  asyncHandler((req, res) => unsetSeatBlock(req, res, "show"))
);

/* =========================
   BOOKINGS / REPORTS
========================= */

router.get("/vendor/bookings", asyncHandler(getVendorBookings));
router.get("/vendor/passengers", asyncHandler(getVendorPassengers));
router.get("/vendor/customers", asyncHandler(getVendorCustomers));
router.get("/vendor/revenue", asyncHandler(getVendorReports));
router.get("/vendor/availability", asyncHandler(getVendorAvailability));
router.get("/vendor/settlements", asyncHandler(getSettlements));

router.get("/vendor/payment-details", asyncHandler(getPaymentDetails));
router.post("/vendor/payment-details", asyncHandler(savePaymentDetails));
router.put("/vendor/payment-details", asyncHandler(savePaymentDetails));

router.get("/vendor-bookings", asyncHandler(getVendorBookings));
router.get("/vendor-reports", asyncHandler(getVendorReports));

/* =========================
   ERROR HANDLER
========================= */

router.use((error, req, res, next) => {
  console.error("[vendor-listings:error]", {
    method: req.method,
    url: req.originalUrl,
    message: error.message,
    name: error.name,
  });

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(", "),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  res.status(500).json({
    message: error.message || "Unable to save listing",
  });
});

module.exports = router;