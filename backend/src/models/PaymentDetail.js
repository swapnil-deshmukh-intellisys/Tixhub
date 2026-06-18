const createInMemoryModel = require("./inMemoryModel");

module.exports = createInMemoryModel("PaymentDetail", {
  settlementPreference: "Weekly",
});
