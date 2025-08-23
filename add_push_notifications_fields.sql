-- إضافة حقول Push Notifications للجداول

-- إضافة حقل expo_push_token لجدول السائقين
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
ADD COLUMN IF NOT EXISTS token_updated_at TIMESTAMP;

-- إضافة حقل expo_push_token لجدول المتاجر
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
ADD COLUMN IF NOT EXISTS token_updated_at TIMESTAMP;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_drivers_expo_token ON drivers(expo_push_token);
CREATE INDEX IF NOT EXISTS idx_stores_expo_token ON stores(expo_push_token);

-- إضافة تعليقات على الجداول
COMMENT ON COLUMN drivers.expo_push_token IS 'توكن Expo Push Notifications للسائق';
COMMENT ON COLUMN drivers.token_updated_at IS 'تاريخ آخر تحديث للتوكن';
COMMENT ON COLUMN stores.expo_push_token IS 'توكن Expo Push Notifications للمتجر';
COMMENT ON COLUMN stores.token_updated_at IS 'تاريخ آخر تحديث للتوكن';

-- إنشاء جدول لتتبع الإشعارات المرسلة
CREATE TABLE IF NOT EXISTS push_notification_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('driver', 'store')),
    notification_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
    error_message TEXT,
    expo_response JSONB
);

-- إنشاء فهارس لجدول السجلات
CREATE INDEX IF NOT EXISTS idx_push_logs_user ON push_notification_logs(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_push_logs_type ON push_notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_logs_sent_at ON push_notification_logs(sent_at);

-- إضافة تعليقات على جدول السجلات
COMMENT ON TABLE push_notification_logs IS 'سجل الإشعارات Push المرسلة';
COMMENT ON COLUMN push_notification_logs.user_id IS 'معرف المستخدم';
COMMENT ON COLUMN push_notification_logs.user_type IS 'نوع المستخدم (سائق أو متجر)';
COMMENT ON COLUMN push_notification_logs.notification_type IS 'نوع الإشعار';
COMMENT ON COLUMN push_notification_logs.title IS 'عنوان الإشعار';
COMMENT ON COLUMN push_notification_logs.body IS 'محتوى الإشعار';
COMMENT ON COLUMN push_notification_logs.data IS 'بيانات إضافية للإشعار';
COMMENT ON COLUMN push_notification_logs.sent_at IS 'تاريخ إرسال الإشعار';
COMMENT ON COLUMN push_notification_logs.status IS 'حالة الإشعار';
COMMENT ON COLUMN push_notification_logs.error_message IS 'رسالة الخطأ في حالة الفشل';
COMMENT ON COLUMN push_notification_logs.expo_response IS 'استجابة Expo Push Service';

-- إنشاء دالة لتحديث توكن الإشعارات
CREATE OR REPLACE FUNCTION update_push_token(
    p_user_id INTEGER,
    p_user_type VARCHAR(20),
    p_token TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_user_type = 'driver' THEN
        UPDATE drivers 
        SET expo_push_token = p_token, token_updated_at = NOW()
        WHERE id = p_user_id;
        RETURN FOUND;
    ELSIF p_user_type = 'store' THEN
        UPDATE stores 
        SET expo_push_token = p_token, token_updated_at = NOW()
        WHERE id = p_user_id;
        RETURN FOUND;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لتسجيل إشعار Push
CREATE OR REPLACE FUNCTION log_push_notification(
    p_user_id INTEGER,
    p_user_type VARCHAR(20),
    p_notification_type VARCHAR(50),
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'sent',
    p_error_message TEXT DEFAULT NULL,
    p_expo_response JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_log_id INTEGER;
BEGIN
    INSERT INTO push_notification_logs (
        user_id, user_type, notification_type, title, body, 
        data, status, error_message, expo_response
    ) VALUES (
        p_user_id, p_user_type, p_notification_type, p_title, p_body,
        p_data, p_status, p_error_message, p_expo_response
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لجلب إحصائيات الإشعارات
CREATE OR REPLACE FUNCTION get_push_notification_stats(
    p_user_id INTEGER DEFAULT NULL,
    p_user_type VARCHAR(20) DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_sent BIGINT,
    total_delivered BIGINT,
    total_failed BIGINT,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_sent,
        COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as total_delivered,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as total_failed,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / 
             NULLIF(COUNT(*), 0)::NUMERIC) * 100, 2
        ) as success_rate
    FROM push_notification_logs
    WHERE sent_at >= NOW() - INTERVAL '1 day' * p_days
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_user_type IS NULL OR user_type = p_user_type);
END;
$$ LANGUAGE plpgsql;

-- إضافة RLS policies لجدول السجلات
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة: المستخدم يمكنه قراءة سجلاته فقط
CREATE POLICY "Users can read their own push notification logs" ON push_notification_logs
    FOR SELECT USING (
        (user_type = 'driver' AND user_id IN (
            SELECT id FROM drivers WHERE id = user_id
        )) OR
        (user_type = 'store' AND user_id IN (
            SELECT id FROM stores WHERE id = user_id
        ))
    );

-- سياسة للإدراج: المدير يمكنه إدراج سجلات جديدة
CREATE POLICY "Admins can insert push notification logs" ON push_notification_logs
    FOR INSERT WITH CHECK (true);

-- سياسة للتحديث: المدير يمكنه تحديث السجلات
CREATE POLICY "Admins can update push notification logs" ON push_notification_logs
    FOR UPDATE USING (true);

-- سياسة للحذف: المدير يمكنه حذف السجلات
CREATE POLICY "Admins can delete push notification logs" ON push_notification_logs
    FOR DELETE USING (true);

-- إنشاء عرض لسهولة الوصول للإحصائيات
CREATE OR REPLACE VIEW push_notification_summary AS
SELECT 
    user_type,
    notification_type,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / 
         NULLIF(COUNT(*), 0)::NUMERIC) * 100, 2
    ) as success_rate,
    DATE_TRUNC('day', sent_at) as date
FROM push_notification_logs
GROUP BY user_type, notification_type, DATE_TRUNC('day', sent_at)
ORDER BY date DESC, user_type, notification_type;

-- إضافة تعليق على العرض
COMMENT ON VIEW push_notification_summary IS 'ملخص إحصائيات الإشعارات Push حسب النوع والتاريخ';
