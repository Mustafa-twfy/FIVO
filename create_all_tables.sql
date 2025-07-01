-- =====================================================
-- ملف إنشاء جميع الجداول في Supabase
-- =====================================================

-- إنشاء جدول السائقين
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    vehicle_type VARCHAR(100),
    vehicle_number VARCHAR(50),
    national_card_front TEXT,
    national_card_back TEXT,
    residence_card_front TEXT,
    residence_card_back TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, suspended
    is_active BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    suspended_at TIMESTAMP,
    debt DECIMAL(10,2) DEFAULT 0,
    debt_points INTEGER DEFAULT 0,
    work_start_time TIME,
    work_end_time TIME,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول المتاجر
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    latitude DECIMAL(10, 8), -- خط العرض
    longitude DECIMAL(11, 8), -- خط الطول
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    driver_id INTEGER REFERENCES drivers(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    items_description TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, assigned, picked_up, delivered, cancelled
    payment_method VARCHAR(20) DEFAULT 'cash', -- cash, card, online
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    driver_rating INTEGER,
    customer_rating INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الإشعارات للسائقين
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- general, order, payment, system
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول إشعارات المتاجر
CREATE TABLE IF NOT EXISTS store_notifications (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول رسائل الدعم الفني للسائقين
CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id),
    message TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL, -- driver, admin
    is_read BOOLEAN DEFAULT false,
    read_by_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول رسائل دعم المتاجر
CREATE TABLE IF NOT EXISTS store_support_messages (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    message TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL, -- store, admin
    is_read BOOLEAN DEFAULT false,
    read_by_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول المكافآت
CREATE TABLE IF NOT EXISTS rewards (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id),
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'bonus', -- bonus, incentive, referral
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الغرامات
CREATE TABLE IF NOT EXISTS fines (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, paid, waived
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول المستخدمين المحظورين
CREATE TABLE IF NOT EXISTS banned_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- driver, store
    reason TEXT NOT NULL,
    banned_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول طلبات التسجيل
CREATE TABLE IF NOT EXISTS registration_requests (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    latitude DECIMAL(10, 8), -- خط العرض للمتجر
    longitude DECIMAL(11, 8), -- خط الطول للمتجر
    user_type VARCHAR(20) NOT NULL, -- driver, store
    vehicle_type VARCHAR(100),
    vehicle_number VARCHAR(50),
    national_card_front TEXT,
    national_card_back TEXT,
    residence_card_front TEXT,
    residence_card_back TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    rejection_reason TEXT,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول إعدادات النظام العامة
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  debt_point_value INTEGER DEFAULT 250, -- قيمة النقطة بالدينار
  max_debt_points INTEGER DEFAULT 20,  -- الحد الأقصى للنقاط
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدخال إعدادات افتراضية إذا لم تكن موجودة
INSERT INTO system_settings (debt_point_value, max_debt_points)
SELECT 250, 20
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_stores_email ON stores(email);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_driver_id ON notifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_store_notifications_store_id ON store_notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_driver_id ON support_messages(driver_id);
CREATE INDEX IF NOT EXISTS idx_store_support_messages_store_id ON store_support_messages(store_id);
CREATE INDEX IF NOT EXISTS idx_rewards_driver_id ON rewards(driver_id);
CREATE INDEX IF NOT EXISTS idx_fines_driver_id ON fines(driver_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إدخال بيانات تجريبية للسائقين
INSERT INTO drivers (email, password, name, phone, vehicle_type, status, is_active) VALUES
('driver1@tawseel.com', 'password123', 'أحمد محمد', '+966501234567', 'سيارة نقل صغيرة', 'approved', true),
('driver2@tawseel.com', 'password123', 'محمد علي', '+966502345678', 'دراجة نارية', 'approved', true),
('driver3@tawseel.com', 'password123', 'علي حسن', '+966503456789', 'سيارة نقل متوسطة', 'pending', false)
ON CONFLICT (email) DO NOTHING;

-- إدخال بيانات تجريبية للمتاجر
INSERT INTO stores (email, password, name, phone, address, category, is_active) VALUES
('store1@tawseel.com', 'password123', 'مطعم الشرق', '+966504567890', 'شارع الملك فهد، الرياض', 'مطاعم', true),
('store2@tawseel.com', 'password123', 'صيدلية النور', '+966505678901', 'شارع التحلية، جدة', 'صيدليات', true),
('store3@tawseel.com', 'password123', 'مخبز الأصالة', '+966506789012', 'شارع العليا، الدمام', 'مخابز', true)
ON CONFLICT (email) DO NOTHING;

-- إدخال بيانات تجريبية للطلبات
INSERT INTO orders (store_id, driver_id, customer_name, customer_phone, pickup_address, delivery_address, items_description, total_amount, status) VALUES
(1, 1, 'فاطمة أحمد', '+966507890123', 'مطعم الشرق، الرياض', 'حي النزهة، الرياض', 'برجر دجاج + بطاطس', 45.00, 'delivered'),
(2, 2, 'خالد محمد', '+966508901234', 'صيدلية النور، جدة', 'حي الكورنيش، جدة', 'أدوية بوصفة طبية', 120.00, 'assigned'),
(3, 1, 'سارة علي', '+966509012345', 'مخبز الأصالة، الدمام', 'حي الشاطئ، الدمام', 'خبز عربي + حلويات', 35.00, 'pending')
ON CONFLICT DO NOTHING;

-- إدخال بيانات تجريبية للإشعارات
INSERT INTO notifications (driver_id, title, message, type) VALUES
(1, 'طلب جديد', 'لديك طلب جديد من مطعم الشرق', 'order'),
(2, 'تحديث الحالة', 'تم تحديث حالة طلبك إلى "تم التوصيل"', 'system'),
(1, 'مكافأة', 'مبروك! حصلت على مكافأة 50 ريال', 'payment')
ON CONFLICT DO NOTHING;

-- إدخال بيانات تجريبية لرسائل الدعم الفني
INSERT INTO support_messages (driver_id, message, sender) VALUES
(1, 'أحتاج مساعدة في تحديث بياناتي', 'driver'),
(1, 'تم استلام رسالتك وسيتم الرد عليك قريباً', 'admin'),
(2, 'مشكلة في تسجيل الدخول', 'driver')
ON CONFLICT DO NOTHING;

-- إدخال بيانات تجريبية للمكافآت
INSERT INTO rewards (driver_id, amount, reason, type, status) VALUES
(1, 50.00, 'أداء ممتاز', 'bonus', 'paid'),
(2, 30.00, 'توصيل سريع', 'incentive', 'pending'),
(1, 25.00, 'إحالة سائق جديد', 'referral', 'paid')
ON CONFLICT DO NOTHING;

-- إدخال بيانات تجريبية لطلبات التسجيل
INSERT INTO registration_requests (email, password, name, phone, user_type, status) VALUES
('nmcmilli07@gmail.com', 'password123', 'سائق تجريبي', '+966501234567', 'driver', 'pending')
ON CONFLICT (email) DO NOTHING;

-- تم إنشاء جميع الجداول بنجاح! 