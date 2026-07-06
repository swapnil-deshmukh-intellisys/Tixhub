const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config();
require("./src/config/db");

const movieRoutes = require("./src/routes/movieRoutes");
const authRoutes = require("./src/routes/auth");
const bookingRoutes = require("./src/routes/bookingRoutes");
const walletRoutes = require("./src/routes/walletRoutes");
const catalogRoutes = require("./src/routes/catalogRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const flightRoutes = require("./src/routes/flightRoutes");
const vendorListingRoutes = require("./src/routes/vendorListingRoutes");
const vendorOperationsRoutes = require("./src/routes/vendorOperationsRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const seatRoutes = require("./src/routes/seatRoutes");
const vendorServiceModuleRoutes = require("./src/routes/vendorServiceModuleRoutes");
const hotelRoutes = require("./src/routes/hotelRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const { setIo } = require("./src/socket");

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

setIo(io);

io.on("connection", (socket) => {
  socket.on("joinShow", (showId) => {
    if (showId) socket.join(String(showId));
  });

  socket.on("joinVendor", (vendorId) => {
    if (vendorId) socket.join(`vendor:${vendorId}`);
  });
});

app.use(cors());
app.use(express.json({ limit: "75mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "TixHub API",
    database: "mysql",
  });
});

/* =====================================================
   TEMP DASHBOARD ROUTES
   KEEP THESE ABOVE app.use("/api", ...)
===================================================== */

app.get("/api/vendor/dashboard/stats", (req, res) => {
  res.json({
    totalBuses: 24,
    activeBuses: 20,
    todayTrips: 45,
    totalRoutes: 18,
    totalBookings: 425,
    todayBookings: 58,
    revenue: 158000,
    occupancyRate: 84,
    availableSeats: 620,
    bookedSeats: 310,
    blockedSeats: 18,
    cancelledBookings: 5,
  });
});

app.get("/api/vendor/bookings/trends", (req, res) => {
  const { range } = req.query;

  let data = [];

  switch (range) {
    case "day":
      data = [
        { name: "6 AM", bookings: 8, revenue: 4000 },
        { name: "9 AM", bookings: 12, revenue: 7000 },
        { name: "12 PM", bookings: 18, revenue: 11000 },
        { name: "3 PM", bookings: 22, revenue: 14500 },
        { name: "6 PM", bookings: 30, revenue: 21000 },
      ];
      break;

    case "week":
      data = [
        { name: "Mon", bookings: 12, revenue: 8500 },
        { name: "Tue", bookings: 18, revenue: 13200 },
        { name: "Wed", bookings: 25, revenue: 19000 },
        { name: "Thu", bookings: 16, revenue: 12000 },
        { name: "Fri", bookings: 30, revenue: 24500 },
        { name: "Sat", bookings: 38, revenue: 31000 },
        { name: "Sun", bookings: 42, revenue: 35500 },
      ];
      break;

    case "month":
      data = [
        { name: "Week 1", bookings: 120, revenue: 95000 },
        { name: "Week 2", bookings: 180, revenue: 140000 },
        { name: "Week 3", bookings: 220, revenue: 170000 },
        { name: "Week 4", bookings: 260, revenue: 210000 },
      ];
      break;

    case "year":
      data = [
        { name: "Jan", bookings: 950, revenue: 780000 },
        { name: "Feb", bookings: 820, revenue: 690000 },
        { name: "Mar", bookings: 1100, revenue: 920000 },
        { name: "Apr", bookings: 980, revenue: 810000 },
        { name: "May", bookings: 1200, revenue: 980000 },
        { name: "Jun", bookings: 1320, revenue: 1100000 },
      ];
      break;

    default:
      data = [];
  }

  res.json(data);
});

/* =====================================================
   ACTUAL ROUTES
===================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", movieRoutes);
app.use("/api", hotelRoutes);
app.use("/api", eventRoutes);
app.use("/api", catalogRoutes);
app.use("/api", flightRoutes);
app.use("/api", bookingRoutes);
app.use("/api", walletRoutes);
app.use("/api", seatRoutes);
app.use("/api", vendorOperationsRoutes);
app.use("/api", vendorListingRoutes);
app.use("/api", vendorServiceModuleRoutes);
app.use("/api", paymentRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({ message: error.message || "Internal server error" });
});

console.log("Vendor listing routes mounted at /api/vendor-listings");

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
