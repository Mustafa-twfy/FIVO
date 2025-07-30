-- =====================================================
-- إضافة دعم النقطة الحمراء للإشعارات
-- =====================================================

-- إضافة حقل is_read إلى جدول notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- إضافة حقل is_read إلى جدول store_notifications
ALTER TABLE store_notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_notifications_driver_read ON notifications(driver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_store_notifications_store_read ON store_notifications(store_id, is_read);

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN notifications.is_read IS 'حالة قراءة الإشعار';
COMMENT ON COLUMN store_notifications.is_read IS 'حالة قراءة إشعار المتجر';

-- تحديث الإشعارات الموجودة لتكون مقروءة افتراضياً
UPDATE notifications SET is_read = TRUE WHERE is_read IS NULL;
UPDATE store_notifications SET is_read = TRUE WHERE is_read IS NULL;

-- عرض إحصائيات الإشعارات
SELECT 
  'notifications' as table_name,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_notifications
FROM notifications
UNION ALL
SELECT 
  'store_notifications' as table_name,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_notifications
FROM store_notifications; 