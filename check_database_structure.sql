SELECT 
  'stores' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') 
    THEN 'موجود' ELSE 'غير موجود' END as status
UNION ALL
SELECT 
  'orders' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') 
    THEN 'موجود' ELSE 'غير موجود' END as status
UNION ALL
SELECT 
  'drivers' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') 
    THEN 'موجود' ELSE 'غير موجود' END as status
UNION ALL
SELECT 
  'notifications' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN 'موجود' ELSE 'غير موجود' END as status
UNION ALL
SELECT 
  'store_notifications' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_notifications') 
    THEN 'موجود' ELSE 'غير موجود' END as status
UNION ALL
SELECT 
  'registration_requests' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'registration_requests') 
    THEN 'موجود' ELSE 'غير موجود' END as status;

SELECT 
  column_name,
  data_type,
  CASE WHEN column_name IN ('location_url') THEN 'حقل جديد' ELSE 'حقل قديم' END as type
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY column_name;

SELECT 
  column_name,
  data_type,
  CASE WHEN column_name IN ('store_location_url') THEN 'حقل جديد' ELSE 'حقل قديم' END as type
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY column_name;

SELECT 
  column_name,
  data_type,
  CASE WHEN column_name IN ('is_read') THEN 'حقل جديد' ELSE 'حقل قديم' END as type
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY column_name;

SELECT 
  column_name,
  data_type,
  CASE WHEN column_name IN ('is_read') THEN 'حقل جديد' ELSE 'حقل قديم' END as type
FROM information_schema.columns 
WHERE table_name = 'store_notifications' 
ORDER BY column_name;

SELECT 
  column_name,
  data_type,
  CASE WHEN column_name IN ('location_url') THEN 'حقل جديد' ELSE 'حقل قديم' END as type
FROM information_schema.columns 
WHERE table_name = 'registration_requests' 
ORDER BY column_name;

SELECT 
  indexname,
  tablename,
  CASE WHEN indexname IN (
    'idx_stores_location_url',
    'idx_orders_store_location_url',
    'idx_notifications_driver_read',
    'idx_store_notifications_store_read'
  ) THEN 'فهرس جديد' ELSE 'فهرس قديم' END as type
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY indexname;

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
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_notifications
FROM notifications
UNION ALL
SELECT 
  'store_notifications' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_notifications
FROM store_notifications
UNION ALL
SELECT 
  'registration_requests' as table_name,
  COUNT(*) as total_records,
  COUNT(location_url) as records_with_location_url
FROM registration_requests;

SELECT 
  'stores' as table_name,
  COUNT(*) as total_stores,
  COUNT(CASE WHEN location_url IS NOT NULL AND location_url != '' THEN 1 END) as stores_with_location
FROM stores
UNION ALL
SELECT 
  'orders' as table_name,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN store_location_url IS NOT NULL AND store_location_url != '' THEN 1 END) as orders_with_location
FROM orders
WHERE store_id IS NOT NULL; 