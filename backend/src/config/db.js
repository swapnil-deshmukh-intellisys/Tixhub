const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Password@123",
  database: "priyanka",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const ensureColumn = async (connection, table, columns, name, definition) => {
  if (!columns.has(name)) {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
};

const movieStatusDefinition = "ENUM('draft','upcoming','booking_open','now_showing','house_full','ended','cancelled','active','inactive','hidden') NOT NULL DEFAULT 'draft'";

const runSqlFile = async (connection, filePath) => {
  if (!fs.existsSync(filePath)) return;
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await connection.query(statement);
  }
};

const ensureUsersSchema = async (connection) => {
  const [columns] = await connection.query("SHOW COLUMNS FROM users");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  const idColumn = columnMap.get("id");

  if (idColumn && /int/i.test(idColumn.Type)) {
    await connection.query("ALTER TABLE users MODIFY id VARCHAR(24) NOT NULL");
  }

  await ensureColumn(connection, "users", columnMap, "status", "ENUM('active', 'blocked', 'pending') NOT NULL DEFAULT 'active'");
  await ensureColumn(connection, "users", columnMap, "image", "TEXT NULL");
  await ensureColumn(connection, "users", columnMap, "reset_password_token", "VARCHAR(255) NULL");
  await ensureColumn(connection, "users", columnMap, "reset_password_expires", "DATETIME NULL");
  await ensureColumn(connection, "users", columnMap, "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
};

const ensureMoviesSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      vendor VARCHAR(24) NULL,
      title VARCHAR(255) NOT NULL,
      language VARCHAR(255) NOT NULL,
      duration VARCHAR(80) NOT NULL,
      image TEXT NOT NULL,
      poster_url TEXT NULL,
      banner_url TEXT NULL,
      description TEXT NULL,
      theatre VARCHAR(255) NOT NULL,
      theatre_name VARCHAR(255) NULL,
      theatre_city VARCHAR(255) NULL,
      theatre_address TEXT NULL,
      screen_number VARCHAR(80) NULL,
      show_date VARCHAR(80) NULL,
      show_time VARCHAR(80) NULL,
      show_times JSON NULL,
      total_seats INT NOT NULL DEFAULT 120,
      regular_seats INT NOT NULL DEFAULT 0,
      prime_seats INT NOT NULL DEFAULT 0,
      vip_seats INT NOT NULL DEFAULT 0,
      blocked_seats INT NOT NULL DEFAULT 0,
      blocked_regular_seats INT NOT NULL DEFAULT 0,
      blocked_prime_seats INT NOT NULL DEFAULT 0,
      blocked_vip_seats INT NOT NULL DEFAULT 0,
      booked_seats JSON NULL,
      ticket_price DECIMAL(10,2) NOT NULL DEFAULT 240,
      status ENUM('draft','upcoming','booking_open','now_showing','house_full','ended','cancelled','active','inactive','hidden') NOT NULL DEFAULT 'draft',
      genre VARCHAR(255) NOT NULL,
      cast TEXT NULL,
      director VARCHAR(255) NULL,
      release_date VARCHAR(80) NOT NULL,
      rating VARCHAR(80) NULL,
      hero VARCHAR(255) NULL,
      certificate VARCHAR(80) NULL,
      format VARCHAR(120) NOT NULL DEFAULT '2D',
      trailer_url TEXT NULL,
      trailer_file_url TEXT NULL,
      gallery_images JSON NULL,
      documents JSON NULL,
      interest_count VARCHAR(120) NULL,
      about_movie TEXT NULL,
      screen_name VARCHAR(120) NULL,
      city VARCHAR(150) NULL,
      location TEXT NULL,
      end_time VARCHAR(80) NULL,
      seat_layout JSON NULL,
      regular_seat_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      premium_seat_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      vip_seat_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
      total_reviews INT NOT NULL DEFAULT 0,
      rating_distribution JSON NULL,
      is_offer_applicable BOOLEAN NOT NULL DEFAULT FALSE,
      offers JSON NULL,
      cast_members JSON NULL,
      crew_members JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_movies_vendor_id (vendor_id),
      INDEX idx_movies_status (status)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM movies");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));

  await ensureColumn(connection, "movies", columnMap, "vendor_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "movies", columnMap, "vendor", "VARCHAR(24) NULL");
  await ensureColumn(connection, "movies", columnMap, "poster_url", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "banner_url", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "theatre_name", "VARCHAR(255) NULL");
  await ensureColumn(connection, "movies", columnMap, "theatre_city", "VARCHAR(255) NULL");
  await ensureColumn(connection, "movies", columnMap, "theatre_address", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "screen_number", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movies", columnMap, "show_date", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movies", columnMap, "show_time", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movies", columnMap, "show_times", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "total_seats", "INT NOT NULL DEFAULT 120");
  await ensureColumn(connection, "movies", columnMap, "regular_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "prime_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "vip_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "blocked_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "blocked_regular_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "blocked_prime_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "blocked_vip_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "booked_seats", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "ticket_price", "DECIMAL(10,2) NOT NULL DEFAULT 240");
  await connection.query(`ALTER TABLE movies MODIFY status ${movieStatusDefinition}`);
  await ensureColumn(connection, "movies", columnMap, "trailer_url", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "trailer_file_url", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "gallery_images", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "documents", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "interest_count", "VARCHAR(120) NULL");
  await ensureColumn(connection, "movies", columnMap, "about_movie", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "screen_name", "VARCHAR(120) NULL");
  await ensureColumn(connection, "movies", columnMap, "city", "VARCHAR(150) NULL");
  await ensureColumn(connection, "movies", columnMap, "location", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "end_time", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movies", columnMap, "seat_layout", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "regular_seat_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "premium_seat_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "vip_seat_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "average_rating", "DECIMAL(3,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "total_reviews", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "rating_distribution", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "is_offer_applicable", "BOOLEAN NOT NULL DEFAULT FALSE");
  await ensureColumn(connection, "movies", columnMap, "offers", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "cast_members", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "crew_members", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn(connection, "movies", columnMap, "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
};

const migrateMovieRecords = async (connection) => {
  const [rows] = await connection.query("SELECT id, data, created_at, updated_at FROM app_records WHERE model = 'Movie'");
  for (const row of rows) {
    const movie = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    const title = String(movie.title || "").trim();
    const language = String(movie.language || "").trim();
    const duration = String(movie.duration || "").trim();
    const image = String(movie.image || "").trim();
    const theatre = String(movie.theatre || "").trim();
    const genre = String(movie.genre || "").trim();
    const releaseDate = String(movie.releaseDate || movie.release_date || "").trim();

    if (!title || !language || !duration || !image || !theatre || !genre || !releaseDate) continue;

    await connection.query(
      `INSERT IGNORE INTO movies (
        id, vendor_id, vendor, title, language, duration, image, poster_url, banner_url,
        description, theatre, theatre_name, theatre_city, theatre_address, screen_number,
        show_date, show_time, show_times, total_seats, booked_seats, ticket_price, status,
        genre, cast, director, release_date, rating, hero, certificate, format, trailer_url,
        interest_count, about_movie, is_offer_applicable, offers, cast_members, crew_members,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movie._id || row.id,
        movie.vendorId || movie.vendor || null,
        movie.vendor || movie.vendorId || null,
        title,
        language,
        duration,
        image,
        movie.posterUrl || null,
        movie.bannerUrl || null,
        movie.description || "",
        theatre,
        movie.theatreName || null,
        movie.theatreCity || null,
        movie.theatreAddress || null,
        movie.screenNumber || null,
        movie.showDate || null,
        movie.showTime || null,
        JSON.stringify(movie.showTimes || []),
        Number(movie.totalSeats || 120),
        JSON.stringify(movie.bookedSeats || []),
        Number(movie.ticketPrice || 240),
        movie.status || "active",
        genre,
        movie.cast || "",
        movie.director || "",
        releaseDate,
        movie.rating || "",
        movie.hero || "",
        movie.certificate || "",
        movie.format || "2D",
        movie.trailerUrl || "",
        movie.interestCount || "",
        movie.aboutMovie || "",
        Boolean(movie.isOfferApplicable),
        JSON.stringify(movie.offers || []),
        JSON.stringify(movie.castMembers || []),
        JSON.stringify(movie.crewMembers || []),
        movie.createdAt || row.created_at,
        movie.updatedAt || row.updated_at,
      ]
    );
  }
};

const ensureFlightsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS flights (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      airline_name VARCHAR(255) NOT NULL,
      flight_name VARCHAR(255) NULL,
      airline_logo TEXT NULL,
      flight_banner TEXT NULL,
      flight_thumbnail TEXT NULL,
      flight_gallery JSON NULL,
      flight_number VARCHAR(80) NOT NULL,
      flight_type VARCHAR(80) NOT NULL DEFAULT 'domestic',
      from_city VARCHAR(150) NOT NULL,
      from_airport VARCHAR(255) NOT NULL,
      from_code VARCHAR(20) NOT NULL,
      to_city VARCHAR(150) NOT NULL,
      to_airport VARCHAR(255) NOT NULL,
      to_code VARCHAR(20) NOT NULL,
      departure_date VARCHAR(80) NOT NULL,
      departure_time VARCHAR(80) NOT NULL,
      arrival_date VARCHAR(80) NULL,
      arrival_time VARCHAR(80) NOT NULL,
      duration VARCHAR(80) NOT NULL,
      aircraft VARCHAR(120) NOT NULL DEFAULT 'A320',
      class_type VARCHAR(120) NOT NULL DEFAULT 'Economy',
      total_seats INT NOT NULL DEFAULT 0,
      available_seats INT NOT NULL DEFAULT 0,
      booked_seats INT NOT NULL DEFAULT 0,
      blocked_seats INT NOT NULL DEFAULT 0,
      base_fare DECIMAL(10,2) NOT NULL DEFAULT 0,
      taxes DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      cabin_baggage VARCHAR(255) NULL,
      checkin_baggage VARCHAR(255) NULL,
      refundable BOOLEAN NOT NULL DEFAULT FALSE,
      meal_included BOOLEAN NOT NULL DEFAULT FALSE,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      seats JSON NULL,
      seat_selection_mode ENUM('DURING_BOOKING','AFTER_BOOKING','CHECK_IN','AUTO_ASSIGN') NOT NULL DEFAULT 'CHECK_IN',
      check_in_open_hours_before INT NOT NULL DEFAULT 24,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_flights_vendor_id (vendor_id),
      INDEX idx_flights_status (status),
      INDEX idx_flights_route (from_code, to_code)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM flights");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "flights", columnMap, "vendor_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "flights", columnMap, "airline_logo", "TEXT NULL");
  await ensureColumn(connection, "flights", columnMap, "flight_banner", "TEXT NULL");
  await ensureColumn(connection, "flights", columnMap, "flight_thumbnail", "TEXT NULL");
  await ensureColumn(connection, "flights", columnMap, "flight_gallery", "JSON NULL");
  await ensureColumn(connection, "flights", columnMap, "flight_name", "VARCHAR(255) NULL");
  await ensureColumn(connection, "flights", columnMap, "booked_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "flights", columnMap, "blocked_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "flights", columnMap, "seats", "JSON NULL");
  await ensureColumn(connection, "flights", columnMap, "seat_selection_mode", "ENUM('DURING_BOOKING','AFTER_BOOKING','CHECK_IN','AUTO_ASSIGN') NOT NULL DEFAULT 'CHECK_IN'");
  await ensureColumn(connection, "flights", columnMap, "check_in_open_hours_before", "INT NOT NULL DEFAULT 24");
};

const ensureBookingsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_code VARCHAR(80) NOT NULL UNIQUE,
      user_id VARCHAR(24) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      module VARCHAR(80) NOT NULL,
      title VARCHAR(255) NOT NULL,
      movie_id VARCHAR(24) NULL,
      show_id VARCHAR(24) NULL,
      flight_id VARCHAR(24) NULL,
      customer_name VARCHAR(150) NULL,
      customer_email VARCHAR(190) NULL,
      customer_mobile VARCHAR(30) NULL,
      theatre VARCHAR(255) NULL,
      show_date VARCHAR(120) NULL,
      show_time VARCHAR(120) NULL,
      seats JSON NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'refunded') NOT NULL DEFAULT 'confirmed',
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'paid',
      details JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bookings_user_id (user_id),
      INDEX idx_bookings_vendor_id (vendor_id),
      INDEX idx_bookings_module (module)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM bookings");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "bookings", columnMap, "booking_id", "VARCHAR(80) NULL UNIQUE");
  await ensureColumn(connection, "bookings", columnMap, "theatre_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "bookings", columnMap, "screen_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "bookings", columnMap, "seat_numbers", "JSON NULL");
  await ensureColumn(connection, "bookings", columnMap, "total_amount", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "bookings", columnMap, "booking_status", "ENUM('pending','confirmed','completed','cancelled','refunded') NOT NULL DEFAULT 'confirmed'");
  await ensureColumn(connection, "bookings", columnMap, "qr_token", "VARCHAR(255) NULL UNIQUE");
  await ensureColumn(connection, "bookings", columnMap, "qr_code_url", "TEXT NULL");
  await ensureColumn(connection, "bookings", columnMap, "checked_in", "BOOLEAN NOT NULL DEFAULT FALSE");
  await ensureColumn(connection, "bookings", columnMap, "checked_in_at", "DATETIME NULL");
  await ensureColumn(connection, "bookings", columnMap, "scanned_by", "VARCHAR(24) NULL");
  await ensureColumn(connection, "bookings", columnMap, "pnr", "VARCHAR(32) NULL UNIQUE");
  await ensureColumn(connection, "bookings", columnMap, "seat_number", "VARCHAR(40) NULL");
  await ensureColumn(connection, "bookings", columnMap, "check_in_status", "ENUM('NOT_CHECKED_IN','CHECKED_IN') NOT NULL DEFAULT 'NOT_CHECKED_IN'");
  await ensureColumn(connection, "bookings", columnMap, "boarding_pass_generated", "BOOLEAN NOT NULL DEFAULT FALSE");
  await ensureColumn(connection, "bookings", columnMap, "qr_data", "TEXT NULL");
  await connection.query("ALTER TABLE bookings MODIFY payment_status VARCHAR(40) NOT NULL DEFAULT 'pending'");
  await connection.query("ALTER TABLE bookings MODIFY booking_status VARCHAR(40) NOT NULL DEFAULT 'confirmed'");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS flight_bookings (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_id VARCHAR(24) NULL,
      booking_code VARCHAR(80) NOT NULL,
      user_id VARCHAR(24) NOT NULL,
      flight_id VARCHAR(24) NOT NULL,
      passenger_name VARCHAR(150) NOT NULL,
      passenger_mobile VARCHAR(30) NOT NULL,
      passenger_email VARCHAR(190) NOT NULL,
      seat_number VARCHAR(120) NULL,
      class_type VARCHAR(120) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      booking_status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'refunded') NOT NULL DEFAULT 'confirmed',
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'paid',
      booking_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      details JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_flight_bookings_user_id (user_id),
      INDEX idx_flight_bookings_flight_id (flight_id)
    )
  `);
  await connection.query("ALTER TABLE flight_bookings MODIFY seat_number VARCHAR(120) NULL");
  await connection.query("ALTER TABLE flight_bookings MODIFY booking_status VARCHAR(40) NOT NULL DEFAULT 'confirmed'");
  await connection.query("ALTER TABLE flight_bookings MODIFY payment_status VARCHAR(40) NOT NULL DEFAULT 'paid'");
};

const ensureMovieSeatsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_seats (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      row_name VARCHAR(10) NOT NULL,
      seat_number VARCHAR(10) NOT NULL,
      seat_no VARCHAR(20) NOT NULL,
      show_id VARCHAR(255) NOT NULL,
      movie_id VARCHAR(24) NULL,
      theatre_id VARCHAR(255) NULL,
      screen_id VARCHAR(255) NULL,
      seat_type VARCHAR(40) NOT NULL DEFAULT 'prime',
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('available', 'booked', 'blocked') NOT NULL DEFAULT 'available',
      booked_by VARCHAR(24) NULL,
      booking_id VARCHAR(24) NULL,
      customer_name VARCHAR(150) NULL,
      customer_email VARCHAR(190) NULL,
      customer_mobile VARCHAR(30) NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      payment_status VARCHAR(40) NULL,
      booking_status VARCHAR(40) NULL,
      booking_date DATETIME NULL,
      blocked_by VARCHAR(24) NULL,
      blocked_reason VARCHAR(255) NULL,
      blocked_seat_type VARCHAR(40) NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_movie_show_seat (show_id, seat_no),
      INDEX idx_movie_seats_show_id (show_id),
      INDEX idx_movie_seats_movie_id (movie_id),
      INDEX idx_movie_seats_status (status)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM movie_seats");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "movie_seats", columnMap, "row_name", "VARCHAR(10) NOT NULL DEFAULT 'A'");
  await ensureColumn(connection, "movie_seats", columnMap, "seat_number", "VARCHAR(10) NOT NULL DEFAULT '01'");
  await ensureColumn(connection, "movie_seats", columnMap, "seat_type", "VARCHAR(40) NOT NULL DEFAULT 'prime'");
  await ensureColumn(connection, "movie_seats", columnMap, "price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movie_seats", columnMap, "blocked_seat_type", "VARCHAR(40) NULL");
};

const ensureHotelSchema = async (connection) => {
  const [hotelColumns] = await connection.query("SHOW COLUMNS FROM hotels");
  const hotels = new Map(hotelColumns.map((column) => [column.Field, column]));
  const hotelAdditions = [
    ["name", "VARCHAR(255) NULL"], ["slug", "VARCHAR(280) NULL"], ["description", "TEXT NULL"],
    ["hotel_type", "VARCHAR(80) NOT NULL DEFAULT 'Hotel'"], ["star_rating", "DECIMAL(2,1) NOT NULL DEFAULT 0"],
    ["review_rating", "DECIMAL(3,2) NOT NULL DEFAULT 0"], ["review_count", "INT NOT NULL DEFAULT 0"],
    ["address", "TEXT NULL"], ["state", "VARCHAR(150) NULL"], ["country", "VARCHAR(100) NOT NULL DEFAULT 'India'"],
    ["postal_code", "VARCHAR(20) NULL"], ["latitude", "DECIMAL(10,7) NULL"], ["longitude", "DECIMAL(10,7) NULL"],
    ["phone", "VARCHAR(40) NULL"], ["email", "VARCHAR(190) NULL"],
    ["check_in_time", "TIME NOT NULL DEFAULT '14:00:00'"], ["check_out_time", "TIME NOT NULL DEFAULT '11:00:00'"],
    ["amenities", "JSON NULL"], ["onboarding_data", "JSON NULL"],
  ];
  for (const [name, definition] of hotelAdditions) await ensureColumn(connection, "hotels", hotels, name, definition);
  await connection.query("ALTER TABLE hotels MODIFY status ENUM('draft','active','inactive','hidden') NOT NULL DEFAULT 'active'");
  if (hotels.has("hotel_name")) {
    await connection.query("UPDATE hotels SET name=COALESCE(NULLIF(name,''),hotel_name), slug=COALESCE(NULLIF(slug,''),LOWER(REPLACE(hotel_name,' ','-'))) WHERE name IS NULL OR name='' OR slug IS NULL OR slug=''");
  }

  const [roomColumns] = await connection.query("SHOW COLUMNS FROM hotel_rooms");
  const rooms = new Map(roomColumns.map((column) => [column.Field, column]));
  const roomPricingAdditions = [
    ["weekday_price", "DECIMAL(12,2) NOT NULL DEFAULT 0"], ["weekend_price", "DECIMAL(12,2) NOT NULL DEFAULT 0"],
    ["seasonal_price", "DECIMAL(12,2) NOT NULL DEFAULT 0"], ["extra_adult_charge", "DECIMAL(12,2) NOT NULL DEFAULT 0"],
    ["extra_child_charge", "DECIMAL(12,2) NOT NULL DEFAULT 0"], ["discount_percent", "DECIMAL(5,2) NOT NULL DEFAULT 0"],
    ["offer_price", "DECIMAL(12,2) NOT NULL DEFAULT 0"],
  ];
  for (const [name, definition] of roomPricingAdditions) await ensureColumn(connection, "hotel_rooms", rooms, name, definition);

  const [bookingColumns] = await connection.query("SHOW COLUMNS FROM hotel_bookings");
  const bookings = new Map(bookingColumns.map((column) => [column.Field, column]));
  const bookingAdditions = [
    ["qr_token", "VARCHAR(190) NULL"], ["room_id", "VARCHAR(24) NULL"], ["check_in_date", "DATE NULL"],
    ["check_out_date", "DATE NULL"], ["room_count", "INT NOT NULL DEFAULT 1"], ["adult_count", "INT NOT NULL DEFAULT 1"],
    ["child_count", "INT NOT NULL DEFAULT 0"], ["guest_name", "VARCHAR(180) NULL"], ["guest_email", "VARCHAR(190) NULL"],
    ["guest_phone", "VARCHAR(40) NULL"], ["special_requests", "TEXT NULL"], ["subtotal", "DECIMAL(12,2) NOT NULL DEFAULT 0"],
    ["tax_amount", "DECIMAL(12,2) NOT NULL DEFAULT 0"], ["discount_amount", "DECIMAL(12,2) NOT NULL DEFAULT 0"],
    ["coupon_code", "VARCHAR(80) NULL"], ["payment_id", "VARCHAR(190) NULL"], ["cancellation_reason", "TEXT NULL"],
    ["cancelled_at", "DATETIME NULL"], ["checked_in_at", "DATETIME NULL"],
  ];
  for (const [name, definition] of bookingAdditions) await ensureColumn(connection, "hotel_bookings", bookings, name, definition);
  await connection.query("ALTER TABLE hotel_bookings MODIFY booking_status ENUM('pending','confirmed','cancel_requested','cancelled','checked_in','checked_out','completed','refunded') NOT NULL DEFAULT 'confirmed'");
  await connection.query("ALTER TABLE hotel_bookings MODIFY payment_status ENUM('pending','success','paid','failed','refunded') NOT NULL DEFAULT 'pending'");
};

const ensureSeatsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS seats (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      show_id VARCHAR(24) NOT NULL,
      movie_id VARCHAR(24) NULL,
      theatre_id VARCHAR(24) NULL,
      screen_id VARCHAR(24) NULL,
      row_name VARCHAR(10) NOT NULL,
      seat_number VARCHAR(10) NOT NULL,
      seat_no VARCHAR(20) NOT NULL,
      seat_type VARCHAR(40) NOT NULL DEFAULT 'prime',
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('available', 'booked', 'blocked') NOT NULL DEFAULT 'available',
      booked_by VARCHAR(24) NULL,
      booking_id VARCHAR(80) NULL,
      blocked_by VARCHAR(24) NULL,
      blocked_reason VARCHAR(255) NULL,
      blocked_seat_type VARCHAR(40) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_seats_show_seat (show_id, seat_no),
      INDEX idx_seats_show_id (show_id),
      INDEX idx_seats_movie_id (movie_id),
      INDEX idx_seats_status (status)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM seats");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "seats", columnMap, "blocked_seat_type", "VARCHAR(40) NULL");
};

const ensureMovieProductionSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS theatres (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      theatre_name VARCHAR(255) NOT NULL,
      city VARCHAR(150) NULL,
      location TEXT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_theatres_vendor_id (vendor_id)
    )
  `);

  const [theatreColumns] = await connection.query("SHOW COLUMNS FROM theatres");
  const theatreMap = new Map(theatreColumns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "theatres", theatreMap, "theatre_name", "VARCHAR(255) NOT NULL DEFAULT ''");
  await ensureColumn(connection, "theatres", theatreMap, "city", "VARCHAR(150) NULL");
  await ensureColumn(connection, "theatres", theatreMap, "location", "TEXT NULL");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS screens (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      theatre_id VARCHAR(24) NULL,
      vendor_id VARCHAR(24) NULL,
      screen_name VARCHAR(120) NOT NULL,
      screen_type VARCHAR(40) NOT NULL DEFAULT '2D',
      total_rows INT NOT NULL DEFAULT 10,
      seats_per_row INT NOT NULL DEFAULT 12,
      total_seats INT NOT NULL DEFAULT 120,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_screens_vendor_id (vendor_id)
    )
  `);

  const [screenColumns] = await connection.query("SHOW COLUMNS FROM screens");
  const screenMap = new Map(screenColumns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "screens", screenMap, "screen_name", "VARCHAR(120) NOT NULL DEFAULT ''");
  await ensureColumn(connection, "screens", screenMap, "screen_type", "VARCHAR(40) NOT NULL DEFAULT '2D'");
  await ensureColumn(connection, "screens", screenMap, "total_rows", "INT NOT NULL DEFAULT 10");
  await ensureColumn(connection, "screens", screenMap, "seats_per_row", "INT NOT NULL DEFAULT 12");
  await ensureColumn(connection, "screens", screenMap, "total_seats", "INT NOT NULL DEFAULT 120");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS shows (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NULL,
      theatre_id VARCHAR(24) NULL,
      screen_id VARCHAR(24) NULL,
      vendor_id VARCHAR(24) NULL,
      show_date VARCHAR(80) NULL,
      show_time VARCHAR(80) NULL,
      end_time VARCHAR(80) NULL,
      regular_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      premium_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      vip_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'booking_open',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_shows_movie_id (movie_id),
      INDEX idx_shows_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS qr_scans (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_id VARCHAR(80) NOT NULL,
      qr_token VARCHAR(255) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      scanned_by VARCHAR(24) NULL,
      scan_status VARCHAR(40) NOT NULL,
      scan_message VARCHAR(255) NULL,
      scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_qr_scans_booking_id (booking_id),
      INDEX idx_qr_scans_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_pricing (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      movie_id VARCHAR(24) NULL,
      show_id VARCHAR(24) NULL,
      seat_type VARCHAR(40) NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      day_type VARCHAR(40) NOT NULL DEFAULT 'all',
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_movie_pricing_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS refunds (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_id VARCHAR(80) NOT NULL,
      user_id VARCHAR(24) NULL,
      vendor_id VARCHAR(24) NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      reason TEXT NULL,
      refund_status VARCHAR(40) NOT NULL DEFAULT 'pending',
      admin_status VARCHAR(40) NOT NULL DEFAULT 'pending',
      vendor_status VARCHAR(40) NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_refunds_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS payouts (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
      platform_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
      vendor_payable DECIMAL(10,2) NOT NULL DEFAULT 0,
      payout_status VARCHAR(40) NOT NULL DEFAULT 'pending',
      payout_date DATETIME NULL,
      transaction_id VARCHAR(120) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_payouts_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS vendor_staff (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NULL,
      mobile VARCHAR(30) NULL,
      role VARCHAR(80) NOT NULL,
      permissions JSON NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vendor_staff_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NULL,
      type VARCHAR(80) NOT NULL DEFAULT 'general',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notifications_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_reviews (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NOT NULL,
      booking_id VARCHAR(24) NULL,
      user_id VARCHAR(24) NULL,
      vendor_id VARCHAR(24) NULL,
      rating INT NOT NULL,
      review TEXT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'published',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_movie_reviews_movie_id (movie_id)
    )
  `);

  const [reviewColumns] = await connection.query("SHOW COLUMNS FROM movie_reviews");
  const reviewMap = new Map(reviewColumns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "movie_reviews", reviewMap, "booking_id", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movie_reviews", reviewMap, "review", "TEXT NULL");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_status_logs (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      old_status VARCHAR(40) NULL,
      new_status VARCHAR(40) NOT NULL,
      changed_by VARCHAR(24) NULL,
      reason TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_movie_status_logs_movie_id (movie_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_documents (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      document_type VARCHAR(120) NOT NULL,
      file_name VARCHAR(255) NULL,
      file_url TEXT NOT NULL,
      mime_type VARCHAR(120) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_movie_documents_movie_id (movie_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_gallery (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      file_name VARCHAR(255) NULL,
      file_url TEXT NOT NULL,
      mime_type VARCHAR(120) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_movie_gallery_movie_id (movie_id)
    )
  `);
};

const ready = (async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_records (
        id VARCHAR(24) NOT NULL,
        model VARCHAR(80) NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (model, id),
        INDEX idx_app_records_model (model)
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(24) NOT NULL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        mobile VARCHAR(30) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'vendor', 'user') NOT NULL DEFAULT 'user',
        status ENUM('active', 'blocked', 'pending') NOT NULL DEFAULT 'active',
        image TEXT NULL,
        reset_password_token VARCHAR(255) NULL,
        reset_password_expires DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await ensureUsersSchema(connection);
    await ensureMoviesSchema(connection);
    await ensureFlightsSchema(connection);
    await ensureBookingsSchema(connection);
    await ensureMovieSeatsSchema(connection);
    await ensureSeatsSchema(connection);
    await ensureMovieProductionSchema(connection);
    await runSqlFile(connection, path.join(__dirname, "..", "..", "migrations", "2026-06-18-vendor-production-modules.sql"));
    await runSqlFile(connection, path.join(__dirname, "..", "..", "migrations", "2026-06-30-vendor-service-modules.sql"));
    await runSqlFile(connection, path.join(__dirname, "..", "..", "migrations", "2026-07-01-hotel-module.sql"));
    await ensureHotelSchema(connection);
    await migrateMovieRecords(connection);
    console.log("MySQL Connected");
    return true;
  } catch (err) {
    console.log("Database Error", err);
    return false;
  } finally {
    if (connection) connection.release();
  }
})();

module.exports = {
  pool,
  ready,
};
