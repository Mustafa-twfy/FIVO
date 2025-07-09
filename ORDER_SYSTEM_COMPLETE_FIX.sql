-- =====================================================
-- إصلاح شامل لنظام الطلبات - توصيل بلس
-- =====================================================

-- 1. حذف الجدول القديم إذا كان موجوداً
DROP TABLE IF EXISTS orders CASCADE;

-- 2. إنشاء جدول الطلبات المحسن
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) DEFAULT 'عميل',
    customer_phone VARCHAR(20) NOT NULL,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    items_description TEXT,
    description TEXT, -- حقل إضافي للتوافق مع الكود
    phone VARCHAR(20), -- حقل إضافي للتوافق مع الكود
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, completed, cancelled, rejected
    payment_method VARCHAR(20) DEFAULT 'cash', -- cash, card, online
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
    is_urgent BOOLEAN DEFAULT false, -- طلب عاجل
    priority_score DECIMAL(5,2) DEFAULT 0, -- نقاط الأولوية
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    accepted_at TIMESTAMP, -- وقت قبول الطلب
    cancelled_at TIMESTAMP, -- وقت إلغاء الطلب
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    notes TEXT, -- ملاحظات إضافية
    cancellation_reason TEXT, -- سبب الإلغاء
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_is_urgent ON orders(is_urgent);
CREATE INDEX IF NOT EXISTS idx_orders_priority_score ON orders(priority_score);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);

-- 4. إنشاء دالة لحساب نقاط الأولوية
CREATE OR REPLACE FUNCTION calculate_order_priority(
    is_urgent BOOLEAN,
    total_amount DECIMAL,
    created_at TIMESTAMP
)
RETURNS DECIMAL AS $$
DECLARE
    urgency_score DECIMAL := 0;
    amount_score DECIMAL := 0;
    time_score DECIMAL := 0;
    total_score DECIMAL := 0;
BEGIN
    -- نقاط الطلب العاجل
    IF is_urgent THEN
        urgency_score := 50;
    END IF;
    
    -- نقاط المبلغ (كل 10 دينار = نقطة واحدة)
    amount_score := total_amount / 10;
    
    -- نقاط الوقت (كل ساعة = نقطة واحدة، بحد أقصى 24 نقطة)
    time_score := LEAST(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600, 24);
    
    -- النتيجة النهائية
    total_score := urgency_score + amount_score + time_score;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- 5. إنشاء trigger لتحديث نقاط الأولوية تلقائياً
