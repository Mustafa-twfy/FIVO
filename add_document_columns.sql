-- =====================================================
-- إضافة أعمدة المستندات إلى قاعدة البيانات
-- =====================================================

-- إضافة أعمدة المستندات إلى جدول طلبات التسجيل
ALTER TABLE registration_requests 
ADD COLUMN IF NOT EXISTS national_card_front TEXT,
ADD COLUMN IF NOT EXISTS national_card_back TEXT,
ADD COLUMN IF NOT EXISTS residence_card_front TEXT,
ADD COLUMN IF NOT EXISTS residence_card_back TEXT;

-- إضافة أعمدة المستندات إلى جدول السائقين
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS national_card_front TEXT,
ADD COLUMN IF NOT EXISTS national_card_back TEXT,
ADD COLUMN IF NOT EXISTS residence_card_front TEXT,
ADD COLUMN IF NOT EXISTS residence_card_back TEXT;

-- إضافة تعليقات على الأعمدة للتوضيح
COMMENT ON COLUMN registration_requests.national_card_front IS 'صورة البطاقة الوطنية (الوجه) - Base64';
COMMENT ON COLUMN registration_requests.national_card_back IS 'صورة البطاقة الوطنية (الظهر) - Base64';
COMMENT ON COLUMN registration_requests.residence_card_front IS 'صورة بطاقة السكن (الوجه) - Base64';
COMMENT ON COLUMN registration_requests.residence_card_back IS 'صورة بطاقة السكن (الظهر) - Base64';

COMMENT ON COLUMN drivers.national_card_front IS 'صورة البطاقة الوطنية (الوجه) - Base64';
COMMENT ON COLUMN drivers.national_card_back IS 'صورة البطاقة الوطنية (الظهر) - Base64';
COMMENT ON COLUMN drivers.residence_card_front IS 'صورة بطاقة السكن (الوجه) - Base64';
COMMENT ON COLUMN drivers.residence_card_back IS 'صورة بطاقة السكن (الظهر) - Base64';

-- التحقق من إضافة الأعمدة
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'registration_requests' 
    AND column_name IN ('national_card_front', 'national_card_back', 'residence_card_front', 'residence_card_back');

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'drivers' 
    AND column_name IN ('national_card_front', 'national_card_back', 'residence_card_front', 'residence_card_back');

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE 'تم إضافة أعمدة المستندات بنجاح!';
    RAISE NOTICE 'الأعمدة المضافة:';
    RAISE NOTICE '- national_card_front (TEXT)';
    RAISE NOTICE '- national_card_back (TEXT)';
    RAISE NOTICE '- residence_card_front (TEXT)';
    RAISE NOTICE '- residence_card_back (TEXT)';
END $$;
