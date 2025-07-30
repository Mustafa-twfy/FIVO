ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS location_url TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS location_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_location_url TEXT;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE store_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_stores_location_url ON stores(location_url);
CREATE INDEX IF NOT EXISTS idx_orders_store_location_url ON orders(store_location_url);
CREATE INDEX IF NOT EXISTS idx_notifications_driver_read ON notifications(driver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_store_notifications_store_read ON store_notifications(store_id, is_read);

UPDATE stores SET location_url = 'https://maps.google.com/?q=' || REPLACE(address, ' ', '+') WHERE location_url IS NULL OR location_url = '';
UPDATE registration_requests SET location_url = 'https://maps.google.com/?q=' || REPLACE(address, ' ', '+') WHERE user_type = 'store' AND (location_url IS NULL OR location_url = '');
UPDATE orders SET store_location_url = (SELECT s.location_url FROM stores s WHERE s.id = orders.store_id) WHERE store_id IS NOT NULL AND (store_location_url IS NULL OR store_location_url = '');
UPDATE notifications SET is_read = TRUE WHERE is_read IS NULL;
UPDATE store_notifications SET is_read = TRUE WHERE is_read IS NULL; 