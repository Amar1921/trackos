-- TrackOS Database Schema
CREATE DATABASE IF NOT EXISTS trackos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trackos_db;

-- Sites enregistrés dans le dashboard
CREATE TABLE IF NOT EXISTS sites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  site_key VARCHAR(64) NOT NULL UNIQUE,
  owner_id INT NOT NULL,        -- ID utilisateur Symfony
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_site_key (site_key),
  INDEX idx_owner (owner_id)
);

-- Visites enregistrées
CREATE TABLE IF NOT EXISTS visits (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  site_id INT NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  visitor_id VARCHAR(64),           -- fingerprint persistant
  page_url TEXT NOT NULL,
  page_title VARCHAR(500),
  referrer TEXT,

  -- Infos visiteur
  ip VARCHAR(45),
  country VARCHAR(64),
  country_code VARCHAR(4),
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),

  -- Device / Browser
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  device_type ENUM('desktop','mobile','tablet','bot','unknown') DEFAULT 'unknown',
  device_brand VARCHAR(100),
  screen_width INT,
  screen_height INT,

  -- Durée & comportement
  duration_seconds INT DEFAULT 0,
  scroll_depth_pct TINYINT UNSIGNED DEFAULT 0,
  is_bounce TINYINT(1) DEFAULT 1,
  exit_page TINYINT(1) DEFAULT 0,

  -- UTM
  utm_source VARCHAR(200),
  utm_medium VARCHAR(200),
  utm_campaign VARCHAR(200),

  visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  INDEX idx_site_visited (site_id, visited_at),
  INDEX idx_session (session_id),
  INDEX idx_visitor (visitor_id)
);

-- Events custom (clicks, forms, custom events)
CREATE TABLE IF NOT EXISTS events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  visit_id BIGINT,
  site_id INT NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(100) NOT NULL,  -- 'click','form_submit','custom'
  event_name VARCHAR(200),
  event_data JSON,
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  INDEX idx_site_event (site_id, occurred_at)
);

-- Pages vues agrégées par jour (pour les stats rapides)
CREATE TABLE IF NOT EXISTS page_stats_daily (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  site_id INT NOT NULL,
  stat_date DATE NOT NULL,
  page_url TEXT,
  page_path VARCHAR(1000),
  views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  avg_duration_seconds INT DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  INDEX idx_site_date (site_id, stat_date)
);
