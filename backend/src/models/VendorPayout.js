const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("VendorPayout", {
  totalRevenue: 0,
  platformCommission: 0,
  vendorPayableAmount: 0,
  settlementStatus: "pending",
});
