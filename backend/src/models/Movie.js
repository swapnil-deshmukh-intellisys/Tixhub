const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("Movie", {
  totalSeats: 120,
  bookedSeats: [],
  ticketPrice: 240,
  status: "draft",
  format: "2D",
  interestCount: "",
  trailerFileUrl: "",
  galleryImages: [],
  documents: [],
  seatLayout: [],
  regularSeatPrice: 240,
  premiumSeatPrice: 0,
  vipSeatPrice: 0,
  averageRating: 0,
  totalReviews: 0,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  isOfferApplicable: false,
  offers: [],
  castMembers: [],
  crewMembers: [],
});
