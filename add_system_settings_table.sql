-- إنشاء جدول إعدادات النظام إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    debt_point_value INTEGER DEFAULT 250,
    max_debt_points INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- إدراج القيم الافتراضية إذا لم تكن موجودة
INSERT INTO system_settings (id, debt_point_value, max_debt_points)
VALUES (1, 250, 20)
ON CONFLICT (id) DO NOTHING;

-- إنشاء index إذا لم يكن موجوداً
CREATE INDEX IF NOT EXISTS idx_system_settings_id ON system_settings(id);

-- إنشاء أو استبدال دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- حذف trigger إذا كان موجوداً ثم إنشاؤه من جديد
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;

-- إنشاء trigger جديد
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT * FROM system_settings; 