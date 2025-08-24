-- إضافة حقول Push Token للسائقين والمتاجر
-- هذا الملف يضيف دعم Push Notifications للتطبيق

-- إضافة حقل push_token للسائقين
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS token_updated_at TIMESTAMP;

-- إضافة حقل push_token للمتاجر
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS token_updated_at TIMESTAMP;

-- إنشاء فهرس على push_token لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_drivers_push_token ON drivers(push_token) WHERE push_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_push_token ON stores(push_token) WHERE push_token IS NOT NULL;

-- إضافة حقل current_latitude و current_longitude للسائقين لتتبع الموقع الحالي
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;

-- إنشاء فهرس على إحداثيات الموقع
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers(current_latitude, current_longitude) 
WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;

-- إنشاء جدول لتتبع إرسال Push Notifications
CREATE TABLE IF NOT EXISTS push_notification_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'driver' or 'store'
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    expo_push_token TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    response_data JSONB
);

-- إنشاء فهارس لجدول السجلات
CREATE INDEX IF NOT EXISTS idx_push_logs_user ON push_notification_logs(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_push_logs_type ON push_notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_logs_sent_at ON push_notification_logs(sent_at);

-- إنشاء جدول لإعدادات الإشعارات
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'driver' or 'store'
    new_orders_enabled BOOLEAN DEFAULT true,
    order_updates_enabled BOOLEAN DEFAULT true,
    payment_notifications_enabled BOOLEAN DEFAULT true,
    system_notifications_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    quiet_hours_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, user_type)
);

-- إنشاء فهرس على إعدادات الإشعارات
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id, user_type);

-- إدخال إعدادات افتراضية للسائقين الموجودين
INSERT INTO notification_settings (user_id, user_type, new_orders_enabled, order_updates_enabled, payment_notifications_enabled, system_notifications_enabled)
SELECT id, 'driver', true, true, true, true
FROM drivers
WHERE status = 'approved'
ON CONFLICT (user_id, user_type) DO NOTHING;

-- إدخال إعدادات افتراضية للمتاجر الموجودة
INSERT INTO notification_settings (user_id, user_type, new_orders_enabled, order_updates_enabled, payment_notifications_enabled, system_notifications_enabled)
SELECT id, 'store', true, true, true, true
FROM stores
WHERE is_active = true
ON CONFLICT (user_id, user_type) DO NOTHING;

-- إنشاء دالة لتحديث موقع السائق
CREATE OR REPLACE FUNCTION update_driver_location(
    driver_id INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE drivers 
    SET 
        current_latitude = latitude,
        current_longitude = longitude,
        location_updated_at = NOW()
    WHERE id = driver_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لتحديث Push Token
CREATE OR REPLACE FUNCTION update_push_token(
    user_id INTEGER,
    user_type VARCHAR(20),
    push_token TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    IF user_type = 'driver' THEN
        UPDATE drivers 
        SET 
            push_token = push_token,
            token_updated_at = NOW()
        WHERE id = user_id;
    ELSIF user_type = 'store' THEN
        UPDATE stores 
        SET 
            push_token = push_token,
            token_updated_at = NOW()
        WHERE id = user_id;
    ELSE
        RETURN FALSE;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لتسجيل إرسال Push Notification
CREATE OR REPLACE FUNCTION log_push_notification(
    user_id INTEGER,
    user_type VARCHAR(20),
    notification_type VARCHAR(50),
    title VARCHAR(255),
    body TEXT,
    data JSONB DEFAULT NULL,
    expo_push_token TEXT DEFAULT NULL,
    success BOOLEAN,
    error_message TEXT DEFAULT NULL,
    response_data JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    log_id INTEGER;
BEGIN
    INSERT INTO push_notification_logs (
        user_id, user_type, notification_type, title, body, 
        data, expo_push_token, success, error_message, response_data
    ) VALUES (
        user_id, user_type, notification_type, title, body,
        data, expo_push_token, success, error_message, response_data
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث updated_at في جدول إعدادات الإشعارات
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_settings_updated_at();

-- إنشاء view لعرض السائقين المتاحين مع Push Tokens
CREATE OR REPLACE VIEW available_drivers_with_tokens AS
SELECT 
    d.id,
    d.name,
    d.phone,
    d.email,
    d.status,
    d.is_active,
    d.current_latitude,
    d.current_longitude,
    d.location_updated_at,
    d.push_token,
    d.token_updated_at,
    d.debt_points,
    d.total_earnings,
    d.total_orders,
    d.rating,
    d.created_at
FROM drivers d
WHERE d.status = 'approved' 
    AND d.is_active = true 
    AND d.push_token IS NOT NULL
    AND d.debt_points < 100; -- السائقين الذين لم يتجاوزوا حد الديون

-- إنشاء view لعرض المتاجر النشطة مع Push Tokens
CREATE OR REPLACE VIEW active_stores_with_tokens AS
SELECT 
    s.id,
    s.name,
    s.phone,
    s.email,
    s.address,
    s.category,
    s.is_active,
    s.push_token,
    s.token_updated_at,
    s.total_orders,
    s.total_revenue,
    s.rating,
    s.created_at
FROM stores s
WHERE s.is_active = true 
    AND s.push_token IS NOT NULL;

-- إضافة تعليقات توضيحية
COMMENT ON TABLE push_notification_logs IS 'جدول لتتبع إرسال Push Notifications';
COMMENT ON TABLE notification_settings IS 'جدول لإعدادات الإشعارات لكل مستخدم';
COMMENT ON COLUMN drivers.push_token IS 'Expo Push Token للسائق';
COMMENT ON COLUMN stores.push_token IS 'Expo Push Token للمتجر';
COMMENT ON COLUMN drivers.current_latitude IS 'خط العرض الحالي للسائق';
COMMENT ON COLUMN drivers.current_longitude IS 'خط الطول الحالي للسائق';
COMMENT ON COLUMN drivers.location_updated_at IS 'آخر تحديث لموقع السائق';
COMMENT ON COLUMN drivers.token_updated_at IS 'آخر تحديث لـ Push Token';
COMMENT ON COLUMN stores.token_updated_at IS 'آخر تحديث لـ Push Token';

-- عرض رسالة نجاح
SELECT 'تم إضافة دعم Push Notifications بنجاح!' AS message;
