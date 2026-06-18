const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("VendorPricing", {
  morningPrice: 180,
  afternoonPrice: 220,
  eveningPrice: 260,
  weekendPrice: 320,
  premiumSeatPrice: 420,
  showOverrides: [],
  status: "active",
});
