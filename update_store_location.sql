-- =====================================================
-- تحديث قاعدة البيانات لإضافة حقول GPS للمتاجر
-- =====================================================

-- إضافة حقول GPS إلى جدول المتاجر
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- إضافة حقول GPS إلى جدول طلبات التسجيل
ALTER TABLE registration_requests 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- إضافة حقول المستندات للمتاجر في جدول طلبات التسجيل
ALTER TABLE registration_requests 
ADD COLUMN IF NOT EXISTS commercial_record TEXT,
ADD COLUMN IF NOT EXISTS tax_certificate TEXT,
ADD COLUMN IF NOT EXISTS id_card TEXT;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_registration_requests_location ON registration_requests(latitude, longitude);

-- إضافة تعليقات على الأعمدة الجديدة
COMMENT ON COLUMN stores.latitude IS 'خط العرض لموقع المتجر';
COMMENT ON COLUMN stores.longitude IS 'خط الطول لموقع المتجر';
COMMENT ON COLUMN registration_requests.latitude IS 'خط العرض لموقع المتجر في طلب التسجيل';
COMMENT ON COLUMN registration_requests.longitude IS 'خط الطول لموقع المتجر في طلب التسجيل';
COMMENT ON COLUMN registration_requests.commercial_record IS 'رابط السجل التجاري';
COMMENT ON COLUMN registration_requests.tax_certificate IS 'رابط الشهادة الضريبية';
COMMENT ON COLUMN registration_requests.id_card IS 'رابط الهوية الوطنية';

-- إنشاء دالة لحساب المسافة بين نقطتين
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, 
    lon1 DECIMAL, 
    lat2 DECIMAL, 
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        6371 * acos(
            cos(radians(lat1)) * 
            cos(radians(lat2)) * 
            cos(radians(lon2) - radians(lon1)) + 
            sin(radians(lat1)) * 
            sin(radians(lat2))
        )
    );
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة للبحث عن المتاجر القريبة
CREATE OR REPLACE FUNCTION find_nearby_stores(
    user_lat DECIMAL,
    user_lon DECIMAL,
    max_distance DECIMAL DEFAULT 10
) RETURNS TABLE(
    id INTEGER,
    name VARCHAR,
    address TEXT,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.address,
        calculate_distance(user_lat, user_lon, s.latitude, s.longitude) as distance
    FROM stores s
    WHERE s.is_active = true 
    AND s.latitude IS NOT NULL 
    AND s.longitude IS NOT NULL
    AND calculate_distance(user_lat, user_lon, s.latitude, s.longitude) <= max_distance
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql; 