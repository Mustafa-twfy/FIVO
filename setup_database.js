// سكريبت إنشاء قاعدة البيانات
// تشغيل: node setup_database.js

const { createClient } = require('@supabase/supabase-js');

// بيانات الاتصال - حدث هذه البيانات
const SUPABASE_URL = 'https://nzxmhpigoeexuadrnith.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eG1ocGlnb2VleHVhZHJuaXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTE4MDcsImV4cCI6MjA2NjI4NzgwN30.2m_HhlKIlI1D6TN976zNJT-T8axXLAfUIOcOD1TPgUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// أوامر SQL لإنشاء الجداول
const createTablesSQL = `
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
    status VARCHAR(20) DEFAULT 'pending',
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
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'pending',
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    driver_rating INTEGER,
    customer_rating INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
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

-- إنشاء جدول رسائل الدعم الفني
CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id),
    message TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_by_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول رسائل دعم المتاجر
CREATE TABLE IF NOT EXISTS store_support_messages (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    message TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,
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
    type VARCHAR(50) DEFAULT 'bonus',
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الغرامات
CREATE TABLE IF NOT EXISTS fines (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول المستخدمين المحظورين
CREATE TABLE IF NOT EXISTS banned_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL,
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
    user_type VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(100),
    vehicle_number VARCHAR(50),
    national_card_front TEXT,
    national_card_back TEXT,
    residence_card_front TEXT,
    residence_card_back TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء الفهارس
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

-- إنشاء دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء triggers
DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// دالة إنشاء الجداول
async function createTables() {
    console.log('بدء إنشاء الجداول...');
    
    try {
        // تقسيم أوامر SQL إلى أوامر منفصلة
        const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    const { error } = await supabase.rpc('exec_sql', {
                        sql_query: statement
                    });
                    
                    if (error) {
                        console.log(`خطأ في الأمر ${i + 1}:`, error.message);
                    } else {
                        console.log(`تم تنفيذ الأمر ${i + 1} بنجاح`);
                    }
                } catch (err) {
                    console.log(`خطأ في تنفيذ الأمر ${i + 1}:`, err.message);
                }
            }
        }
        
        console.log('تم إنشاء الجداول بنجاح!');
        
        // إدخال بيانات تجريبية
        await insertSampleData();
        
    } catch (error) {
        console.error('خطأ في إنشاء الجداول:', error);
    }
}

// دالة إدخال بيانات تجريبية
async function insertSampleData() {
    console.log('إدخال البيانات التجريبية...');
    
    try {
        // إدخال سائقين تجريبيين
        const { error: driversError } = await supabase
            .from('drivers')
            .upsert([
                {
                    email: 'driver1@tawseel.com',
                    password: 'password123',
                    name: 'أحمد محمد',
                    phone: '+966501234567',
                    vehicle_type: 'سيارة نقل صغيرة',
                    status: 'approved',
                    is_active: true
                },
                {
                    email: 'driver2@tawseel.com',
                    password: 'password123',
                    name: 'محمد علي',
                    phone: '+966502345678',
                    vehicle_type: 'دراجة نارية',
                    status: 'approved',
                    is_active: true
                }
            ], { onConflict: 'email' });
            
        if (driversError) {
            console.log('خطأ في إدخال السائقين:', driversError.message);
        } else {
            console.log('تم إدخال السائقين بنجاح');
        }
        
        // إدخال متاجر تجريبية
        const { error: storesError } = await supabase
            .from('stores')
            .upsert([
                {
                    email: 'store1@tawseel.com',
                    password: 'password123',
                    name: 'مطعم الشرق',
                    phone: '+966504567890',
                    address: 'شارع الملك فهد، الرياض',
                    category: 'مطاعم',
                    is_active: true
                },
                {
                    email: 'store2@tawseel.com',
                    password: 'password123',
                    name: 'صيدلية النور',
                    phone: '+966505678901',
                    address: 'شارع التحلية، جدة',
                    category: 'صيدليات',
                    is_active: true
                }
            ], { onConflict: 'email' });
            
        if (storesError) {
            console.log('خطأ في إدخال المتاجر:', storesError.message);
        } else {
            console.log('تم إدخال المتاجر بنجاح');
        }
        
        console.log('تم إدخال جميع البيانات التجريبية بنجاح!');
        
    } catch (error) {
        console.error('خطأ في إدخال البيانات التجريبية:', error);
    }
}

// تشغيل السكريبت
if (require.main === module) {
    createTables().then(() => {
        console.log('تم الانتهاء من إعداد قاعدة البيانات!');
        process.exit(0);
    }).catch((error) => {
        console.error('خطأ في إعداد قاعدة البيانات:', error);
        process.exit(1);
    });
}

module.exports = { createTables, insertSampleData }; 