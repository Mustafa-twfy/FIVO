-- =====================================================
-- إضافة حقول رابط الموقع في قاعدة البيانات
-- =====================================================

-- إضافة حقل location_url في جدول registration_requests
ALTER TABLE registration_requests 
ADD COLUMN IF NOT EXISTS location_url TEXT;

-- إضافة حقل store_location_url في جدول orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS store_location_url TEXT;

-- إضافة حقل location_url في جدول stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS location_url TEXT;

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN registration_requests.location_url IS 'رابط موقع المتجر من Google Maps';
COMMENT ON COLUMN orders.store_location_url IS 'رابط موقع المتجر في الطلب';
COMMENT ON COLUMN stores.location_url IS 'رابط موقع المتجر من Google Maps';

-- إنشاء فهرس لتحسين البحث في حقول الرابط
CREATE INDEX IF NOT EXISTS idx_stores_location_url ON stores(location_url);
CREATE INDEX IF NOT EXISTS idx_orders_store_location_url ON orders(store_location_url); 