const express = require("express");

const router = express.Router();

const Movie =
require("../models/Movie");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { emitVendorUpdated } = require("../socket");
const { pool } = require("../config/db");

const validateMoviePayload = (body) => {
  const requiredFields = [
    ["title", "Movie title"],
    ["language", "Language"],
    ["duration", "Duration"],
    ["image", "Poster URL"],
    ["theatre", "Theatre"],
    ["genre", "Genre"],
    ["releaseDate", "Release date"],
  ];

  for (const [field, label] of requiredFields) {
    if (!String(body[field] || "").trim()) return `${label} is required`;
  }

  if (Number(body.ticketPrice) <= 0) return "Ticket price must be greater than 0";
  if (Number(body.totalSeats) <= 0) return "Total seats must be greater than 0";

  return "";
};

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeMoviePayload = (body) => {
  const totalSeats = numberValue(body.totalSeats);
  const vipSeats = Math.min(numberValue(body.vipSeats), totalSeats);
  const primeSeats = Math.min(numberValue(body.primeSeats), Math.max(totalSeats - vipSeats, 0));
  return {
    ...body,
    totalSeats,
    vipSeats,
    primeSeats,
    regularSeats: Math.max(totalSeats - vipSeats - primeSeats, 0),
    blockedSeats: numberValue(body.blockedSeats),
    regularSeatPrice: numberValue(body.regularSeatPrice || body.ticketPrice),
    primeSeatPrice: numberValue(body.primeSeatPrice || body.premiumSeatPrice),
    premiumSeatPrice: numberValue(body.premiumSeatPrice || body.primeSeatPrice),
    vipSeatPrice: numberValue(body.vipSeatPrice),
  };
};

/* GET MOVIES */

router.get(
  "/movies",

  async (req, res) => {

    try {

      const movies =
      await Movie.find({
        status: { $nin: ["ended", "cancelled", "hidden"] },
      });

      res.json(movies);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

/* GET MOVIE BY ID */

router.get(
  "/movies/:id",

  async (req, res) => {

    try {

      const movie =
      await Movie.findById(req.params.id);

      if (!movie) {
        return res.status(404).json({
          message:"Movie not found",
        });
      }

      res.json(movie);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

router.post("/movies/:id/reviews", requireAuth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = {
      id: `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}`.slice(0, 24),
      bookingId: req.body.bookingId || "",
      userId: req.user.id,
      movieId: movie._id,
      vendorId: movie.vendorId || movie.vendor,
      rating,
      review: req.body.review || req.body.comment || "",
    };
    await pool.query(
      `INSERT INTO movie_reviews (id, booking_id, user_id, movie_id, vendor_id, rating, review, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
      [review.id, review.bookingId, review.userId, review.movieId, review.vendorId, review.rating, review.review]
    );

    const [reviews] = await pool.query("SELECT * FROM movie_reviews WHERE movie_id = ? AND status = 'published'", [movie._id]);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((item) => {
      const key = Math.max(1, Math.min(5, Math.round(Number(item.rating || 0))));
      distribution[key] += 1;
    });
    const averageRating = reviews.length
      ? Number((reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1))
      : 0;

    const updatedMovie = await Movie.findByIdAndUpdate(movie._id, {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
      rating: averageRating ? `${averageRating}/5` : "",
    }, { new: true });

    emitVendorUpdated(movie.vendorId || movie.vendor, "movieRatingUpdated", { movie: updatedMovie, review });
    res.status(201).json({ message: "Review submitted", review, movie: updatedMovie });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ADD */

router.post(
  "/add-movie",
  requireAuth,
  requireRole("admin", "vendor"),

  async (req, res) => {

    try {
      const payload = normalizeMoviePayload(req.body);
      const validationMessage = validateMoviePayload(payload);
      if (validationMessage) return res.status(400).json({ message: validationMessage });

      const movie =
      new Movie({
        ...payload,
        vendor: req.user.id,
        vendorId: req.user.id,
      });

      await movie.save();

      res.json(movie);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

/* UPDATE */

router.put(
  "/edit-movie/:id",
  requireAuth,
  requireRole("admin", "vendor"),

  async (req, res) => {

    try {
      const payload = normalizeMoviePayload(req.body);
      const validationMessage = validateMoviePayload(payload);
      if (validationMessage) return res.status(400).json({ message: validationMessage });

      const updatedMovie =
      await Movie.findOneAndUpdate(

        {
          _id: req.params.id,
          ...(req.user.role === "admin" ? {} : { $or: [{ vendor: req.user.id }, { vendorId: req.user.id }] }),
        },

        payload,

        { new:true }

      );

      res.json(updatedMovie);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

/* DELETE */

router.delete(
  "/delete-movie/:id",
  requireAuth,
  requireRole("admin", "vendor"),

  async (req, res) => {

    try {

      await Movie.findOneAndDelete({
        _id: req.params.id,
        ...(req.user.role === "admin" ? {} : { $or: [{ vendor: req.user.id }, { vendorId: req.user.id }] }),
      });

      res.json({
        success:true,
      });

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

module.exports = router;
