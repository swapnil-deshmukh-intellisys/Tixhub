export const vendorSidebarConfig = {
  movie: [
    {
      title: "",
      items: [{ label: "Dashboard", path: "/vendor/dashboard", icon: "dashboard" }],
    },
    {
      title: "Movie Management",
      items: [
        { label: "Movies", path: "/vendor/movies", icon: "movie" },
        { label: "Theatres & Screens", path: "/vendor/theatres", icon: "screen" },
        { label: "Show Management", path: "/vendor/shows", icon: "calendar" },
        { label: "Seat Management", path: "/vendor/seat-management", icon: "seat" },
        { label: "Bookings", path: "/vendor/bookings", icon: "ticket" },
        { label: "Blocked Seats", path: "/vendor/blocked-seats", icon: "blocked" },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "Revenue", path: "/vendor/revenue", icon: "revenue" },
        { label: "Reports", path: "/vendor/reports", icon: "reports" },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Profile", path: "/vendor/profile", icon: "profile" },
        { label: "Settings", path: "/vendor/settings", icon: "settings" },
      ],
    },
  ],
  flight: [
    {
      title: "",
      items: [{ label: "Dashboard", path: "/vendor/dashboard", icon: "dashboard" }],
    },
    {
      title: "Flight Management",
      items: [
        { label: "Flights", path: "/vendor/flights", icon: "flight" },
        { label: "Seat Management", path: "/vendor/flight-seat-management", icon: "seat" },
        { label: "Bookings", path: "/vendor/flight-bookings", icon: "ticket" },
        { label: "Passengers", path: "/vendor/passengers", icon: "profile" },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "Revenue", path: "/vendor/flight-revenue", icon: "revenue" },
        { label: "Reports", path: "/vendor/flight-reports", icon: "reports" },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Profile", path: "/vendor/profile", icon: "profile" },
        { label: "Settings", path: "/vendor/settings", icon: "settings" },
      ],
    },
  ],
  bus: [
    {
      title: "",
      items: [{ label: "Dashboard", path: "/vendor/dashboard", icon: "dashboard" }],
    },
    {
      title: "Bus Management",
      items: [
        { label: "Buses", path: "/vendor/bus", icon: "bus" },
        { label: "Seat Management", path: "/vendor/bus-seat-management", icon: "seat" },
        { label: "Bookings", path: "/vendor/bookings", icon: "ticket" },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "Revenue", path: "/vendor/revenue", icon: "revenue" },
        { label: "Reports", path: "/vendor/reports", icon: "reports" },
      ],
    },
  ],
  train: [
    {
      title: "",
      items: [{ label: "Dashboard", path: "/vendor/dashboard", icon: "dashboard" }],
    },
    {
      title: "Train Management",
      items: [
        { label: "Trains", path: "/vendor/trains", icon: "train" },
        { label: "Seat Management", path: "/vendor/train-seat-management", icon: "seat" },
        { label: "Bookings", path: "/vendor/bookings", icon: "ticket" },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "Revenue", path: "/vendor/revenue", icon: "revenue" },
        { label: "Reports", path: "/vendor/reports", icon: "reports" },
      ],
    },
  ],
  hotel: [
    {
      title: "",
      items: [{ label: "Dashboard", path: "/vendor/dashboard", icon: "dashboard" }],
    },
    {
      title: "Hotel Management",
      items: [
        { label: "Hotels", path: "/vendor/hotels", icon: "hotel" },
        { label: "Rooms", path: "/vendor/rooms", icon: "screen" },
        { label: "Bookings", path: "/vendor/bookings", icon: "ticket" },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "Revenue", path: "/vendor/revenue", icon: "revenue" },
        { label: "Reports", path: "/vendor/reports", icon: "reports" },
      ],
    },
  ],
};

export const vendorServiceOptions = [
  { key: "movie", label: "Movies" },
  { key: "flight", label: "Flights" },
  { key: "events", label: "Events" },
  { key: "bus", label: "Buses" },
  { key: "train", label: "Trains" },
  { key: "hotel", label: "Hotels" },
];
