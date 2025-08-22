-- إصلاح نظام الديون والنقاط للسائقين
-- منع الترميش عند الوصول للحد الأقصى

-- 1. تحديث جدول إعدادات النظام
UPDATE system_settings 
SET 
  debt_point_value = 250,
  max_debt_points = 20,
  updated_at = NOW()
WHERE id = 1;

-- إدراج القيم إذا لم تكن موجودة
INSERT INTO system_settings (id, debt_point_value, max_debt_points, created_at, updated_at)
VALUES (1, 250, 20, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  debt_point_value = EXCLUDED.debt_point_value,
  max_debt_points = EXCLUDED.max_debt_points,
  updated_at = NOW();

-- 2. إنشاء جدول سجل الديون
CREATE TABLE IF NOT EXISTS debt_logs (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    points_before INTEGER NOT NULL,
    points_after INTEGER NOT NULL,
    reason TEXT,
    created_by VARCHAR(50) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. إنشاء فهارس
CREATE INDEX IF NOT EXISTS idx_debt_logs_driver_id ON debt_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_debt_logs_created_at ON debt_logs(created_at);

-- 4. دالة تسجيل تغييرات الديون
CREATE OR REPLACE FUNCTION log_debt_change(
    p_driver_id INTEGER,
    p_action_type VARCHAR(50),
    p_points_before INTEGER,
    p_points_after INTEGER,
    p_reason TEXT DEFAULT NULL,
    p_created_by VARCHAR(50) DEFAULT 'system'
)
RETURNS void AS $$
BEGIN
    INSERT INTO debt_logs (driver_id, action_type, points_before, points_after, reason, created_by)
    VALUES (p_driver_id, p_action_type, p_points_before, p_points_after, p_reason, p_created_by);
END;
$$ LANGUAGE plpgsql;

-- 5. دالة تحديث آمن للديون
CREATE OR REPLACE FUNCTION safe_update_driver_debt(
    p_driver_id INTEGER,
    p_new_points INTEGER,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_points INTEGER;
    v_max_points INTEGER;
    v_is_suspended BOOLEAN;
    v_result JSON;
BEGIN
    SELECT debt_points, is_suspended INTO v_current_points, v_is_suspended
    FROM drivers WHERE id = p_driver_id;
    
    SELECT max_debt_points INTO v_max_points
    FROM system_settings WHERE id = 1;
    
    PERFORM log_debt_change(p_driver_id, 'update', v_current_points, p_new_points, p_reason);
    
    UPDATE drivers 
    SET debt_points = p_new_points, updated_at = NOW()
    WHERE id = p_driver_id;
    
    IF p_new_points >= v_max_points AND NOT v_is_suspended THEN
        UPDATE drivers 
        SET is_suspended = true, 
            suspension_reason = 'تم إيقافك مؤقتًا بسبب تجاوز حد الديون. يرجى التواصل مع الدعم الفني لتصفير الديون.',
            suspended_at = NOW(),
            updated_at = NOW()
        WHERE id = p_driver_id;
        
        PERFORM log_debt_change(p_driver_id, 'suspend', p_new_points, p_new_points, 'تجاوز الحد الأقصى');
        
        v_result := json_build_object('success', true, 'is_suspended', true, 'message', 'تم إيقاف السائق');
    ELSE
        IF p_new_points < v_max_points AND v_is_suspended THEN
            UPDATE drivers 
            SET is_suspended = false, 
                suspension_reason = NULL,
                suspended_at = NULL,
                updated_at = NOW()
            WHERE id = p_driver_id;
            
            PERFORM log_debt_change(p_driver_id, 'unsuspend', p_new_points, p_new_points, 'أصبح أقل من الحد');
        END IF;
        
        v_result := json_build_object('success', true, 'is_suspended', false, 'message', 'تم تحديث النقاط');
    END IF;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        v_result := json_build_object('success', false, 'error', SQLERRM);
        RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 6. دالة تصفير الديون
CREATE OR REPLACE FUNCTION clear_driver_debt(p_driver_id INTEGER, p_reason TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    v_current_points INTEGER;
    v_result JSON;
BEGIN
    SELECT debt_points INTO v_current_points
    FROM drivers WHERE id = p_driver_id;
    
    IF v_current_points IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'السائق غير موجود');
    END IF;
    
    PERFORM log_debt_change(p_driver_id, 'clear', v_current_points, 0, p_reason, 'admin');
    
    UPDATE drivers 
    SET debt_points = 0, updated_at = NOW()
    WHERE id = p_driver_id;
    
    UPDATE drivers 
    SET is_suspended = false, 
        suspension_reason = NULL,
        suspended_at = NULL,
        updated_at = NOW()
    WHERE id = p_driver_id AND is_suspended = true;
    
    v_result := json_build_object('success', true, 'message', 'تم تصفير الديون', 'points_cleared', v_current_points);
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 7. دالة تقليل الديون
CREATE OR REPLACE FUNCTION reduce_driver_debt(
    p_driver_id INTEGER, 
    p_reduce_points INTEGER, 
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_points INTEGER;
    v_new_points INTEGER;
    v_result JSON;
BEGIN
    SELECT debt_points INTO v_current_points
    FROM drivers WHERE id = p_driver_id;
    
    IF v_current_points IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'السائق غير موجود');
    END IF;
    
    v_new_points := GREATEST(0, v_current_points - p_reduce_points);
    
    PERFORM log_debt_change(p_driver_id, 'reduce', v_current_points, v_new_points, p_reason, 'admin');
    
    UPDATE drivers 
    SET debt_points = v_new_points, updated_at = NOW()
    WHERE id = p_driver_id;
    
    v_result := json_build_object('success', true, 'message', 'تم تقليل الديون', 'points_reduced', p_reduce_points, 'new_total', v_new_points);
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 8. دالة إضافة غرامة
CREATE OR REPLACE FUNCTION fine_driver(
    p_driver_id INTEGER, 
    p_fine_points INTEGER, 
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_points INTEGER;
    v_new_points INTEGER;
    v_result JSON;
BEGIN
    SELECT debt_points INTO v_current_points
    FROM drivers WHERE id = p_driver_id;
    
    IF v_current_points IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'السائق غير موجود');
    END IF;
    
    v_new_points := v_current_points + p_fine_points;
    
    PERFORM log_debt_change(p_driver_id, 'fine', v_current_points, v_new_points, p_reason, 'admin');
    
    UPDATE drivers 
    SET debt_points = v_new_points, updated_at = NOW()
    WHERE id = p_driver_id;
    
    v_result := json_build_object('success', true, 'message', 'تم إضافة غرامة', 'fine_points', p_fine_points, 'new_total', v_new_points);
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 9. إنشاء view لعرض حالة الديون
CREATE OR REPLACE VIEW driver_debt_status AS
SELECT 
    d.id,
    d.name,
    d.email,
    d.phone,
    d.debt_points,
    d.is_suspended,
    d.suspension_reason,
    d.suspended_at,
    s.max_debt_points,
    CASE 
        WHEN d.debt_points >= s.max_debt_points THEN 'blocked'
        WHEN d.debt_points >= (s.max_debt_points * 0.9) THEN 'danger'
        WHEN d.debt_points >= (s.max_debt_points * 0.7) THEN 'warning'
        ELSE 'normal'
    END as debt_status,
    CASE 
        WHEN d.debt_points >= s.max_debt_points THEN 'تم إيقافك - تجاوز الحد الأقصى'
        WHEN d.debt_points >= (s.max_debt_points * 0.9) THEN 'تحذير شديد - اقتربت من الحد الأقصى'
        WHEN d.debt_points >= (s.max_debt_points * 0.7) THEN 'تحذير - ديون عالية'
        ELSE 'حالة جيدة'
    END as debt_message,
    (d.debt_points * s.debt_point_value) as debt_value_dinar
FROM drivers d
CROSS JOIN system_settings s
WHERE s.id = 1;

-- تم إنشاء جميع الدوال والجداول بنجاح
SELECT 'تم إصلاح نظام الديون بنجاح!' as status;
