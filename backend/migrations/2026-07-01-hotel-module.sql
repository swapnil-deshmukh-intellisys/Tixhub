CREATE TABLE IF NOT EXISTS hotels (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  vendor_id VARCHAR(24) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL,
  description TEXT NULL,
  hotel_type VARCHAR(80) NOT NULL DEFAULT 'Hotel',
  star_rating DECIMAL(2,1) NOT NULL DEFAULT 0,
  review_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  address TEXT NOT NULL,
  city VARCHAR(150) NOT NULL,
  state VARCHAR(150) NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  postal_code VARCHAR(20) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  check_in_time TIME NOT NULL DEFAULT '14:00:00',
  check_out_time TIME NOT NULL DEFAULT '11:00:00',
  amenities JSON NULL,
  status ENUM('active','inactive','hidden') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hotels_vendor (vendor_id),
  INDEX idx_hotels_city_status (city, status),
  INDEX idx_hotels_rating (review_rating)
);

CREATE TABLE IF NOT EXISTS hotel_images (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  hotel_id VARCHAR(24) NOT NULL,
  image_url LONGTEXT NOT NULL,
  alt_text VARCHAR(255) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hotel_images_hotel (hotel_id)
);

CREATE TABLE IF NOT EXISTS hotel_rooms (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  hotel_id VARCHAR(24) NOT NULL,
  vendor_id VARCHAR(24) NOT NULL,
  name VARCHAR(180) NOT NULL,
  room_type VARCHAR(100) NOT NULL,
  description TEXT NULL,
  max_adults INT NOT NULL DEFAULT 2,
  max_children INT NOT NULL DEFAULT 0,
  bed_type VARCHAR(100) NULL,
  room_size VARCHAR(80) NULL,
  total_rooms INT NOT NULL DEFAULT 1,
  base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_percent DECIMAL(5,2) NOT NULL DEFAULT 12,
  amenities JSON NULL,
  refundable BOOLEAN NOT NULL DEFAULT TRUE,
  meal_plan VARCHAR(100) NULL,
  status ENUM('active','inactive','hidden') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hotel_rooms_hotel_status (hotel_id, status),
  INDEX idx_hotel_rooms_vendor (vendor_id)
);

CREATE TABLE IF NOT EXISTS hotel_room_images (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  room_id VARCHAR(24) NOT NULL,
  image_url LONGTEXT NOT NULL,
  alt_text VARCHAR(255) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_images_room (room_id)
);

CREATE TABLE IF NOT EXISTS hotel_bookings (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  booking_code VARCHAR(40) NOT NULL UNIQUE,
  qr_token VARCHAR(190) NOT NULL UNIQUE,
  user_id VARCHAR(24) NOT NULL,
  vendor_id VARCHAR(24) NOT NULL,
  hotel_id VARCHAR(24) NOT NULL,
  room_id VARCHAR(24) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  room_count INT NOT NULL DEFAULT 1,
  adult_count INT NOT NULL DEFAULT 1,
  child_count INT NOT NULL DEFAULT 0,
  guest_name VARCHAR(180) NOT NULL,
  guest_email VARCHAR(190) NOT NULL,
  guest_phone VARCHAR(40) NOT NULL,
  special_requests TEXT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  coupon_code VARCHAR(80) NULL,
  payment_id VARCHAR(190) NULL,
  payment_status ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  booking_status ENUM('pending','confirmed','cancel_requested','cancelled','checked_in','checked_out','refunded') NOT NULL DEFAULT 'confirmed',
  cancellation_reason TEXT NULL,
  cancelled_at DATETIME NULL,
  checked_in_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hotel_bookings_user (user_id),
  INDEX idx_hotel_bookings_vendor (vendor_id),
  INDEX idx_hotel_bookings_hotel_dates (hotel_id, check_in_date, check_out_date),
  INDEX idx_hotel_bookings_status (booking_status)
);

CREATE TABLE IF NOT EXISTS hotel_booking_guests (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  booking_id VARCHAR(24) NOT NULL,
  full_name VARCHAR(180) NOT NULL,
  age INT NULL,
  gender VARCHAR(30) NULL,
  guest_type ENUM('adult','child') NOT NULL DEFAULT 'adult',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hotel_guests_booking (booking_id)
);

CREATE TABLE IF NOT EXISTS hotel_inventory_calendar (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  hotel_id VARCHAR(24) NOT NULL,
  room_id VARCHAR(24) NOT NULL,
  inventory_date DATE NOT NULL,
  total_rooms INT NOT NULL DEFAULT 0,
  available_rooms INT NOT NULL DEFAULT 0,
  blocked_rooms INT NOT NULL DEFAULT 0,
  booked_rooms INT NOT NULL DEFAULT 0,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('available','blocked','sold_out') NOT NULL DEFAULT 'available',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hotel_room_inventory_date (room_id, inventory_date),
  INDEX idx_inventory_hotel_date (hotel_id, inventory_date)
);

CREATE TABLE IF NOT EXISTS hotel_reviews (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  hotel_id VARCHAR(24) NOT NULL,
  booking_id VARCHAR(24) NULL,
  user_id VARCHAR(24) NOT NULL,
  rating INT NOT NULL,
  title VARCHAR(180) NULL,
  review TEXT NOT NULL,
  status ENUM('published','hidden') NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hotel_reviews_hotel (hotel_id)
);

CREATE TABLE IF NOT EXISTS hotel_review_replies (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  review_id VARCHAR(24) NOT NULL,
  vendor_id VARCHAR(24) NOT NULL,
  reply TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_review_replies_review (review_id)
);

CREATE TABLE IF NOT EXISTS hotel_policies (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  hotel_id VARCHAR(24) NOT NULL,
  policy_type VARCHAR(100) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hotel_policies_hotel (hotel_id)
);

CREATE TABLE IF NOT EXISTS hotel_coupons (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  vendor_id VARCHAR(24) NOT NULL,
  hotel_id VARCHAR(24) NULL,
  code VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  discount_type ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_booking_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(12,2) NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vendor_coupon_code (vendor_id, code),
  INDEX idx_hotel_coupons_hotel (hotel_id)
);

CREATE TABLE IF NOT EXISTS hotel_refunds (
  id VARCHAR(24) NOT NULL PRIMARY KEY,
  booking_id VARCHAR(24) NOT NULL,
  vendor_id VARCHAR(24) NOT NULL,
  user_id VARCHAR(24) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  reason TEXT NULL,
  status ENUM('pending','approved','processed','rejected') NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(190) NULL,
  processed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hotel_refunds_booking (booking_id),
  INDEX idx_hotel_refunds_vendor (vendor_id)
);
