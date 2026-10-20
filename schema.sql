PRAGMA foreign_keys = ON;

-- Service provider details
CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    phone TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    active INTEGER NOT NULL DEFAULT 0
        CHECK (active IN (0, 1)),
    rating REAL NOT NULL DEFAULT 0,
    reviews INTEGER NOT NULL DEFAULT 0
);

-- Customer service requests
CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    service TEXT NOT NULL,
    details TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT NOT NULL
);

-- Customer ratings for providers
CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    customer TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id)
        REFERENCES shops(id)
        ON DELETE CASCADE
);

-- Improve database searches
CREATE INDEX IF NOT EXISTS idx_requests_customer
ON service_requests(customer);

CREATE INDEX IF NOT EXISTS idx_ratings_shop
ON ratings(shop_id);