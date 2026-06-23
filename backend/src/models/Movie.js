const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("Movie", {
  /* BASIC MOVIE INFO */
  title: "",
  language: "Hindi",
  genre: "Action",
  duration: "",
  certificate: "U-A",
  releaseDate: "",
  status: "draft",
  format: "2D",

  /* MEDIA */
  image: "",
  posterUrl: "",
  bannerUrl: "",
  trailerUrl: "",
  trailerFileUrl: "",
  galleryImages: [],
  uploads: {
    poster: null,
    banner: null,
    gallery: [],
    trailer: null,
    documents: [],
  },

  /* STORY */
  description: "",
  aboutMovie: "",
  hero: "",
  cast: "",
  director: "",

  /* THEATRE DETAILS */
  theatre: "",
  city: "",
  location: "",
  address: "",

  /* MULTIPLE SCREEN LOGIC */
  screens: [
    {
      screenName: "Screen 1",
      screenType: "2D",
      totalSeats: 400,
      regularSeats: 200,
      primeSeats: 100,
      vipSeats: 100,
    },
  ],

  selectedScreenIndex: 0,
  screenName: "Screen 1",

  /* SHOW DETAILS */
  showDate: "",
  showTime: "",
  endTime: "",
  interestCount: "",

  /* SEAT DETAILS */
  totalSeats: 400,
  regularSeats: 200,
  primeSeats: 100,
  vipSeats: 100,

  bookedSeats: [],
  blockedSeats: [],

  ticketPrice: 150,
  regularSeatPrice: 150,
  primeSeatPrice: 250,
  premiumSeatPrice: 250,
  vipSeatPrice: 400,

  seatLayout: {
    totalSeats: 400,
    regularSeats: 200,
    primeSeats: 100,
    vipSeats: 100,
    bookedSeats: [],
    blockedSeats: [],
    seats: [],
  },

  /* REVIEWS */
  averageRating: 0,
  totalReviews: 0,
  ratingDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },

  /* OFFERS */
  isOfferApplicable: false,
  offers: [],

  /* CAST & CREW */
  castMembers: [],
  crewMembers: [],

  /* DOCUMENTS */
  documents: [],

  /* VENDOR / ADMIN */
  vendor: "",
  vendorId: "",
  isApproved: false,
  isHidden: false,
  adminStatus: "pending",
});