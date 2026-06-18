CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  booking_id VARCHAR(80) NULL UNIQUE,
  booking_code VARCHAR(80) NULL UNIQUE,
  user_id VARCHAR(24) NOT NULL,
  vendor_id VARCHAR(24) NULL,
  module VARCHAR(80) NOT NULL DEFAULT 'movie',
  title VARCHAR(255) NOT NULL,
  movie_id VARCHAR(24) NULL,
  theatre_id VARCHAR(24) NULL,
  screen_id VARCHAR(24) NULL,
  show_id VARCHAR(24) NULL,
  flight_id VARCHAR(24) NULL,
  customer_name VARCHAR(150) NULL,
  customer_email VARCHAR(190) NULL,
  customer_mobile VARCHAR(30) NULL,
  theatre VARCHAR(255) NULL,
  show_date VARCHAR(120) NULL,
  show_time VARCHAR(120) NULL,
  seats JSON NULL,
  seat_numbers JSON NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('pending','confirmed','completed','cancelled','refunded') NOT NULL DEFAULT 'confirmed',
  payment_status ENUM('pending','success','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  booking_status ENUM('pending','confirmed','completed','cancelled','refunded') NOT NULL DEFAULT 'confirmed',
  qr_token VARCHAR(255) NULL UNIQUE,
  qr_code_url TEXT NULL,
  checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at DATETIME NULL,
  scanned_by VARCHAR(24) NULL,
  details JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bookings_user_id (user_id),
  INDEX idx_bookings_vendor_id (vendor_id),
  INDEX idx_bookings_movie_id (movie_id),
  INDEX idx_bookings_show_id (show_id),
  INDEX idx_bookings_qr_token (qr_token)
);

CREATE TABLE IF NOT EXISTS qr_scans (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  booking_id VARCHAR(80) NOT NULL,
  qr_token VARCHAR(255) NOT NULL,
  vendor_id VARCHAR(24) NULL,
  scanned_by VARCHAR(24) NULL,
  scan_status ENUM('valid','checked_in','already_used','invalid') NOT NULL,
  scan_message VARCHAR(255) NULL,
  scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_qr_scans_booking_id (booking_id),
  INDEX idx_qr_scans_vendor_id (vendor_id),
  INDEX idx_qr_scans_qr_token (qr_token)
);

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
);

CREATE TABLE IF NOT EXISTS screens (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  theatre_id VARCHAR(24) NULL,
  vendor_id VARCHAR(24) NULL,
  screen_name VARCHAR(120) NOT NULL,
  total_rows INT NOT NULL DEFAULT 10,
  seats_per_row INT NOT NULL DEFAULT 12,
  total_seats INT NOT NULL DEFAULT 120,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_screens_theatre_id (theatre_id),
  INDEX idx_screens_vendor_id (vendor_id)
);

CREATE TABLE IF NOT EXISTS shows (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  movie_id VARCHAR(24) NULL,
  theatre_id VARCHAR(24) NULL,
  screen_id VARCHAR(24) NULL,
  vendor_id VARCHAR(24) NULL,
  show_date VARCHAR(80) NULL,
  show_time VARCHAR(80) NULL,
  end_time VARCHAR(80) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'booking_open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shows_movie_id (movie_id),
  INDEX idx_shows_vendor_id (vendor_id)
);

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
  status ENUM('available','booked','blocked') NOT NULL DEFAULT 'available',
  booked_by VARCHAR(24) NULL,
  booking_id VARCHAR(80) NULL,
  blocked_by VARCHAR(24) NULL,
  blocked_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_seats_show_seat (show_id, seat_no),
  INDEX idx_seats_show_id (show_id),
  INDEX idx_seats_status (status)
);

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
  INDEX idx_movie_pricing_vendor_id (vendor_id),
  INDEX idx_movie_pricing_show_id (show_id)
);

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
  INDEX idx_refunds_booking_id (booking_id),
  INDEX idx_refunds_vendor_id (vendor_id)
);

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
);

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
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  vendor_id VARCHAR(24) NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NULL,
  type VARCHAR(80) NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_vendor_id (vendor_id)
);

CREATE TABLE IF NOT EXISTS movie_reviews (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  booking_id VARCHAR(80) NULL,
  user_id VARCHAR(24) NULL,
  movie_id VARCHAR(24) NOT NULL,
  vendor_id VARCHAR(24) NULL,
  rating INT NOT NULL,
  review TEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_movie_reviews_movie_id (movie_id),
  INDEX idx_movie_reviews_vendor_id (vendor_id)
);

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
);
