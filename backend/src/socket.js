let io = null;

const setIo = (instance) => {
  io = instance;
};

const getIo = () => io;

const emitSeatUpdated = (seat) => {
  if (!io || !seat?.showId) return;
  io.to(String(seat.showId)).emit("seatUpdated", seat);
};

const emitVendorUpdated = (vendorId, eventName, payload) => {
  if (!io) return;
  const event = eventName || "vendorUpdated";
  if (vendorId) io.to(`vendor:${vendorId}`).emit(event, payload);
  io.emit("vendorDashboardUpdated", { event, payload });
};

module.exports = {
  emitSeatUpdated,
  emitVendorUpdated,
  getIo,
  setIo,
};
