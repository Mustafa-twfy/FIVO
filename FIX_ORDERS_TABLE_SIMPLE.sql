-- إصلاح بسيط لجدول الطلبات
-- =====================================================

-- 1. حذف الجدول القديم
DROP TABLE IF EXISTS orders CASCADE;

-- 2. إنشاء جدول الطلبات الجديد
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) DEFAULT 'عميل',
    customer_phone VARCHAR(20) NOT NULL,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    items_description TEXT,
    description TEXT,
    phone VARCHAR(20),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'pending',
    is_urgent BOOLEAN DEFAULT false,
    priority_score DECIMAL(5,2) DEFAULT 0,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    accepted_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. إنشاء فهارس
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_is_urgent ON orders(is_urgent);
CREATE INDEX idx_orders_priority_score ON orders(priority_score);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 4. التحقق من المتاجر الموجودة أولاً
DO $$
DECLARE
    store_count INTEGER;
    driver_count INTEGER;
BEGIN
    -- التحقق من عدد المتاجر
    SELECT COUNT(*) INTO store_count FROM stores;
    RAISE NOTICE 'عدد المتاجر الموجودة: %', store_count;
    
    -- التحقق من عدد السائقين
    SELECT COUNT(*) INTO driver_count FROM drivers;
    RAISE NOTICE 'عدد السائقين الموجودين: %', driver_count;
    
    -- إدخال بيانات تجريبية فقط إذا كانت المتاجر موجودة
    IF store_count > 0 THEN
        -- إدخال بيانات تجريبية باستخدام المتاجر الموجودة فقط
        INSERT INTO orders (
            store_id, 
            customer_name, 
            customer_phone, 
            pickup_address, 
            delivery_address, 
            items_description, 
            description,
            phone,
            total_amount, 
            status, 
            is_urgent
        ) 
        SELECT 
            1, 
            'أحمد محمد', 
            '07801234567', 
            'مطعم الشرق، الرياض', 
            'حي النزهة، الرياض', 
            'برجر دجاج + بطاطس', 
            'برجر دجاج + بطاطس', 
            '07801234567', 
            45.00, 
            'pending', 
            false
        WHERE EXISTS (SELECT 1 FROM stores WHERE id = 1);
        
        INSERT INTO orders (
            store_id, 
            customer_name, 
            customer_phone, 
            pickup_address, 
            delivery_address, 
            items_description, 
            description,
            phone,
            total_amount, 
            status, 
            is_urgent
        ) 
        SELECT 
            2, 
            'فاطمة علي', 
            '07901234567', 
            'صيدلية النور، جدة', 
            'حي الكورنيش، جدة', 
            'أدوية بوصفة طبية', 
            'أدوية بوصفة طبية', 
            '07901234567', 
            120.00, 
            'pending', 
            false
        WHERE EXISTS (SELECT 1 FROM stores WHERE id = 2);
        
        INSERT INTO orders (
            store_id, 
            customer_name, 
            customer_phone, 
            pickup_address, 
            delivery_address, 
            items_description, 
            description,
            phone,
            total_amount, 
            status, 
            is_urgent
        ) 
        SELECT 
            1, 
            'سارة أحمد', 
            '07811234567', 
            'مطعم الشرق، الرياض', 
            'حي النزهة، الرياض', 
            'برجر لحم عاجل', 
            'برجر لحم عاجل', 
            '07811234567', 
            55.00, 
            'pending', 
            true
        WHERE EXISTS (SELECT 1 FROM stores WHERE id = 1);
        
        INSERT INTO orders (
            store_id, 
            customer_name, 
            customer_phone, 
            pickup_address, 
            delivery_address, 
            items_description, 
            description,
            phone,
            total_amount, 
            status, 
            is_urgent
        ) 
        SELECT 
            2, 
            'محمد علي', 
            '07911234567', 
            'صيدلية النور، جدة', 
            'حي الكورنيش، جدة', 
            'أدوية طوارئ', 
            'أدوية طوارئ', 
            '07911234567', 
            200.00, 
            'pending', 
            true
        WHERE EXISTS (SELECT 1 FROM stores WHERE id = 2);
        
        RAISE NOTICE 'تم إدخال البيانات التجريبية بنجاح';
    ELSE
        RAISE NOTICE 'لا توجد متاجر في قاعدة البيانات. سيتم إنشاء طلبات فارغة.';
    END IF;
END $$;

-- 5. تحديث نقاط الأولوية
UPDATE orders SET 
    priority_score = CASE 
        WHEN is_urgent THEN 50 + (total_amount / 10)
        ELSE (total_amount / 10)
    END;

COMMIT;

SELECT 'تم إصلاح جدول الطلبات بنجاح!' AS message; 