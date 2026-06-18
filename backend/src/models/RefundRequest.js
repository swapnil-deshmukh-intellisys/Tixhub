const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("RefundRequest", {
  reason: "Customer cancellation request",
  refundStatus: "pending",
  amount: 0,
});
