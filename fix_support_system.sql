-- =====================================================
-- إصلاح نظام الدعم الفني - توصيل بلس
-- =====================================================

-- 1. حذف الجداول القديمة إذا كانت موجودة
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS store_support_messages CASCADE;

-- 2. إنشاء جدول الدعم الفني الموحد
CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL, -- 'driver' أو 'store'
    user_id INTEGER NOT NULL,       -- driver_id أو store_id
    message TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,    -- 'user' أو 'admin'
    is_read BOOLEAN DEFAULT false,
    read_by_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_support_messages_user_type_user_id ON support_messages(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON support_messages(sender);
CREATE INDEX IF NOT EXISTS idx_support_messages_read_by_admin ON support_messages(read_by_admin);

-- 4. إدخال بيانات تجريبية للدعم الفني
INSERT INTO support_messages (user_type, user_id, message, sender) VALUES
-- رسائل من السائقين
('driver', 1, 'أحتاج مساعدة في تحديث بياناتي الشخصية', 'user'),
('driver', 1, 'هل يمكنني تغيير رقم الهاتف؟', 'user'),
('driver', 2, 'مشكلة في تسجيل الدخول', 'user'),
('driver', 2, 'لا أستطيع الوصول لحسابي', 'user'),

-- ردود الإدارة
('driver', 1, 'مرحباً! يمكننا مساعدتك في تحديث بياناتك. ما هي البيانات التي تريد تحديثها؟', 'admin'),
('driver', 1, 'نعم، يمكنك تغيير رقم الهاتف من إعدادات الحساب', 'admin'),
('driver', 2, 'سنقوم بفحص مشكلة تسجيل الدخول. هل يمكنك إخبارنا بالخطأ الذي يظهر لك؟', 'admin'),

-- رسائل من المتاجر
('store', 1, 'أحتاج مساعدة في إضافة منتجات جديدة', 'user'),
('store', 2, 'مشكلة في تحديث عنوان المتجر', 'user'),
('store', 1, 'كيف يمكنني إلغاء طلب؟', 'user'),

-- ردود الإدارة للمتاجر
('store', 1, 'مرحباً! يمكننا مساعدتك في إضافة المنتجات. هل تريد دليل مفصل؟', 'admin'),
('store', 2, 'سنقوم بمساعدتك في تحديث العنوان. ما هو العنوان الجديد؟', 'admin'),
('store', 1, 'يمكنك إلغاء الطلب من صفحة الطلبات قبل قبول السائق له', 'admin');

-- 5. إنشاء جدول إعدادات النظام إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    debt_point_value DECIMAL(10,2) DEFAULT 250.00,
    max_debt_points INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. إدخال إعدادات افتراضية
INSERT INTO system_settings (debt_point_value, max_debt_points) VALUES (250.00, 20)
ON CONFLICT (id) DO NOTHING;

-- 7. إنشاء دالة لتحديث عدد الرسائل غير المقروءة
CREATE OR REPLACE FUNCTION get_unread_support_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM support_messages 
        WHERE sender = 'user' AND read_by_admin = false
    );
END;
$$ LANGUAGE plpgsql;

-- 8. إنشاء دالة لتحديث حالة القراءة
CREATE OR REPLACE FUNCTION mark_support_messages_as_read(user_type_param VARCHAR, user_id_param INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE support_messages 
    SET read_by_admin = true 
    WHERE user_type = user_type_param 
    AND user_id = user_id_param 
    AND sender = 'user';
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- رسالة نجاح
SELECT 'تم إصلاح نظام الدعم الفني بنجاح!' AS message; 