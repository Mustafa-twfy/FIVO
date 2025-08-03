-- =====================================================
-- إصلاح روابط المواقع في قاعدة البيانات
-- =====================================================

-- تحديث روابط المتاجر الموجودة
UPDATE stores 
SET location_url = 'https://maps.google.com/?q=' || REPLACE(address, ' ', '+') 
WHERE (location_url IS NULL OR location_url = '') AND address IS NOT NULL;

-- تحديث طلبات التسجيل
UPDATE registration_requests 
SET location_url = 'https://maps.google.com/?q=' || REPLACE(address, ' ', '+') 
WHERE user_type = 'store' AND (location_url IS NULL OR location_url = '') AND address IS NOT NULL;

-- تحديث الطلبات الموجودة
UPDATE orders 
SET store_location_url = (
  SELECT s.location_url 
  FROM stores s 
  WHERE s.id = orders.store_id
) 
WHERE store_id IS NOT NULL AND (store_location_url IS NULL OR store_location_url = '');

-- التحقق من البيانات المحدثة
SELECT 
  'stores' as table_name,
  COUNT(*) as total_records,
  COUNT(location_url) as records_with_location_url
FROM stores
UNION ALL
SELECT 
  'orders' as table_name,
  COUNT(*) as total_records,
  COUNT(store_location_url) as records_with_location_url
FROM orders
WHERE store_id IS NOT NULL; 