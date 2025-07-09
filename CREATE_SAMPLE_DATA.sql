-- إنشاء بيانات تجريبية للمتاجر والسائقين
-- =====================================================

-- 1. إنشاء متاجر تجريبية
INSERT INTO stores (email, password, name, phone, address, category, is_active, created_at) VALUES
('store1@tawseel.com', 'password123', 'مطعم الشرق', '+966504567890', 'شارع الملك فهد، الرياض', 'مطاعم', true, NOW()),
('store2@tawseel.com', 'password123', 'صيدلية النور', '+966505678901', 'شارع التحلية، جدة', 'صيدليات', true, NOW()),
('store3@tawseel.com', 'password123', 'مخبز الأصالة', '+966506789012', 'شارع العليا، الدمام', 'مخابز', true, NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. إنشاء سائقين تجريبيين
INSERT INTO drivers (email, password, name, phone, vehicle_type, status, is_active, debt_points, created_at) VALUES
('driver1@tawseel.com', 'password123', 'أحمد محمد', '+966501234567', 'سيارة نقل صغيرة', 'approved', true, 0, NOW()),
('driver2@tawseel.com', 'password123', 'محمد علي', '+966502345678', 'دراجة نارية', 'approved', true, 0, NOW()),
('driver3@tawseel.com', 'password123', 'علي حسن', '+966503456789', 'سيارة نقل متوسطة', 'approved', true, 0, NOW())
ON CONFLICT (email) DO NOTHING;

-- 3. التحقق من البيانات المنشأة
SELECT 
    'stores' as table_name,
    COUNT(*) as count
FROM stores
UNION ALL
SELECT 
    'drivers' as table_name,
    COUNT(*) as count
FROM drivers;

COMMIT;

SELECT 'تم إنشاء البيانات التجريبية بنجاح!' AS message; 