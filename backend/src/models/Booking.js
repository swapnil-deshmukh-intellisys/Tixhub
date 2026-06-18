const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("Booking", {
  details: {},
  seats: [],
  status: "confirmed",
  paymentStatus: "paid",
});
