-- تحديث جدول registration_requests لإضافة الحقول المطلوبة
-- تشغيل هذا الملف في SQL Editor في Supabase

-- إضافة الحقول الجديدة إلى جدول registration_requests
ALTER TABLE registration_requests 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS national_card_front TEXT,
ADD COLUMN IF NOT EXISTS national_card_back TEXT,
ADD COLUMN IF NOT EXISTS residence_card_front TEXT,
ADD COLUMN IF NOT EXISTS residence_card_back TEXT;

-- التحقق من أن الجدول تم تحديثه بنجاح
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'registration_requests' 
ORDER BY ordinal_position; 