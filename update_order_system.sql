-- تحديث نظام الطلبات لدعم النظام الجديد
-- Tawseel Plus - Order Priority System Update

-- 1. إضافة حقل الطلب العاجل إلى جدول الطلبات
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;

-- 2. إضافة حقل نوع المتجر إلى جدول المتاجر
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'أخرى';

-- 3. إضافة حقل موقع المتجر (JSON)
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS location JSONB;

-- 4. إضافة حقل مناطق العمل للسائقين
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS working_zones TEXT[];

-- 5. إضافة حقل نوع المركبة للسائقين
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'عادي';

-- 6. إضافة حقل متطلبات مركبة خاصة للطلبات
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS requires_special_vehicle BOOLEAN DEFAULT FALSE;

-- 7. إضافة حقل نوع المركبة المطلوبة
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS required_vehicle_type VARCHAR(50);

-- 8. إضافة حقل قيود المنطقة للطلبات
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS zone_restriction VARCHAR(100);

-- 9. إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_orders_status_urgent ON orders(status, is_urgent);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON orders(total_amount DESC);

-- 10. تحديث المتاجر الموجودة بتصنيفات افتراضية
UPDATE stores 
SET category = CASE 
  WHEN name ILIKE '%صيدلية%' OR name ILIKE '%دواء%' OR name ILIKE '%pharmacy%' THEN 'صيدليات'
  WHEN name ILIKE '%مطعم%' OR name ILIKE '%مأكولات%' OR name ILIKE '%restaurant%' THEN 'مطاعم'
  WHEN name ILIKE '%مخبز%' OR name ILIKE '%خبز%' OR name ILIKE '%bakery%' THEN 'مخابز'
  WHEN name ILIKE '%محل%' OR name ILIKE '%متجر%' OR name ILIKE '%shop%' THEN 'محلات'
  WHEN name ILIKE '%خدمة%' OR name ILIKE '%service%' THEN 'خدمات'
  ELSE 'أخرى'
END
WHERE category IS NULL OR category = 'أخرى';

-- 11. إنشاء دالة لحساب المسافة (اختياري - إذا كان PostgreSQL يدعم PostGIS)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 12. إنشاء جدول إحصائيات الطلبات (اختياري)
CREATE TABLE IF NOT EXISTS order_statistics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  urgent_orders INTEGER DEFAULT 0,
  high_value_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  average_delivery_time INTERVAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 13. إنشاء فهرس للتاريخ في إحصائيات الطلبات
CREATE INDEX IF NOT EXISTS idx_order_statistics_date ON order_statistics(date);

-- 14. إضافة تعليقات توضيحية
COMMENT ON COLUMN orders.is_urgent IS 'هل الطلب عاجل؟';
COMMENT ON COLUMN stores.category IS 'نوع المتجر (صيدليات، مطاعم، إلخ)';
COMMENT ON COLUMN stores.location IS 'موقع المتجر (خط الطول والعرض)';
COMMENT ON COLUMN drivers.working_zones IS 'مناطق العمل المسموحة للسائق';
COMMENT ON COLUMN drivers.vehicle_type IS 'نوع المركبة (عادي، شاحنة، دراجة)';
COMMENT ON COLUMN orders.requires_special_vehicle IS 'هل يتطلب الطلب مركبة خاصة؟';
COMMENT ON COLUMN orders.required_vehicle_type IS 'نوع المركبة المطلوبة';
COMMENT ON COLUMN orders.zone_restriction IS 'قيود المنطقة للطلب';

-- 15. إنشاء دالة لتحديث إحصائيات الطلبات
CREATE OR REPLACE FUNCTION update_order_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث إحصائيات اليوم الحالي
  INSERT INTO order_statistics (date, total_orders, urgent_orders, high_value_orders, completed_orders, total_revenue)
  VALUES (
    CURRENT_DATE,
    1,
    CASE WHEN NEW.is_urgent THEN 1 ELSE 0 END,
    CASE WHEN NEW.total_amount >= 50 THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
    NEW.total_amount
  )
  ON CONFLICT (date) DO UPDATE SET
    total_orders = order_statistics.total_orders + 1,
    urgent_orders = order_statistics.urgent_orders + CASE WHEN NEW.is_urgent THEN 1 ELSE 0 END,
    high_value_orders = order_statistics.high_value_orders + CASE WHEN NEW.total_amount >= 50 THEN 1 ELSE 0 END,
    completed_orders = order_statistics.completed_orders + CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
    total_revenue = order_statistics.total_revenue + NEW.total_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. إنشاء trigger لتحديث الإحصائيات تلقائياً
DROP TRIGGER IF EXISTS trigger_update_order_statistics ON orders;
CREATE TRIGGER trigger_update_order_statistics
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_statistics();

-- 17. إنشاء view للطلبات مع معلومات إضافية
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
  o.*,
  s.name as store_name,
  s.category as store_category,
  s.location as store_location,
  s.phone as store_phone,
  d.name as driver_name,
  d.phone as driver_phone,
  d.vehicle_type as driver_vehicle_type,
  CASE 
    WHEN o.is_urgent THEN 'عاجل'
    WHEN o.total_amount >= 50 THEN 'عالية القيمة'
    ELSE 'عادي'
  END as order_type
FROM orders o
LEFT JOIN stores s ON o.store_id = s.id
LEFT JOIN drivers d ON o.driver_id = d.id;

-- 18. إنشاء view للطلبات المتاحة مرتبة حسب الأولوية
CREATE OR REPLACE VIEW available_orders_priority AS
SELECT 
  o.*,
  s.name as store_name,
  s.category as store_category,
  s.location as store_location,
  -- حساب الأولوية المبسط (يمكن تطويره أكثر)
  (
    CASE WHEN o.is_urgent THEN 50 ELSE 0 END +
    CASE WHEN o.total_amount >= 50 THEN 25 ELSE 0 END +
    CASE WHEN o.total_amount >= 100 THEN 25 ELSE 0 END +
    EXTRACT(EPOCH FROM (NOW() - o.created_at)) / -300 -- تنقص الأولوية كل 5 دقائق
  ) as priority_score
FROM orders o
LEFT JOIN stores s ON o.store_id = s.id
WHERE o.status = 'pending'
ORDER BY priority_score DESC;

-- رسالة نجاح التحديث
SELECT 'تم تحديث نظام الطلبات بنجاح!' as message;

-- عرض ملخص التحديثات
SELECT 
  'orders.is_urgent' as column_name,
  'تم إضافة حقل الطلب العاجل' as description
UNION ALL
SELECT 
  'stores.category',
  'تم إضافة تصنيف المتاجر'
UNION ALL
SELECT 
  'stores.location',
  'تم إضافة موقع المتاجر'
UNION ALL
SELECT 
  'drivers.working_zones',
  'تم إضافة مناطق العمل للسائقين'
UNION ALL
SELECT 
  'drivers.vehicle_type',
  'تم إضافة نوع المركبة للسائقين'
UNION ALL
SELECT 
  'order_statistics',
  'تم إنشاء جدول إحصائيات الطلبات'
UNION ALL
SELECT 
  'orders_with_details',
  'تم إنشاء view للطلبات مع التفاصيل'
UNION ALL
SELECT 
  'available_orders_priority',
  'تم إنشاء view للطلبات المرتبة حسب الأولوية'; 