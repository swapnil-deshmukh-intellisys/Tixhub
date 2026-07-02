const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("Booking", {
  details: {},
  seats: [],
  status: "confirmed",
  paymentStatus: "paid",
  pnr: "",
  seatNumber: null,
  checkInStatus: "NOT_CHECKED_IN",
  boardingPassGenerated: false,
  qrData: null,
});
