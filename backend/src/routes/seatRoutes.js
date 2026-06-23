const express = require("express");

const {
  getShowSeats,
  setMovieSeatAvailable,
  setMovieSeatBlocked,
} = require("../services/movieSeatService");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const contextFromRequest = (req) => {
  const body = req.body || {};
  return {
    showId: req.params.showId || body.showId,
    movieId: req.query.movieId || body.movieId,
    theatreId: req.query.theatreId || body.theatreId,
    theatre: req.query.theatre || body.theatre,
    screenId: req.query.screenId || body.screenId,
    showDate: req.query.showDate || body.showDate,
    showTime: req.query.showTime || body.showTime,
    totalSeats: req.query.totalSeats || body.totalSeats,
    regularSeats: req.query.regularSeats || body.regularSeats,
    primeSeats: req.query.primeSeats || body.primeSeats,
    vipSeats: req.query.vipSeats || body.vipSeats,
    blockedSeats: req.query.blockedSeats || body.blockedSeats,
    price: req.query.price || body.price,
    regularSeatPrice: req.query.regularSeatPrice || body.regularSeatPrice,
    premiumSeatPrice: req.query.premiumSeatPrice || body.premiumSeatPrice,
    vipSeatPrice: req.query.vipSeatPrice || body.vipSeatPrice,
  };
};

router.get("/seats/:showId", requireAuth, asyncHandler(async (req, res) => {
  const seats = await getShowSeats(contextFromRequest(req));
  res.json({ showId: req.params.showId, seats });
}));

router.patch("/seats/block", requireAuth, requireRole("admin", "vendor"), asyncHandler(async (req, res) => {
  const seat = await setMovieSeatBlocked(contextFromRequest(req), req.body.seatNo || req.body.seatNumber, req.user, req.body.blockedReason);
  res.json({ message: "Seat blocked", seat });
}));

router.patch("/seats/unblock", requireAuth, requireRole("admin", "vendor"), asyncHandler(async (req, res) => {
  const seat = await setMovieSeatAvailable(contextFromRequest(req), req.body.seatNo || req.body.seatNumber);
  res.json({ message: "Seat unblocked", seat });
}));

router.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({ message: error.message || "Seat update failed" });
});

module.exports = router;