CREATE OR REPLACE FUNCTION update_order_priority()
RETURNS TRIGGER AS $$
BEGIN
    NEW.priority_score := calculate_order_priority(
        NEW.is_urgent,
        NEW.total_amount,
        NEW.created_at
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_priority
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_priority();

-- 6. إنشاء دالة لتحديث حالة الطلب
CREATE OR REPLACE FUNCTION update_order_status(
    order_id INTEGER,
    new_status VARCHAR(20),
    driver_id_param INTEGER DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(20);
    current_driver_id INTEGER;
BEGIN
    -- جلب الحالة الحالية
    SELECT status, driver_id INTO current_status, current_driver_id
    FROM orders WHERE id = order_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- التحقق من صحة التحديث
    IF new_status = 'accepted' AND current_status != 'pending' THEN
        RETURN FALSE;
    END IF;
    
    IF new_status = 'completed' AND current_status != 'accepted' THEN
        RETURN FALSE;
    END IF;
    
    -- تحديث الطلب
    UPDATE orders SET
        status = new_status,
        driver_id = COALESCE(driver_id_param, driver_id),
        notes = COALESCE(notes_param, notes),
        updated_at = NOW()
    WHERE id = order_id;
    
    -- إضافة timestamps حسب الحالة
    CASE new_status
        WHEN 'accepted' THEN
            UPDATE orders SET accepted_at = NOW() WHERE id = order_id;
        WHEN 'cancelled' THEN
            UPDATE orders SET cancelled_at = NOW() WHERE id = order_id;
        WHEN 'completed' THEN
            UPDATE orders SET actual_delivery_time = NOW() WHERE id = order_id;
    END CASE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. إنشاء دالة لجلب الطلبات المتاحة مع الأولوية
CREATE OR REPLACE FUNCTION get_available_orders()
RETURNS TABLE (
    id INTEGER,
    store_id INTEGER,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    pickup_address TEXT,
    delivery_address TEXT,
    items_description TEXT,
    total_amount DECIMAL(10,2),
    is_urgent BOOLEAN,
    priority_score DECIMAL(5,2),
    created_at TIMESTAMP,
    store_name VARCHAR(255),
    store_phone VARCHAR(20),
    store_category VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.store_id,
        o.customer_name,
        o.customer_phone,
        o.pickup_address,
        o.delivery_address,
        o.items_description,
        o.total_amount,
        o.is_urgent,
        o.priority_score,
        o.created_at,
        s.name as store_name,
        s.phone as store_phone,
        s.category as store_category
    FROM orders o
    JOIN stores s ON o.store_id = s.id
    WHERE o.status = 'pending'
    ORDER BY o.priority_score DESC, o.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- 8. إدخال بيانات تجريبية للطلبات
INSERT INTO orders (
    store_id, 
    customer_name, 
    customer_phone, 
    pickup_address, 
    delivery_address, 
    items_description, 
    total_amount, 
    status, 
    is_urgent,
    description,
    phone
) VALUES
-- طلبات عادية
(1, 'أحمد محمد', '07801234567', 'مطعم الشرق، شارع الملك فهد', 'حي النزهة، الرياض', 'برجر دجاج + بطاطس + مشروب', 45.00, 'pending', false, 'برجر دجاج + بطاطس + مشروب', '07801234567'),
(2, 'فاطمة علي', '07901234567', 'صيدلية النور، شارع التحلية', 'حي الكورنيش، جدة', 'أدوية بوصفة طبية', 120.00, 'pending', false, 'أدوية بوصفة طبية', '07901234567'),
(3, 'خالد حسن', '07701234567', 'مخبز الأصالة، شارع العليا', 'حي الشاطئ، الدمام', 'خبز عربي + حلويات', 35.00, 'pending', false, 'خبز عربي + حلويات', '07701234567'),

-- طلبات عاجلة
(1, 'سارة أحمد', '07811234567', 'مطعم الشرق، شارع الملك فهد', 'حي النزهة، الرياض', 'برجر لحم عاجل', 55.00, 'pending', true, 'برجر لحم عاجل', '07811234567'),
(2, 'محمد علي', '07911234567', 'صيدلية النور، شارع التحلية', 'حي الكورنيش، جدة', 'أدوية طوارئ', 200.00, 'pending', true, 'أدوية طوارئ', '07911234567'),

-- طلبات مكتملة
(1, 'علي محمد', '07821234567', 'مطعم الشرق، شارع الملك فهد', 'حي النزهة، الرياض', 'بيتزا كبيرة', 65.00, 'completed', false, 'بيتزا كبيرة', '07821234567'),
(2, 'نورا أحمد', '07921234567', 'صيدلية النور، شارع التحلية', 'حي الكورنيش، جدة', 'فيتامينات', 80.00, 'completed', false, 'فيتامينات', '07921234567'),

-- طلبات مقبولة
(3, 'حسن علي', '07711234567', 'مخبز الأصالة، شارع العليا', 'حي الشاطئ، الدمام', 'كيك عيد الميلاد', 150.00, 'accepted', false, 'كيك عيد الميلاد', '07711234567');

-- 9. إنشاء دالة لإحصائيات الطلبات
CREATE OR REPLACE FUNCTION get_order_statistics(store_id_param INTEGER DEFAULT NULL)
RETURNS TABLE (
    total_orders INTEGER,
    pending_orders INTEGER,
    accepted_orders INTEGER,
    completed_orders INTEGER,
    cancelled_orders INTEGER,
    total_revenue DECIMAL(10,2),
    urgent_orders INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::INTEGER as pending_orders,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END)::INTEGER as accepted_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::INTEGER as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COUNT(CASE WHEN is_urgent = true THEN 1 END)::INTEGER as urgent_orders
    FROM orders
    WHERE (store_id_param IS NULL OR store_id = store_id_param);
END;
$$ LANGUAGE plpgsql;

-- 10. إنشاء دالة لإشعارات الطلبات
CREATE OR REPLACE FUNCTION notify_order_update(
    order_id INTEGER,
    notification_type VARCHAR(50)
)
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
    notification_title VARCHAR(255);
    notification_message TEXT;
BEGIN
    -- جلب معلومات الطلب
    SELECT o.*, s.name as store_name, d.name as driver_name
    INTO order_record
    FROM orders o
    LEFT JOIN stores s ON o.store_id = s.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    WHERE o.id = order_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- إنشاء الإشعار حسب النوع
    CASE notification_type
        WHEN 'order_created' THEN
            notification_title := 'طلب جديد';
            notification_message := format('تم إنشاء طلب جديد رقم #%s من %s', order_id, order_record.store_name);
            
        WHEN 'order_accepted' THEN
            notification_title := 'تم قبول الطلب';
            notification_message := format('تم قبول طلبك رقم #%s من قبل السائق %s', order_id, order_record.driver_name);
            
        WHEN 'order_completed' THEN
            notification_title := 'تم إكمال الطلب';
            notification_message := format('تم إكمال طلبك رقم #%s بنجاح', order_id);
            
        WHEN 'order_cancelled' THEN
            notification_title := 'تم إلغاء الطلب';
            notification_message := format('تم إلغاء طلبك رقم #%s', order_id);
    END CASE;
    
    -- إرسال إشعار للمتجر
    INSERT INTO store_notifications (store_id, title, message, type)
    VALUES (order_record.store_id, notification_title, notification_message, 'order');
    
    -- إرسال إشعار للسائق إذا كان موجود
    IF order_record.driver_id IS NOT NULL THEN
        INSERT INTO notifications (driver_id, title, message, type)
        VALUES (order_record.driver_id, notification_title, notification_message, 'order');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 11. إنشاء trigger لإرسال الإشعارات تلقائياً
CREATE OR REPLACE FUNCTION trigger_order_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- إشعار إنشاء طلب جديد
    IF TG_OP = 'INSERT' THEN
        PERFORM notify_order_update(NEW.id, 'order_created');
    END IF;
    
    -- إشعار تحديث حالة الطلب
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'accepted' THEN
                    PERFORM notify_order_update(NEW.id, 'order_accepted');
                WHEN 'completed' THEN
                    PERFORM notify_order_update(NEW.id, 'order_completed');
                WHEN 'cancelled' THEN
                    PERFORM notify_order_update(NEW.id, 'order_cancelled');
            END CASE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_notifications
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_notifications();

COMMIT;

-- رسالة نجاح
SELECT 'تم إصلاح نظام الطلبات بنجاح!' AS message; 