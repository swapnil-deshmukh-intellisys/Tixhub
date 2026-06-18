const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("Screen", {
  rows: 10,
  seatsPerRow: 12,
  screenType: "2D",
  status: "active",
});
