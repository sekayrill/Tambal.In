-- Database Schema untuk Tambal.In
-- MySQL Database

CREATE DATABASE IF NOT EXISTS tambal_in;
USE tambal_in;

-- Tabel Users untuk authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabel Tambal Ban Locations
CREATE TABLE tambal_locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    description TEXT,
    services JSON, -- ['mobil', 'motor', 'ban_tubeless', 'ban_dalam']
    operating_hours JSON, -- {'senin': '08:00-17:00', 'selasa': '08:00-17:00', ...}
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Reviews dan Rating
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES tambal_locations(id) ON DELETE CASCADE
);

-- Tabel Bookings/Orders
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    service_type ENUM('mobil', 'motor') NOT NULL,
    service_description TEXT,
    booking_date DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    total_price DECIMAL(10, 2),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES tambal_locations(id) ON DELETE CASCADE
);

-- Tabel Payments
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50), -- 'stripe', 'paypal', 'midtrans'
    transaction_id VARCHAR(100),
    status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
    gateway_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Tabel Customer Service Messages
CREATE TABLE support_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabel untuk Session Management
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data untuk testing
INSERT INTO tambal_locations (name, address, latitude, longitude, phone, services, operating_hours, rating, total_reviews) VALUES
('Tambal Ban Jaya', 'Jl. Sudirman No. 123, Jakarta Pusat', -6.2088, 106.8456, '021-12345678', 
 '["mobil", "motor", "ban_tubeless", "ban_dalam"]', 
 '{"senin": "08:00-17:00", "selasa": "08:00-17:00", "rabu": "08:00-17:00", "kamis": "08:00-17:00", "jumat": "08:00-17:00", "sabtu": "08:00-15:00"}',
 4.5, 25),

('Bengkel Ban Merdeka', 'Jl. Merdeka Raya No. 45, Jakarta Selatan', -6.2615, 106.8106, '021-87654321',
 '["mobil", "motor", "ban_tubeless"]',
 '{"senin": "07:00-18:00", "selasa": "07:00-18:00", "rabu": "07:00-18:00", "kamis": "07:00-18:00", "jumat": "07:00-18:00", "sabtu": "07:00-16:00", "minggu": "08:00-14:00"}',
 4.2, 18),

('Tambal Ban 24 Jam', 'Jl. Gatot Subroto No. 67, Jakarta Selatan', -6.2297, 106.8253, '021-11223344',
 '["mobil", "motor", "ban_tubeless", "ban_dalam"]',
 '{"senin": "24 jam", "selasa": "24 jam", "rabu": "24 jam", "kamis": "24 jam", "jumat": "24 jam", "sabtu": "24 jam", "minggu": "24 jam"}',
 4.8, 42);

-- Create indexes untuk performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_tambal_locations_coordinates ON tambal_locations(latitude, longitude);
CREATE INDEX idx_reviews_location ON reviews(location_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_location ON bookings(location_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_support_messages_user ON support_messages(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);

