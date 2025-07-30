-- =====================================================
-- تحديث البيانات الموجودة بإضافة روابط مواقع
-- =====================================================

-- تحديث المتاجر الموجودة بإضافة روابط مواقع افتراضية
UPDATE stores 
SET location_url = CASE 
  WHEN name LIKE '%مطعم%' THEN 'https://maps.google.com/?q=مطاعم+الرياض'
  WHEN name LIKE '%صيدلية%' THEN 'https://maps.google.com/?q=صيدليات+جدة'
  WHEN name LIKE '%مخبز%' THEN 'https://maps.google.com/?q=مخابز+الدمام'
  ELSE 'https://maps.google.com/?q=' || REPLACE(address, ' ', '+')
END
WHERE location_url IS NULL OR location_url = '';

-- تحديث طلبات التسجيل الموجودة
UPDATE registration_requests 
SET location_url = 'https://maps.google.com/?q=' || REPLACE(address, ' ', '+')
WHERE user_type = 'store' AND (location_url IS NULL OR location_url = '');

-- تحديث الطلبات الموجودة بإضافة روابط مواقع المتاجر
UPDATE orders 
SET store_location_url = (
  SELECT s.location_url 
  FROM stores s 
  WHERE s.id = orders.store_id
)
WHERE store_id IS NOT NULL AND (store_location_url IS NULL OR store_location_url = '');

-- عرض إحصائيات التحديث
SELECT 
  'stores' as table_name,
  COUNT(*) as total_records,
  COUNT(location_url) as records_with_location
FROM stores
UNION ALL
SELECT 
  'registration_requests' as table_name,
  COUNT(*) as total_records,
  COUNT(location_url) as records_with_location
FROM registration_requests
WHERE user_type = 'store'
UNION ALL
SELECT 
  'orders' as table_name,
  COUNT(*) as total_records,
  COUNT(store_location_url) as records_with_location
FROM orders
WHERE store_id IS NOT NULL; 